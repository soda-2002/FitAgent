"use client";
import { useState, useRef } from "react";
import { apiFetch, API_BASE } from "@/lib/api";
import { useCurrentUserId } from "@/lib/currentUser";
import type { FoodAnalyzeResponse, FoodLog } from "@/types";

export default function FoodPage() {
  const [tab, setTab] = useState<"text" | "image">("text");
  const currentUserId = useCurrentUserId();

  // text
  const [textInput, setTextInput] = useState("");
  const [textResult, setTextResult] = useState<FoodAnalyzeResponse | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState("");

  // image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<FoodAnalyzeResponse | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");

  // saved
  const [savedMsg, setSavedMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleTextAnalyze() {
    if (!currentUserId) {
      setTextError("请先到 Profile 建档，设置当前 user_id。");
      return;
    }
    if (!textInput.trim()) return;
    setTextLoading(true);
    setTextError("");
    setTextResult(null);
    try {
      const res = await apiFetch<FoodAnalyzeResponse>("/food/text-analyze/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUserId, text: textInput }),
      });
      setTextResult(res);
    } catch (err: unknown) {
      setTextError(err instanceof Error ? err.message : "分析失败");
    } finally {
      setTextLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageResult(null);
  }

  async function handleImageAnalyze() {
    if (!currentUserId) {
      setImageError("请先到 Profile 建档，设置当前 user_id。");
      return;
    }
    if (!imageFile) return;
    setImageLoading(true);
    setImageError("");
    setImageResult(null);
    try {
      const formData = new FormData();
      formData.append("user_id", String(currentUserId));
      formData.append("image", imageFile);
      const res = await fetch(`${API_BASE}/food/image-analyze/mock`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setImageResult(await res.json());
    } catch (err: unknown) {
      setImageError(err instanceof Error ? err.message : "分析失败");
    } finally {
      setImageLoading(false);
    }
  }

  async function handleSave(result: FoodAnalyzeResponse) {
    setSavedMsg("");
    if (!currentUserId) {
      setSavedMsg("请先到 Profile 建档，设置当前 user_id。");
      return;
    }
    try {
      for (const food of result.foods) {
        await apiFetch<FoodLog>("/food/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: currentUserId,
            food_name: food.name,
            estimated_weight: food.estimated_weight,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            date: new Date().toISOString().slice(0, 10),
            source: tab,
          }),
        });
      }
      setSavedMsg(`✓ 已保存 ${result.foods.length} 条饮食记录`);
    } catch {
      setSavedMsg("保存失败");
    }
  }

  const activeResult = tab === "text" ? textResult : imageResult;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Food Analyzer</h1>
        <span className="text-xs text-gray-400">user_id: {currentUserId ?? "未设置"}</span>
      </div>

      {!currentUserId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          请先到 <a href="/profile" className="underline font-medium">Profile</a> 建档。未设置当前用户时不会提交分析或保存记录。
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(["text", "image"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {t === "text" ? "文字输入" : "图片上传"}
          </button>
        ))}
      </div>

      {tab === "text" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <label className="block text-sm font-medium text-gray-700">输入今日饮食描述</label>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="例：两个鸡蛋，一碗米饭，一杯牛奶"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-300"
          />
          <button onClick={handleTextAnalyze} disabled={textLoading || !textInput.trim() || !currentUserId}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
            {textLoading ? "分析中…" : "开始分析"}
          </button>
          {textError && <p className="text-red-600 text-sm">{textError}</p>}
        </div>
      )}

      {tab === "image" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <label className="block text-sm font-medium text-gray-700">上传食物图片</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-400 transition-colors">
            {imagePreview ? (
              <img src={imagePreview} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain" />
            ) : (
              <p className="text-gray-400 text-sm">点击或拖拽图片到此处</p>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <button onClick={handleImageAnalyze} disabled={imageLoading || !imageFile || !currentUserId}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
            {imageLoading ? "识别中…" : "识别食物"}
          </button>
          {imageError && <p className="text-red-600 text-sm">{imageError}</p>}
        </div>
      )}

      {/* Results */}
      {activeResult && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">分析结果</h2>
          <div className="space-y-2">
            {activeResult.foods.map((food, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 text-sm">
                <span className="font-medium text-gray-800">{food.name} {food.estimated_weight && `(${food.estimated_weight})`}</span>
                <span className="text-gray-500">{food.calories} kcal · 蛋白 {food.protein}g · 碳水 {food.carbs}g · 脂肪 {food.fat}g</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm font-semibold text-gray-700 border-t border-gray-100 pt-3">
            <span>总热量</span>
            <span>{activeResult.total_calories} kcal</span>
          </div>
          <p className="text-xs text-gray-400 italic">{activeResult.suggestion}</p>
          <button onClick={() => handleSave(activeResult)} disabled={!currentUserId}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
            确认并保存记录
          </button>
          {savedMsg && <p className="text-green-600 text-sm">{savedMsg}</p>}
        </div>
      )}
    </div>
  );
}
