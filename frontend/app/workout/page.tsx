"use client";
import { useState } from "react";
import { Activity, CalendarDays, Dumbbell, Loader2, Sparkles, Timer } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useCurrentUserId } from "@/lib/currentUser";
import type { WorkoutPlanResponse } from "@/types";
import { EmptyState, PageHeader, Panel, PrimaryButton, StatusAlert, UserBadge } from "@/components/ui";

export default function WorkoutPage() {
  const currentUserId = useCurrentUserId();
  const [plan, setPlan] = useState<WorkoutPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!currentUserId) {
      setError("请先到 Profile 建档，设置当前 user_id。");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<WorkoutPlanResponse>("/workout/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUserId }),
      });
      setPlan(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workout plan"
        title="本周训练计划"
        description="生成一份保守、可执行的一周计划，配合饮食记录形成完整减脂闭环。"
        action={
          <div className="flex items-center gap-3">
            <UserBadge userId={currentUserId} />
            <PrimaryButton icon={loading ? Loader2 : Sparkles} onClick={handleGenerate} disabled={loading || !currentUserId}>
              {loading ? "生成中…" : "生成本周计划"}
            </PrimaryButton>
          </div>
        }
      />

      {error && <StatusAlert tone="red">{error}</StatusAlert>}

      {!currentUserId && (
        <StatusAlert tone="amber">
          请先到 <a href="/profile" className="font-bold underline">Profile</a> 建档，再生成训练计划。
        </StatusAlert>
      )}

      {!plan && !loading && (
        <EmptyState icon={Dumbbell} title="还没有训练计划" description="点击右上角按钮生成本周训练安排。" />
      )}

      {plan && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plan.plan.map((day, index) => (
              <Panel key={index} className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-950">{day.day}</p>
                      <p className="text-xs font-semibold text-slate-500">{day.focus}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">{day.exercises.length} 项</span>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <Timer className="h-4 w-4 text-emerald-600" />
                  {day.duration || "30-45分钟"}
                </div>

                <div className="mt-4 space-y-2">
                  {day.exercises.map((exercise, exerciseIndex) => (
                    <div key={exerciseIndex} className="rounded-lg bg-slate-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-bold text-slate-800">{exercise.name}</span>
                        <span className="shrink-0 text-xs font-semibold text-slate-500">{exercise.sets} 组 × {exercise.reps}</span>
                      </div>
                      {exercise.note && <p className="mt-1 text-xs leading-5 text-slate-500">{exercise.note}</p>}
                    </div>
                  ))}
                </div>
              </Panel>
            ))}
          </div>

          <Panel className="border-blue-100 bg-blue-50">
            <div className="flex items-start gap-3">
              <Activity className="mt-0.5 h-5 w-5 text-blue-600" />
              <p className="text-sm leading-6 text-blue-900">{plan.summary ?? plan.note}</p>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
