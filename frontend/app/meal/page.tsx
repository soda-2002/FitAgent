"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useCurrentUserId } from "@/lib/currentUser";
import type { MealPlanResponse } from "@/types";

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Meal Planner</h1>
        <span className="text-xs text-gray-400">user_id: {currentUserId ?? "未设置"}</span>
      </div>

      {!currentUserId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          请先到 <a href="/profile" className="underline font-medium">Profile</a> 建档，再生成减脂餐推荐。
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <label className="block text-sm font-medium text-gray-700">输入现有食材</label>
        <input
          type="text"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="例：鸡胸肉、鸡蛋、西红柿、米饭"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        <label className="block text-sm font-medium text-gray-700">饮食偏好</label>
        <input
          type="text"
          value={preference}
          onChange={(e) => setPreference(e.target.value)}
          placeholder="例：高蛋白、低脂"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        <button onClick={handleGenerate} disabled={loading || !ingredients.trim() || !currentUserId}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
          {loading ? "生成中…" : "推荐减脂餐"}
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>

      {result && (
        <div className="space-y-4">
          {result.meals.map((plan, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">方案 {String.fromCharCode(65 + i)}：{plan.name}</h2>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{plan.difficulty}</span>
              </div>
              <p className="text-xs text-gray-500">推荐原因：{plan.reason}</p>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-600">{plan.calories} kcal</span>
                <span className="text-gray-600">蛋白 {plan.protein}g</span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">制作步骤：</p>
                <ol className="list-decimal list-inside space-y-0.5 text-sm text-gray-700">
                  {plan.steps.map((s, j) => <li key={j}>{s}</li>)}
                </ol>
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400 italic">{result.suggestion}</p>
        </div>
      )}
    </div>
  );
}
