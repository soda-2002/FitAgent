"use client";
import { useState } from "react";
import { ChefHat, Flame, Loader2, Salad, Sparkles, Utensils } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useCurrentUserId } from "@/lib/currentUser";
import type { MealPlanResponse } from "@/types";
import { EmptyState, FormField, PageHeader, Panel, PrimaryButton, StatusAlert, UserBadge, inputClass } from "@/components/ui";

export default function MealPlannerPage() {
  const currentUserId = useCurrentUserId();
  const [ingredients, setIngredients] = useState("");
  const [preference, setPreference] = useState("高蛋白、低脂");
  const [result, setResult] = useState<MealPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!currentUserId) {
      setError("请先到 Profile 建档，设置当前 user_id。");
      return;
    }
    if (!ingredients.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await apiFetch<MealPlanResponse>("/meal/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId,
          ingredients,
          preference,
        }),
      });
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Meal planner"
        title="减脂餐推荐"
        description="输入手头食材和偏好，让 FitAgent 给出简单、低油、高蛋白的搭配。"
        action={<UserBadge userId={currentUserId} />}
      />

      {!currentUserId && (
        <StatusAlert tone="amber">
          请先到 <a href="/profile" className="font-bold underline">Profile</a> 建档，再生成减脂餐推荐。
        </StatusAlert>
      )}

      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Panel className="self-start">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-lime-50 p-2 text-lime-700">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">食材输入</h2>
              <p className="text-sm text-slate-500">写常见食材即可，不需要精确克重。</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <FormField label="现有食材">
              <input
                type="text"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="例：鸡胸肉、鸡蛋、西红柿、米饭"
                className={inputClass}
              />
            </FormField>
            <FormField label="饮食偏好">
              <input
                type="text"
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                placeholder="例：高蛋白、低脂"
                className={inputClass}
              />
            </FormField>
            <PrimaryButton icon={loading ? Loader2 : Sparkles} onClick={handleGenerate} disabled={loading || !ingredients.trim() || !currentUserId} className="w-full">
              {loading ? "生成中…" : "推荐减脂餐"}
            </PrimaryButton>
            {error && <StatusAlert tone="red">{error}</StatusAlert>}
          </div>
        </Panel>

        <div className="space-y-4">
          {!result ? (
            <EmptyState icon={Salad} title="还没有餐单" description="输入食材后，FitAgent 会生成 1-3 个适合减脂期的方案。" />
          ) : (
            <>
              {result.meals.map((plan, index) => (
                <Panel key={index}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">方案 {String.fromCharCode(65 + index)}</p>
                      <h2 className="mt-1 text-xl font-black text-slate-950">{plan.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{plan.reason}</p>
                    </div>
                    <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      {plan.difficulty}
                    </span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <MealMetric icon={Flame} label="热量" value={`${plan.calories} kcal`} />
                    <MealMetric icon={Utensils} label="蛋白质" value={`${plan.protein}g`} />
                  </div>
                  <div className="mt-5">
                    <p className="text-sm font-black text-slate-900">制作步骤</p>
                    <ol className="mt-3 space-y-2">
                      {plan.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">{stepIndex + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </Panel>
              ))}
              <StatusAlert tone="blue">{result.suggestion}</StatusAlert>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MealMetric({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <Icon className="h-5 w-5 text-emerald-600" />
      <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}
