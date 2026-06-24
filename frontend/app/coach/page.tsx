"use client";
import { useEffect, useRef, useState } from "react";
import { Bot, Brain, CheckCircle2, Dumbbell, Loader2, MessageCircle, Send, Sparkles, Utensils } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useCurrentUserId } from "@/lib/currentUser";
import type { AgentChatResponse, WeekReportResponse } from "@/types";
import { PageHeader, Panel, PrimaryButton, StatusAlert, UserBadge, cn, inputClass } from "@/components/ui";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function CoachPage() {
  const currentUserId = useCurrentUserId();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "你好，我是 FitAgent。你可以问我饮食建议、训练计划或本周进展，我会结合你的记录给出建议。" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [weekReport, setWeekReport] = useState<WeekReportResponse | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || !currentUserId) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await apiFetch<AgentChatResponse>("/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUserId, message: text }),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "抱歉，服务暂时不可用，请稍后重试。" }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleWeekReport() {
    if (!currentUserId || reportLoading) return;
    setReportLoading(true);
    setReportError("");
    setWeekReport(null);
    try {
      const res = await apiFetch<WeekReportResponse>("/agent/week-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUserId }),
      });
      setWeekReport(res);
    } catch (err: unknown) {
      setReportError(err instanceof Error ? err.message : "周总结生成失败");
    } finally {
      setReportLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Coach"
        title="私人减脂教练"
        description="生成周总结，或者直接和 FitAgent 讨论今天的饮食、训练和下一步调整。"
        action={<UserBadge userId={currentUserId} />}
      />

      {!currentUserId && (
        <StatusAlert tone="amber">
          请先到 <a href="/profile" className="font-bold underline">Profile</a> 建档，再使用 AI Coach。
        </StatusAlert>
      )}

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel className="self-start">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-950">本周总结报告</h2>
                <p className="text-sm text-slate-500">基于最近 7 天饮食、打卡和最新训练计划。</p>
              </div>
            </div>
            <PrimaryButton variant="blue" icon={reportLoading ? Loader2 : Sparkles} onClick={handleWeekReport} disabled={reportLoading || !currentUserId}>
              {reportLoading ? "生成中…" : "生成周总结"}
            </PrimaryButton>
          </div>

          {reportError && <div className="mt-4"><StatusAlert tone="red">{reportError}</StatusAlert></div>}

          {!weekReport ? (
            <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <Sparkles className="mx-auto h-9 w-9 text-blue-500" />
              <p className="mt-3 text-sm font-bold text-slate-700">点击按钮生成本周复盘</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">记录不足时也会返回初步建议。</p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <ReportBlock title="本周总评" text={weekReport.report.summary} tone="blue" />
              <ReportBlock title="饮食回顾" text={weekReport.report.diet_review} tone="emerald" />
              <ReportBlock title="训练回顾" text={weekReport.report.workout_review} tone="amber" />
              <ReportList title="主要问题" items={weekReport.report.problems} />
              <ReportList title="下周建议" items={weekReport.report.next_week_plan} />
              <div className="flex flex-wrap gap-2 pt-2 text-xs font-bold text-slate-500">
                <ContextBadge icon={Utensils} text={`饮食 ${weekReport.used_context.food_logs_count} 条`} />
                <ContextBadge icon={CheckCircle2} text={`打卡 ${weekReport.used_context.daily_logs_count} 条`} />
                <ContextBadge icon={Dumbbell} text={`训练计划 ${weekReport.used_context.has_workout_plan ? "有" : "无"}`} />
              </div>
            </div>
          )}
        </Panel>

        <Panel className="flex min-h-[620px] flex-col p-0">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-950">Coach Chat</h2>
                <p className="text-sm text-slate-500">按 Enter 发送，Shift + Enter 换行。</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50/70 p-5">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 shadow-sm",
                      msg.role === "user"
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-100 bg-white text-slate-800",
                    )}
                  >
                    {msg.role === "assistant" && (
                      <span className="mb-1 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                        <Bot className="h-3.5 w-3.5" /> FitAgent
                      </span>
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-500 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> 思考中…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="border-t border-slate-100 bg-white p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentUserId ? "问我任何关于减脂、饮食或训练的问题…" : "请先到 Profile 建档"}
                className={inputClass}
              />
              <PrimaryButton icon={Send} onClick={handleSend} disabled={loading || !input.trim() || !currentUserId}>
                发送
              </PrimaryButton>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">FitAgent 建议仅用于减脂管理 Demo，不构成医疗建议。</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ReportBlock({ title, text, tone }: { title: string; text: string; tone: "blue" | "emerald" | "amber" }) {
  const tones = {
    blue: "border-blue-100 bg-blue-50",
    emerald: "border-emerald-100 bg-emerald-50",
    amber: "border-amber-100 bg-amber-50",
  };
  return (
    <div className={cn("rounded-lg border p-4", tones[tone])}>
      <p className="text-sm font-black text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
    </div>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-4">
      <p className="text-sm font-black text-slate-900">{title}</p>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContextBadge({ icon: Icon, text }: { icon: typeof Utensils; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
      <Icon className="h-3.5 w-3.5" />
      {text}
    </span>
  );
}
