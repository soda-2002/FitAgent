"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useCurrentUserId } from "@/lib/currentUser";
import type { WorkoutPlanResponse } from "@/types";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Workout Plan</h1>
          <p className="text-xs text-gray-400 mt-1">user_id: {currentUserId ?? "未设置"}</p>
        </div>
        <button onClick={handleGenerate} disabled={loading || !currentUserId}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
          {loading ? "生成中…" : "生成本周计划"}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!currentUserId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          请先到 <a href="/profile" className="underline font-medium">Profile</a> 建档，再生成训练计划。
        </div>
      )}

      {plan && (
        <div className="space-y-3">
          {plan.plan.map((day, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">
                  {day.day.slice(0, 3)}
                </span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{day.day}</p>
                  <p className="text-xs text-gray-500">
                    {day.focus}{day.duration ? ` · ${day.duration}` : ""}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                {day.exercises.map((ex, j) => (
                  <div key={j} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-1.5">
                    <span className="text-gray-700">{ex.name}</span>
                    <span className="text-gray-400 text-xs">{ex.sets} 组 × {ex.reps}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400 italic">{plan.summary ?? plan.note}</p>
        </div>
      )}

      {!plan && !loading && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400 text-sm">
          点击「生成本周计划」获取 AI 健身建议
        </div>
      )}
    </div>
  );
}
