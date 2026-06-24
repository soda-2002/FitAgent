"use client";
import { useEffect, useState } from "react";
import { CalendarCheck, CheckCircle2, Clock, Dumbbell, HeartPulse, Moon, Save, Scale } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useCurrentUserId } from "@/lib/currentUser";
import type { DailyLog } from "@/types";
import { EmptyState, FormField, PageHeader, Panel, PrimaryButton, StatusAlert, UserBadge, cn, inputClass, textareaClass } from "@/components/ui";

interface DailyForm {
  weight: string;
  mood: string;
  workout_done: boolean;
  sleep_hours: string;
  summary: string;
}

const initialForm: DailyForm = {
  weight: "",
  mood: "",
  workout_done: false,
  sleep_hours: "",
  summary: "",
};

export default function DailyPage() {
  const currentUserId = useCurrentUserId();
  const [form, setForm] = useState<DailyForm>(initialForm);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadLogs(currentUserId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [currentUserId]);

  async function loadLogs(userId: number | null) {
    await Promise.resolve();

    if (!userId) {
      setLogs([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<DailyLog[]>(`/daily/logs/${userId}`);
      setLogs(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "读取打卡记录失败");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId) {
      setError("请先到 Profile 建档，设置当前 user_id。");
      return;
    }

    setSaving(true);
    setError("");
    setSaved("");
    try {
      await apiFetch<DailyLog>("/daily/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId,
          weight: form.weight ? Number(form.weight) : null,
          mood: form.mood || null,
          workout_done: form.workout_done,
          sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : null,
          summary: form.summary || null,
        }),
      });
      setForm(initialForm);
      setSaved("今日打卡已保存");
      await loadLogs(currentUserId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "保存打卡失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily check-in"
        title="每日打卡"
        description="用 30 秒记录体重、睡眠、训练和当天感受，让周总结有真实依据。"
        action={<UserBadge userId={currentUserId} />}
      />

      {!currentUserId && (
        <StatusAlert tone="amber">
          请先到 <a href="/profile" className="font-bold underline">Profile</a> 建档，再提交每日打卡。
        </StatusAlert>
      )}

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">今日状态</h2>
              <p className="text-sm text-slate-500">保持轻量，先记录下来比完美更重要。</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="今日体重 (kg)">
                <input name="weight" type="number" value={form.weight} onChange={handleChange} step="0.1" placeholder="例：79.5" className={inputClass} />
              </FormField>
              <FormField label="心情">
                <select name="mood" value={form.mood} onChange={handleChange} className={inputClass}>
                  <option value="">请选择</option>
                  <option value="很好">很好</option>
                  <option value="一般">一般</option>
                  <option value="疲惫">疲惫</option>
                  <option value="压力大">压力大</option>
                </select>
              </FormField>
              <FormField label="睡眠小时">
                <input name="sleep_hours" type="number" value={form.sleep_hours} onChange={handleChange} step="0.5" placeholder="例：7" className={inputClass} />
              </FormField>
              <div>
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">训练完成</span>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, workout_done: !prev.workout_done }))}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm font-bold shadow-sm transition",
                    form.workout_done ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4" />
                    {form.workout_done ? "今天已完成训练" : "今天未标记训练"}
                  </span>
                  <span className={cn("h-6 w-11 rounded-full p-1 transition", form.workout_done ? "bg-emerald-500" : "bg-slate-200")}>
                    <span className={cn("block h-4 w-4 rounded-full bg-white transition", form.workout_done && "translate-x-5")} />
                  </span>
                </button>
              </div>
            </div>

            <FormField label="今日总结">
              <textarea
                name="summary"
                value={form.summary}
                onChange={handleChange}
                rows={4}
                placeholder="例：今天饮食基本正常，晚上做了 30 分钟有氧。"
                className={textareaClass}
              />
            </FormField>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <PrimaryButton type="submit" icon={Save} disabled={saving || !currentUserId}>
                {saving ? "保存中…" : "保存打卡"}
              </PrimaryButton>
              {saved && (
                <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> {saved}
                </span>
              )}
            </div>
            {error && <StatusAlert tone="red">{error}</StatusAlert>}
          </form>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">最近 7 条打卡</h2>
              <p className="mt-1 text-sm text-slate-500">把趋势留给之后的周总结判断。</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{logs.length} 条</span>
          </div>

          <div className="mt-5">
            {loading ? (
              <StatusAlert tone="blue">正在读取打卡记录…</StatusAlert>
            ) : logs.length === 0 ? (
              <EmptyState icon={CalendarCheck} title="还没有打卡记录" description="保存今天的状态后，最近记录会显示在这里。" />
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="relative border-l-2 border-emerald-100 pl-5">
                    <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                        <Badge icon={Clock} text={new Date(log.created_at).toLocaleString()} />
                        <Badge icon={Scale} text={log.weight ? `${log.weight} kg` : "体重 --"} />
                        <Badge icon={HeartPulse} text={log.mood || "心情 --"} />
                        <Badge icon={Moon} text={log.sleep_hours ? `${log.sleep_hours} h` : "睡眠 --"} />
                        <Badge icon={Dumbbell} text={log.workout_done ? "已训练" : "未训练"} />
                      </div>
                      {log.summary && <p className="mt-3 text-sm leading-6 text-slate-800">{log.summary}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Badge({ icon: Icon, text }: { icon: typeof Clock; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm">
      <Icon className="h-3.5 w-3.5" />
      {text}
    </span>
  );
}
