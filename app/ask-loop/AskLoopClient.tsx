"use client";

import { useState } from "react";
import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import SuggestedQuestions from "@/components/SuggestedQuestions";
import { type Message, type Source } from "@/components/MessageBubble";
import { type RoleKey } from "@/app/lib/permissions";

interface Props {
    userName: string;
    role: RoleKey;
}

export default function AskLoopClient({ userName, role }: Props) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [thinking, setThinking] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [cleared, setCleared] = useState(false);

    async function handleAsk(question: string) {
        if (thinking) return;
        setError("");

        // Append user message immediately
        setMessages((prev) => [
            ...prev,
            { role: "user", text: question, timestamp: new Date() },
        ]);
        setThinking(true);

        try {
            const res = await fetch("/api/ask-loop", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.error ?? "Something went wrong.");
                setThinking(false);
                return;
            }

            const sources: Source[] = Array.isArray(data.sources) ? data.sources : [];
            if (data.notice) setNotice(data.notice);

            setMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    text: data.answer ?? "No answer returned.",
                    sources,
                    timestamp: new Date(),
                },
            ]);
        } catch {
            setError("Network error — please try again.");
        } finally {
            setThinking(false);
        }
    }

    async function handleClearHistory() {
        if (role !== "ADMIN") return;
        await fetch("/api/ask-loop", { method: "DELETE" });
        setMessages([]);
        setCleared(true);
        setTimeout(() => setCleared(false), 3000);
    }

    return (
        <div className="al-page">
            {/* ── Header ── */}
            <div className="al-header">
                <div>
                    <h1>💬 Ask LOOP</h1>
                    <p>Every answer is grounded in your workspace feedback — no hallucinations, just real insights.</p>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    {messages.length > 0 && (
                        <button
                            type="button"
                            className="al-history-btn"
                            onClick={() => setMessages([])}
                        >
                            🗑️ Clear chat
                        </button>
                    )}
                    {role === "ADMIN" && messages.length > 0 && (
                        <button
                            type="button"
                            className="al-history-btn"
                            onClick={handleClearHistory}
                            style={{ color: "#f87171", borderColor: "rgba(239,68,68,.2)" }}
                        >
                            🗑️ Delete history
                        </button>
                    )}
                    {cleared && (
                        <span style={{ fontSize: "12px", color: "#4ade80" }}>✓ History deleted</span>
                    )}
                </div>
            </div>

            {/* ── Suggested questions ── */}
            <SuggestedQuestions onSelect={handleAsk} />

            {/* ── Error banner ── */}
            {error && (
                <div style={{
                    padding: "10px 16px", borderRadius: "10px", marginBottom: "12px",
                    background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.25)",
                    color: "#f87171", fontSize: "13px",
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* ── Notice banner (fallback mode) ── */}
            {notice && !error && (
                <div style={{
                    padding: "8px 14px", borderRadius: "10px", marginBottom: "12px",
                    background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.2)",
                    color: "#fbbf24", fontSize: "12px", display: "flex", gap: "6px", alignItems: "center",
                }}>
                    ⚡ {notice}
                </div>
            )}

            {/* ── Chat window ── */}
            <ChatWindow messages={messages} thinking={thinking} />

            {/* ── Input ── */}
            <ChatInput onSend={handleAsk} disabled={thinking} />

            {/* ── Footer note ── */}
            <p style={{ fontSize: "11px", color: "#334155", marginTop: "8px", textAlign: "center" }}>
                Answers are generated from <strong style={{ color: "#475569" }}>{userName}&apos;s</strong> workspace feedback only.
                Ask LOOP never uses general AI knowledge.
            </p>
        </div>
    );
}
