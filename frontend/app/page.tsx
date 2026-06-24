"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Apple, Dumbbell, Flame, LineChart, Salad, Sparkles, UserRound, Utensils } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useCurrentUserId } from "@/lib/currentUser";
import type { DashboardResponse } from "@/types";
import { EmptyState, MetricCard, PageHeader, Panel, StatusAlert, UserBadge, cn } from "@/components/ui";

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

  const profile = dashboard?.profile;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Today overview"
        title="Dashboard"
        description="把饮食、打卡、训练计划和 AI 建议放在一个地方，快速看清今天的减脂状态。"
        action={<UserBadge userId={currentUserId} />}
      />

      {!currentUserId && (
        <EmptyState
          icon={UserRound}
          title="先建立你的减脂档案"
          description="FitAgent 需要身高、体重、目标和训练偏好，才能展示真实 Dashboard 统计。"
          href="/profile"
          actionLabel="去 Profile 建档"
        />
      )}

      {dashboardError && <StatusAlert tone="red">{dashboardError}</StatusAlert>}

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel className="overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-lime-400 p-0 text-white">
          <div className="relative p-6">
            <div className="absolute right-6 top-6 rounded-full bg-white/20 p-3">
              <Activity className="h-8 w-8" />
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/75">Fit status</p>
            <h2 className="mt-3 max-w-md text-3xl font-black leading-tight">
              {profile?.goal || "开始记录后，FitAgent 会形成你的减脂状态面板"}
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <HeroStat label="当前体重" value={profile?.weight ? `${profile.weight} kg` : "--"} />
              <HeroStat label="目标体重" value={profile?.target_weight ? `${profile.target_weight} kg` : "--"} />
              <HeroStat label="今日饮食" value={`${dashboard?.today.food_logs_count ?? 0} 条`} />
              <HeroStat label="后端状态" value={health === "ok" ? "Online" : health === "error" ? "Offline" : "Checking"} />
            </div>
          </div>
        </Panel>

        <Panel className="border-amber-100 bg-amber-50/80">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white p-2 text-amber-600 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">AI Coach hint</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">今日建议</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {dashboard?.suggestion ?? "完成建档和记录后，这里会显示基于真实数据的建议。"}
              </p>
              <p className="mt-4 text-xs text-amber-700">建议仅用于减脂管理 Demo，不构成医疗建议。</p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="今日摄入热量" value={`${(dashboard?.today.total_calories ?? 0).toFixed(0)} kcal`} icon={Flame} tone="amber" />
        <MetricCard label="今日蛋白质" value={`${(dashboard?.today.total_protein ?? 0).toFixed(1)} g`} icon={Apple} tone="emerald" />
        <MetricCard label="今日饮食记录" value={`${dashboard?.today.food_logs_count ?? 0} 条`} icon={Utensils} tone="cyan" />
        <MetricCard label="7 天平均热量" value={`${(dashboard?.week.avg_calories ?? 0).toFixed(0)} kcal`} icon={LineChart} tone="blue" />
        <MetricCard label="7 天平均蛋白质" value={`${(dashboard?.week.avg_protein ?? 0).toFixed(1)} g`} icon={Salad} tone="lime" />
        <MetricCard label="训练计划" value={dashboard?.week.workout_plan_exists ? "已生成" : "未生成"} icon={Dumbbell} tone="slate" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <h2 className="text-lg font-black text-slate-950">最近 7 天记录</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniProgress label="饮食记录" value={dashboard?.week.food_logs_count ?? 0} target={7} />
            <MiniProgress label="每日打卡" value={dashboard?.week.daily_logs_count ?? 0} target={7} />
          </div>
          {dashboard && dashboard.week.food_logs_count === 0 && (
            <ActionHint href="/food" icon={Salad} text="还没有饮食记录，先去 Food 页面记录一餐。" />
          )}
        </Panel>

        <Panel>
          <h2 className="text-lg font-black text-slate-950">下一步</h2>
          <div className="mt-4 space-y-3">
            <ActionRow href="/food" icon={Utensils} title="记录一餐" active={(dashboard?.week.food_logs_count ?? 0) === 0} />
            <ActionRow href="/daily" icon={Activity} title="完成今日打卡" active={(dashboard?.week.daily_logs_count ?? 0) === 0} />
            <ActionRow href="/workout" icon={Dumbbell} title="生成训练计划" active={!dashboard?.week.workout_plan_exists} />
          </div>
        </Panel>
      </div>

      {dashboardLoading && <StatusAlert tone="blue">正在刷新 Dashboard 数据…</StatusAlert>}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/16 p-3 backdrop-blur">
      <p className="text-xs font-semibold text-white/70">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function MiniProgress({ label, value, target }: { label: string; value: number; target: number }) {
  const percent = Math.min(100, Math.round((value / target) * 100));
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold text-slate-700">{label}</span>
        <span className="text-slate-500">{value}/{target}</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ActionHint({ href, icon: Icon, text }: { href: string; icon: typeof Salad; text: string }) {
  return (
    <Link href={href} className="mt-4 flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
      <Icon className="h-4 w-4" />
      {text}
    </Link>
  );
}

function ActionRow({ href, icon: Icon, title, active }: { href: string; icon: typeof Salad; title: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-bold transition",
        active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      )}
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {title}
      </span>
      <span>{active ? "建议完成" : "已就绪"}</span>
    </Link>
  );
}
