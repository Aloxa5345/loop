"use client";

import Link from "next/link";

interface Props {
    insights: {
        topTheme: string;
        mostRequestedFeature: string;
        highestSentiment: string;
        trendingIssue: string;
        topKeyword: string;
        recommendation: string;
    };
    canRunAI: boolean;
}

const SENT_COLOR: Record<string, string> = {
    Positive: "#4ade80",
    Negative: "#f87171",
    Neutral: "#fbbf24",
};

export default function AIInsights({ insights, canRunAI }: Props) {
    const rows = [
        { label: "🏷️ Top Theme", value: insights.topTheme, color: "#22d3ee" },
        { label: "⭐ Most Requested Feature", value: insights.mostRequestedFeature, color: "#a5b4fc" },
        { label: "😊 Highest Sentiment", value: insights.highestSentiment, color: SENT_COLOR[insights.highestSentiment] ?? "#fbbf24" },
        { label: "🔥 Trending Issue", value: insights.trendingIssue, color: "#fcd34d" },
        { label: "🔑 Top Keyword", value: insights.topKeyword, color: "#6ee7b7" },
        { label: "💡 Recommendation", value: insights.recommendation, color: "#c4b5fd" },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {rows.map(({ label, value, color }) => (
                <div key={label} style={{
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.06)",
                    borderRadius: "10px",
                    padding: "11px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, flexShrink: 0 }}>
                        {label}
                    </span>
                    <span style={{
                        fontSize: "13px", fontWeight: 700, color,
                        textAlign: "right", maxWidth: "60%",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                        {value}
                    </span>
                </div>
            ))}

            {canRunAI && (
                <Link href="/ai" style={{
                    marginTop: "4px",
                    padding: "11px 18px",
                    border: "none",
                    borderRadius: "10px",
                    background: "linear-gradient(90deg,#7c3aed,#4f46e5)",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    transition: ".2s",
                }}>
                    🤖 View Full AI Reports
                </Link>
            )}
        </div>
    );
}
