"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useCurrentUserId } from "@/lib/currentUser";
import type { DashboardResponse } from "@/types";

interface HealthResponse {
  status: string;
  message: string;
}

export default function DashboardPage() {
  const [health, setHealth] = useState<"checking" | "ok" | "error">("checking");
  const currentUserId = useCurrentUserId();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  async function loadDashboard(userId: number | null) {
    await Promise.resolve();

    if (!userId) {
      setDashboard(null);
      setDashboardError("");
      return;
    }

    setDashboardLoading(true);
    setDashboardError("");
    apiFetch<DashboardResponse>(`/dashboard/${userId}`)
      .then(setDashboard)
      .catch((err: unknown) => {
        setDashboard(null);
        setDashboardError(err instanceof Error ? err.message : "Dashboard 读取失败");
      })
      .finally(() => setDashboardLoading(false));
  }

  useEffect(() => {
    apiFetch<HealthResponse>("/health")
      .then(() => setHealth("ok"))
      .catch(() => setHealth("error"));

    const timer = window.setTimeout(() => {
      loadDashboard(currentUserId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [currentUserId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <span
          className={`flex items-center gap-1.5 text-sm px-3 py-1 rounded-full font-medium ${
            health === "ok"
              ? "bg-green-100 text-green-700"
              : health === "error"
              ? "bg-red-100 text-red-600"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              health === "ok" ? "bg-green-500" : health === "error" ? "bg-red-500" : "bg-gray-400"
            }`}
          />
          {health === "ok" ? "Backend Connected" : health === "error" ? "Backend Offline" : "Connecting…"}
        </span>
      </div>

      {/* Profile Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">User Profile</h2>
          <span className="text-xs text-gray-400">user_id: {currentUserId ?? "未设置"}</span>
        </div>
        {!currentUserId ? (
          <p className="text-sm text-gray-400">
            还没有当前用户。请先前往{" "}
            <a href="/profile" className="text-green-600 underline">
              Profile
            </a>{" "}
            建档。
          </p>
        ) : dashboard?.profile ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <Stat label="身高" value={dashboard.profile.height ? `${dashboard.profile.height} cm` : "—"} />
            <Stat label="体重" value={dashboard.profile.weight ? `${dashboard.profile.weight} kg` : "—"} />
            <Stat label="目标体重" value={dashboard.profile.target_weight ? `${dashboard.profile.target_weight} kg` : "—"} />
            <Stat label="目标" value={dashboard.profile.goal ?? "—"} />
          </div>
        ) : dashboardLoading ? (
          <p className="text-sm text-gray-400">正在读取 Dashboard 数据…</p>
        ) : (
          <p className="text-sm text-gray-400">
            当前用户资料读取失败。请前往{" "}
            <a href="/profile" className="text-green-600 underline">
              Profile
            </a>{" "}
            页面填写信息。
          </p>
        )}
      </div>

      {/* Today Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="今日摄入热量" value={`${(dashboard?.today.total_calories ?? 0).toFixed(0)} kcal`} color="green" />
        <StatCard label="今日蛋白质" value={`${(dashboard?.today.total_protein ?? 0).toFixed(1)} g`} color="blue" />
        <StatCard label="今日饮食记录" value={`${dashboard?.today.food_logs_count ?? 0} 条`} color="purple" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="7 天平均热量" value={`${(dashboard?.week.avg_calories ?? 0).toFixed(0)} kcal`} color="green" />
        <StatCard label="7 天平均蛋白质" value={`${(dashboard?.week.avg_protein ?? 0).toFixed(1)} g`} color="blue" />
        <StatCard label="训练计划" value={dashboard?.week.workout_plan_exists ? "已生成" : "未生成"} color="purple" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent 7 Days</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Stat label="饮食记录数量" value={`${dashboard?.week.food_logs_count ?? 0} 条`} />
          <Stat label="每日打卡数量" value={`${dashboard?.week.daily_logs_count ?? 0} 条`} />
        </div>
        {dashboard && dashboard.week.food_logs_count === 0 && (
          <p className="text-sm text-gray-400 mt-3">
            还没有饮食记录，先去 <a href="/food" className="text-green-600 underline">Food</a> 页面记录一餐。
          </p>
        )}
      </div>

      {dashboardError && <p className="text-red-600 text-sm">{dashboardError}</p>}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-amber-700 mb-2">今日建议</h2>
        <p className="text-sm text-amber-800">{dashboard?.suggestion ?? "完成建档和记录后，这里会显示基于真实数据的建议。"}</p>
        <p className="text-xs text-amber-500 mt-2">建议仅用于减脂管理 Demo，不构成医疗建议。</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    green: "bg-green-50 border-green-200 text-green-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
