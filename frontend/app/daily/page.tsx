"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useCurrentUserId } from "@/lib/currentUser";
import type { DailyLog } from "@/types";

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
      setSaved("✓ 今日打卡已保存");
      await loadLogs(currentUserId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "保存打卡失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Daily Check-in</h1>
        <span className="text-xs text-gray-400">user_id: {currentUserId ?? "未设置"}</span>
      </div>

      {!currentUserId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          请先到 <a href="/profile" className="underline font-medium">Profile</a> 建档，再提交每日打卡。
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="今日体重 (kg)"
            name="weight"
            type="number"
            value={form.weight}
            onChange={handleChange}
            step="0.1"
            placeholder="例：79.5"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">心情</label>
            <select
              name="mood"
              value={form.mood}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <option value="">请选择</option>
              <option value="很好">很好</option>
              <option value="一般">一般</option>
              <option value="疲惫">疲惫</option>
              <option value="压力大">压力大</option>
            </select>
          </div>
          <Field
            label="睡眠小时"
            name="sleep_hours"
            type="number"
            value={form.sleep_hours}
            onChange={handleChange}
            step="0.5"
            placeholder="例：7"
          />
          <label className="flex items-center gap-2 text-sm text-gray-700 pt-7">
            <input
              type="checkbox"
              checked={form.workout_done}
              onChange={(e) => setForm((prev) => ({ ...prev, workout_done: e.target.checked }))}
              className="w-4 h-4"
            />
            今天完成训练
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">今日总结</label>
          <textarea
            name="summary"
            value={form.summary}
            onChange={handleChange}
            rows={3}
            placeholder="例：今天饮食基本正常，晚上做了 30 分钟有氧。"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !currentUserId}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
        >
          {saving ? "保存中…" : "保存打卡"}
        </button>
        {saved && <p className="text-green-600 text-sm">{saved}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-3">最近 7 条打卡</h2>
        {loading ? (
          <p className="text-sm text-gray-400">正在读取打卡记录…</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-400">还没有打卡记录。</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="border border-gray-100 rounded-lg px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-600">
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                  <span>体重：{log.weight ? `${log.weight} kg` : "—"}</span>
                  <span>心情：{log.mood || "—"}</span>
                  <span>睡眠：{log.sleep_hours ? `${log.sleep_hours} h` : "—"}</span>
                  <span>训练：{log.workout_done ? "已完成" : "未记录"}</span>
                </div>
                {log.summary && <p className="text-gray-800 mt-2">{log.summary}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  value,
  onChange,
  step,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        step={step}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
      />
    </div>
  );
}
