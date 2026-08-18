"use client";

import Link from "next/link";

interface FeedbackItem {
    id: string;
    customerLabel: string;
    sentiment: string | null;
    channel: string;
    content: string;
    createdAt: string;
    status: string;
}

interface Props { items: FeedbackItem[] }

const SENT_EMOJI: Record<string, string> = {
    Positive: "😊",
    Negative: "😞",
    Neutral: "😐",
};
const SENT_COLOR: Record<string, string> = {
    Positive: "#4ade80",
    Negative: "#f87171",
    Neutral: "#fbbf24",
};
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    PENDING: { bg: "rgba(245,158,11,.15)", color: "#fbbf24" },
    REVIEWED: { bg: "rgba(6,182,212,.15)", color: "#22d3ee" },
    ANALYZED: { bg: "rgba(34,197,94,.15)", color: "#4ade80" },
};

export default function RecentFeedback({ items }: Props) {
    if (!items.length) {
        return (
            <div style={{ textAlign: "center", padding: "32px", color: "#475569" }}>
                <p style={{ fontSize: "32px", marginBottom: "8px" }}>📭</p>
                <p>No feedback yet.</p>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {items.map((item) => {
                const emoji = SENT_EMOJI[item.sentiment ?? ""] ?? "💬";
                const color = SENT_COLOR[item.sentiment ?? ""] ?? "#94a3b8";
                const ss = STATUS_STYLE[item.status] ?? STATUS_STYLE.PENDING;
                return (
                    <Link
                        key={item.id}
                        href={`/feedback/${item.id}`}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "11px 12px",
                            borderRadius: "10px",
                            textDecoration: "none",
                            transition: ".2s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.04)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                        <span style={{ fontSize: "18px", flexShrink: 0 }}>{emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                                fontSize: "13px", color: "#e2e8f0", fontWeight: 500,
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}>
                                {item.content.length > 55 ? item.content.slice(0, 55) + "…" : item.content}
                            </p>
                            <p style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>
                                {item.customerLabel} · {item.channel}
                            </p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                            {item.sentiment && (
                                <span style={{ fontSize: "11px", fontWeight: 700, color }}>{item.sentiment}</span>
                            )}
                            <span style={{
                                padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 600,
                                background: ss.bg, color: ss.color,
                            }}>
                                {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                            </span>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
