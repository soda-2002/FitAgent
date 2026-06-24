"use client";
import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useCurrentUserId } from "@/lib/currentUser";
import type { AgentChatResponse } from "@/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function CoachPage() {
  const currentUserId = useCurrentUserId();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "你好！我是你的 AI 减脂教练 FitAgent。你可以问我饮食建议、训练计划或者本周进展，我会结合你的记录给出建议。" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">AI Coach</h1>
        <span className="text-xs text-gray-400">user_id: {currentUserId ?? "未设置"}</span>
      </div>
      {!currentUserId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-3">
          请先到 <a href="/profile" className="underline font-medium">Profile</a> 建档，再使用 AI Coach。
        </div>
      )}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
              msg.role === "user"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-800"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 rounded-xl px-4 py-2.5 text-sm">思考中…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={currentUserId ? "问我任何关于减脂、饮食或训练的问题…" : "请先到 Profile 建档"}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        <button onClick={handleSend} disabled={loading || !input.trim() || !currentUserId}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors">
          发送
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1 text-center">Phase 1 mock 模式 · Phase 4 接入真实 Agent Tool Calling</p>
    </div>
  );
}
