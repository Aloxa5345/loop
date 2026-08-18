"use client";

/**
 * ThemeCard — compact summary card for a single theme cluster.
 * Used in grid layouts. Clicking navigates to the theme detail page.
 */
import Link from "next/link";

interface Props {
    name: string;
    count: number;
    trendPct: number;
    trendLabel: string;
    positive: number;
    neutral: number;
    negative: number;
    status: string;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    Trending: { bg: "rgba(34,197,94,.15)", color: "#4ade80" },
    Active: { bg: "rgba(6,182,212,.15)", color: "#22d3ee" },
    Declining: { bg: "rgba(239,68,68,.15)", color: "#f87171" },
};

export default function ThemeCard({
    name, count, trendPct, trendLabel,
    positive, neutral, negative, status,
}: Props) {
    const total = count || 1;
    const ss = STATUS_STYLE[status] ?? STATUS_STYLE.Active;
    const trendColor = trendPct > 0 ? "#4ade80" : trendPct < 0 ? "#f87171" : "#94a3b8";

    return (
        <Link
            href={`/themes/${encodeURIComponent(name)}`}
            style={{ textDecoration: "none" }}
        >
            <div style={{
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.07)",
                borderRadius: "16px",
                padding: "20px",
                cursor: "pointer",
                transition: ".25s",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
            }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,.14)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 28px rgba(0,0,0,.25)";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,.07)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "";
                }}
            >
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                    <div>
                        <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "4px" }}>
                            🏷️ Theme
                        </p>
                        <p style={{ fontSize: "15px", fontWeight: 700, color: "#e2e8f0" }}>{name}</p>
                    </div>
                    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, background: ss.bg, color: ss.color, flexShrink: 0 }}>
                        {status}
                    </span>
                </div>

                {/* Count + trend */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <p style={{ fontSize: "11px", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "4px" }}>Feedback</p>
                        <p style={{ fontSize: "28px", fontWeight: 800, color: "#22d3ee", lineHeight: 1 }}>{count.toLocaleString()}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "11px", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "4px" }}>Trend</p>
                        <p style={{ fontSize: "16px", fontWeight: 700, color: trendColor }}>{trendLabel}</p>
                    </div>
                </div>

                {/* Sentiment breakdown */}
                <div>
                    <p style={{ fontSize: "11px", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "8px" }}>Sentiment</p>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                        {[
                            { label: "Positive", count: positive, color: "#4ade80" },
                            { label: "Neutral", count: neutral, color: "#fbbf24" },
                            { label: "Negative", count: negative, color: "#f87171" },
                        ].map(({ label, count: c, color }) => (
                            <div key={label} style={{ flex: 1, textAlign: "center" }}>
                                <p style={{ fontSize: "11px", color: "#475569", marginBottom: "2px" }}>{label.slice(0, 3)}</p>
                                <p style={{ fontSize: "13px", fontWeight: 700, color }}>{c}</p>
                            </div>
                        ))}
                    </div>
                    {/* Mini stacked bar */}
                    <div style={{ display: "flex", height: "5px", borderRadius: "20px", overflow: "hidden", gap: "1px" }}>
                        <div style={{ width: `${(positive / total) * 100}%`, background: "#4ade80" }} />
                        <div style={{ width: `${(neutral / total) * 100}%`, background: "#fbbf24" }} />
                        <div style={{ width: `${(negative / total) * 100}%`, background: "#f87171" }} />
                    </div>
                </div>
            </div>
        </Link>
    );
}
