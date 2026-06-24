"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useCurrentUserId } from "@/lib/currentUser";
import type { UserProfile, FoodLog } from "@/types";

interface HealthResponse {
  status: string;
  message: string;
}

export default function DashboardPage() {
  const [health, setHealth] = useState<"checking" | "ok" | "error">("checking");
  const currentUserId = useCurrentUserId();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayLogs, setTodayLogs] = useState<FoodLog[]>([]);

  useEffect(() => {
    apiFetch<HealthResponse>("/health")
      .then(() => setHealth("ok"))
      .catch(() => setHealth("error"));

    if (!currentUserId) return;

    apiFetch<UserProfile>(`/profile/${currentUserId}`)
      .then(setProfile)
      .catch(() => setProfile(null));

    apiFetch<FoodLog[]>(`/food/logs/${currentUserId}`)
      .then((logs) => {
        const today = new Date().toISOString().slice(0, 10);
        setTodayLogs(logs.filter((l) => l.date === today || l.created_at.startsWith(today)));
      })
      .catch(() => setTodayLogs([]));
  }, [currentUserId]);

  const totalCal = todayLogs.reduce((s, l) => s + (l.calories ?? 0), 0);
  const totalProtein = todayLogs.reduce((s, l) => s + (l.protein ?? 0), 0);

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
        ) : profile ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <Stat label="身高" value={profile.height ? `${profile.height} cm` : "—"} />
            <Stat label="体重" value={profile.weight ? `${profile.weight} kg` : "—"} />
            <Stat label="目标体重" value={profile.target_weight ? `${profile.target_weight} kg` : "—"} />
            <Stat label="目标" value={profile.goal ?? "—"} />
          </div>
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
        <StatCard label="今日摄入热量" value={`${totalCal.toFixed(0)} kcal`} color="green" />
        <StatCard label="今日蛋白质" value={`${totalProtein.toFixed(1)} g`} color="blue" />
        <StatCard label="今日训练" value="— (mock)" color="purple" />
      </div>

      {/* AI Suggestion mock */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-amber-700 mb-2">AI 今日建议 (mock)</h2>
        <p className="text-sm text-amber-800">
          {totalProtein < 50
            ? "今天蛋白质摄入不足，晚餐建议增加 30g 蛋白质（如鸡胸肉或鸡蛋）。"
            : "今日营养摄入均衡，保持训练节奏。"}
        </p>
        <p className="text-xs text-amber-500 mt-2">Phase 2 接入 Qwen 后将基于真实数据生成建议。</p>
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
