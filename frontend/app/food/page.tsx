"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, CheckCircle2, Flame, ImagePlus, Loader2, MessageSquareText, Salad, Save, Sparkles, UploadCloud } from "lucide-react";
import { apiFetch, API_BASE } from "@/lib/api";
import { useCurrentUserId } from "@/lib/currentUser";
import type { FoodAnalyzeResponse, FoodLog } from "@/types";
import { FormField, PageHeader, Panel, PrimaryButton, StatusAlert, UserBadge, cn, textareaClass } from "@/components/ui";

export default function FoodPage() {
  const [tab, setTab] = useState<"text" | "image">("text");
  const currentUserId = useCurrentUserId();

  const [textInput, setTextInput] = useState("");
  const [textResult, setTextResult] = useState<FoodAnalyzeResponse | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<FoodAnalyzeResponse | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");

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
      const res = await apiFetch<FoodAnalyzeResponse>("/food/text-analyze", {
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
      const res = await fetch(`${API_BASE}/food/image-analyze`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(`HTTP ${res.status}: ${message}`);
      }
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
      <PageHeader
        eyebrow="Food analyzer"
        title="饮食分析工作台"
        description="用文字或图片快速估算热量和营养，确认后保存到你的饮食记录。"
        action={<UserBadge userId={currentUserId} />}
      />

      {!currentUserId && (
        <StatusAlert tone="amber">
          请先到 <a href="/profile" className="font-bold underline">Profile</a> 建档。未设置当前用户时不会提交分析或保存记录。
        </StatusAlert>
      )}

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel>
          <div className="rounded-lg bg-slate-100 p-1">
            {(["text", "image"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={cn(
                  "inline-flex w-1/2 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-black transition",
                  tab === item ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-900",
                )}
              >
                {item === "text" ? <MessageSquareText className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                {item === "text" ? "文字输入" : "图片上传"}
              </button>
            ))}
          </div>

          {tab === "text" && (
            <div className="mt-5 space-y-4">
              <FormField label="输入今日饮食描述" hint="写自然语言即可，例如：两个鸡蛋，一碗米饭，一杯牛奶。">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="今天早餐吃了两个鸡蛋、一碗燕麦和一杯拿铁。"
                  rows={7}
                  className={textareaClass}
                />
              </FormField>
              <div className="flex justify-end">
                <PrimaryButton icon={textLoading ? Loader2 : Sparkles} onClick={handleTextAnalyze} disabled={textLoading || !textInput.trim() || !currentUserId}>
                  {textLoading ? "分析中…" : "开始分析"}
                </PrimaryButton>
              </div>
              {textError && <StatusAlert tone="red">{textError}</StatusAlert>}
            </div>
          )}

          {tab === "image" && (
            <div className="mt-5 space-y-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex min-h-72 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50"
              >
                {imagePreview ? (
                  <Image src={imagePreview} alt="preview" width={720} height={420} unoptimized className="max-h-72 w-auto rounded-lg object-contain shadow-sm" />
                ) : (
                  <div>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                      <UploadCloud className="h-7 w-7" />
                    </div>
                    <p className="mt-4 text-sm font-bold text-slate-800">点击上传食物图片</p>
                    <p className="mt-1 text-xs text-slate-500">支持 jpg、png、webp，大小不超过 5MB</p>
                  </div>
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <div className="flex justify-end">
                <PrimaryButton icon={imageLoading ? Loader2 : ImagePlus} onClick={handleImageAnalyze} disabled={imageLoading || !imageFile || !currentUserId}>
                  {imageLoading ? "识别中…" : "识别食物"}
                </PrimaryButton>
              </div>
              {imageError && <StatusAlert tone="red">{imageError}</StatusAlert>}
            </div>
          )}
        </Panel>

        <Panel className={cn(!activeResult && "flex min-h-[420px] items-center justify-center")}>
          {!activeResult ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                <Salad className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-xl font-black text-slate-950">等待分析结果</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">完成文字或图片分析后，这里会展示食物明细、总热量和保存入口。</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-600">Result</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">分析结果</h2>
                </div>
                <div className="rounded-lg bg-amber-50 px-4 py-3 text-right">
                  <p className="text-xs font-bold text-amber-700">总热量</p>
                  <p className="text-2xl font-black text-slate-950">{activeResult.total_calories} kcal</p>
                </div>
              </div>

              <div className="grid gap-3">
                {activeResult.foods.map((food, index) => (
                  <div key={`${food.name}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-black text-slate-950">{food.name}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{food.estimated_weight || "unknown"}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-700 shadow-sm">
                        <Flame className="h-3.5 w-3.5" /> {food.calories} kcal
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-semibold text-slate-600">
                      <Nutrient label="蛋白" value={`${food.protein}g`} />
                      <Nutrient label="碳水" value={`${food.carbs}g`} />
                      <Nutrient label="脂肪" value={`${food.fat}g`} />
                    </div>
                  </div>
                ))}
              </div>

              <StatusAlert tone={tab === "image" ? "amber" : "blue"}>{activeResult.suggestion}</StatusAlert>
              {tab === "image" && <p className="text-xs font-semibold text-amber-700">图片识别热量仅为估算，请确认份量后保存。</p>}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <PrimaryButton icon={Save} variant="blue" onClick={() => handleSave(activeResult)} disabled={!currentUserId}>
                  确认并保存记录
                </PrimaryButton>
                {savedMsg && (
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> {savedMsg.replace("✓ ", "")}
                  </span>
                )}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Nutrient({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white px-3 py-2">
      <p className="text-slate-400">{label}</p>
      <p className="mt-1 text-slate-900">{value}</p>
    </div>
  );
}
