"use client";

/**
 * ThemeDetails — full detail view for a theme cluster.
 * Used on the /themes/[id] page. Accepts pre-fetched data + handles
 * its own sentiment/channel filter state for the related feedback list.
 */

import { useState } from "react";
import Link from "next/link";
import ThemeTrendChart from "./ThemeTrendChart";
import ThemeFilters from "./ThemeFilters";

interface FeedbackItem {
    id: string;
    content: string;
    sentiment: string | null;
    channel: string;
    customerLabel: string;
    createdAt: string;
}

interface MonthPoint { month: string; count: number }

interface Props {
    name: string;
    count: number;
    positive: number;
    neutral: number;
    negative: number;
    trendPct: number;
    trendLabel: string;
    status: string;
    aiSummary: string;
    recommendation: string;
    featureArea: string;
    monthlyVolume: MonthPoint[];
    channels: string[];
    relatedFeedback: FeedbackItem[];
    totalFeedback: number;
    pages: number;
    currentPage: number;
    canRunAI: boolean;
    range: string;
    onRangeChange: (v: string) => void;
    onFilterChange: (sentiment: string, channel: string) => void;
    onPageChange: (p: number) => void;
}

const SENT_COLOR: Record<string, string> = {
    Positive: "#4ade80",
    Neutral: "#fbbf24",
    Negative: "#f87171",
};
const SENT_EMOJI: Record<string, string> = {
    Positive: "😊",
    Neutral: "😐",
    Negative: "😞",
};
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    Trending: { bg: "rgba(34,197,94,.15)", color: "#4ade80" },
    Active: { bg: "rgba(6,182,212,.15)", color: "#22d3ee" },
    Declining: { bg: "rgba(239,68,68,.15)", color: "#f87171" },
};

export default function ThemeDetails({
    name, count, positive, neutral, negative,
    trendPct, trendLabel, status,
    aiSummary, recommendation, featureArea,
    monthlyVolume, channels,
    relatedFeedback, totalFeedback, pages, currentPage,
    canRunAI, range, onRangeChange, onFilterChange, onPageChange,
}: Props) {
    const [sentiment, setSentiment] = useState("");
    const [channel, setChannel] = useState("");
    const [statusFilter, setStatus] = useState("");

    const total = count || 1;
    const negPct = Math.round((negative / total) * 100);
    const trendColor = trendPct > 0 ? "#4ade80" : trendPct < 0 ? "#f87171" : "#94a3b8";
    const ss = STATUS_STYLE[status] ?? STATUS_STYLE.Active;

    function handleSentimentChange(v: string) {
        setSentiment(v);
        onFilterChange(v, channel);
    }
    function handleChannelChange(v: string) {
        setChannel(v);
        onFilterChange(sentiment, v);
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* ── Hero header ── */}
            <div style={{
                background: "linear-gradient(135deg, rgba(6,182,212,.08), rgba(124,58,237,.08))",
                border: "1px solid rgba(99,102,241,.2)",
                borderRadius: "20px",
                padding: "28px 32px",
            }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", marginBottom: "20px" }}>
                    <div>
                        <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "6px" }}>
                            🏷️ Theme Cluster
                        </p>
                        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#f1f5f9", marginBottom: "4px" }}>{name}</h1>
                        {featureArea && (
                            <p style={{ fontSize: "13px", color: "#64748b" }}>Feature Area: <span style={{ color: "#c4b5fd" }}>{featureArea}</span></p>
                        )}
                    </div>
                    <span style={{ padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, background: ss.bg, color: ss.color }}>
                        {status}
                    </span>
                </div>

                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px" }}>
                    {[
                        { label: "Total Feedback", value: count.toLocaleString(), color: "#e2e8f0" },
                        { label: "Positive", value: positive.toLocaleString(), color: "#4ade80" },
                        { label: "Neutral", value: neutral.toLocaleString(), color: "#fbbf24" },
                        { label: "Negative", value: negative.toLocaleString(), color: "#f87171" },
                        { label: "Negative %", value: `${negPct}%`, color: negPct >= 50 ? "#f87171" : negPct >= 25 ? "#fbbf24" : "#4ade80" },
                        { label: "Trend", value: trendLabel, color: trendColor },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)", borderRadius: "12px", padding: "14px", textAlign: "center" }}>
                            <p style={{ fontSize: "10px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "6px" }}>{label}</p>
                            <p style={{ fontSize: "20px", fontWeight: 800, color }}>{value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Two-column row: trend chart + sentiment breakdown ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px" }}>

                {/* Trend chart */}
                <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: "18px", padding: "24px" }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0", marginBottom: "18px" }}>📈 Monthly Volume Trend</p>
                    <ThemeTrendChart data={monthlyVolume} />
                </div>

                {/* Sentiment breakdown */}
                <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: "18px", padding: "24px" }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0", marginBottom: "18px" }}>😊 Sentiment Breakdown</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {[
                            { label: "Positive", count: positive, color: "#4ade80" },
                            { label: "Neutral", count: neutral, color: "#fbbf24" },
                            { label: "Negative", count: negative, color: "#f87171" },
                        ].map(({ label, count: c, color }) => {
                            const pct = Math.round((c / total) * 100);
                            return (
                                <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>{label} — {c}</span>
                                            <span style={{ fontSize: "12px", fontWeight: 700, color }}>{pct}%</span>
                                        </div>
                                        <div style={{ height: "5px", background: "rgba(255,255,255,.06)", borderRadius: "10px", overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "10px", transition: "width .5s ease" }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── AI insights row ── */}
            {(aiSummary || recommendation) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    {aiSummary && (
                        <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: "16px", padding: "20px 22px" }}>
                            <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "10px" }}>🤖 AI Summary</p>
                            <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.7 }}>{aiSummary}</p>
                        </div>
                    )}
                    {recommendation && (
                        <div style={{ background: "rgba(16,185,129,.04)", border: "1px solid rgba(16,185,129,.2)", borderRadius: "16px", padding: "20px 22px" }}>
                            <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "10px" }}>💡 Recommended Action</p>
                            <p style={{ fontSize: "13px", color: "#6ee7b7", lineHeight: 1.7 }}>{recommendation}</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Related feedback ── */}
            <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: "18px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0" }}>
                        📝 Related Feedback
                        <span style={{ marginLeft: "8px", fontSize: "12px", fontWeight: 400, color: "#475569" }}>
                            ({totalFeedback.toLocaleString()} total)
                        </span>
                    </p>
                    <Link
                        href={`/feedback?q=${encodeURIComponent(name)}`}
                        style={{ fontSize: "12px", color: "#06b6d4", textDecoration: "none", fontWeight: 500 }}
                    >
                        View all in Inbox →
                    </Link>
                </div>

                {/* Filters */}
                <ThemeFilters
                    range={range}
                    onRangeChange={onRangeChange}
                    sentiment={sentiment}
                    onSentiment={handleSentimentChange}
                    status={statusFilter}
                    onStatus={setStatus}
                    channel={channel}
                    onChannel={handleChannelChange}
                    channels={channels}
                />

                {/* Feedback list */}
                {relatedFeedback.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px", color: "#475569" }}>
                        <p style={{ fontSize: "28px", marginBottom: "8px" }}>📭</p>
                        <p>No matching feedback for these filters.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        {relatedFeedback.map((item) => {
                            const sc = SENT_COLOR[item.sentiment ?? ""] ?? "#64748b";
                            const emoji = SENT_EMOJI[item.sentiment ?? ""] ?? "💬";
                            return (
                                <Link
                                    key={item.id}
                                    href={`/feedback/${item.id}`}
                                    style={{ textDecoration: "none" }}
                                >
                                    <div style={{
                                        display: "flex", alignItems: "flex-start", gap: "14px",
                                        padding: "13px 12px", borderRadius: "10px", transition: ".18s",
                                    }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.04)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                        <span style={{ fontSize: "18px", flexShrink: 0 }}>{emoji}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {item.content}
                                            </p>
                                            <p style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>
                                                {item.customerLabel} · {item.channel} · {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </p>
                                        </div>
                                        <span style={{ fontSize: "11px", fontWeight: 700, color: sc, flexShrink: 0 }}>
                                            {item.sentiment ?? "—"}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {pages > 1 && (
                    <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginTop: "18px", flexWrap: "wrap" }}>
                        <button
                            type="button"
                            disabled={currentPage <= 1}
                            onClick={() => onPageChange(currentPage - 1)}
                            style={{ padding: "7px 13px", borderRadius: "8px", border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "#94a3b8", cursor: currentPage <= 1 ? "not-allowed" : "pointer", opacity: currentPage <= 1 ? .4 : 1, fontSize: "12px" }}
                        >
                            ← Prev
                        </button>
                        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                            const p = Math.max(1, currentPage - 2) + i;
                            if (p > pages) return null;
                            return (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => onPageChange(p)}
                                    style={{ padding: "7px 11px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", border: `1px solid ${p === currentPage ? "#06b6d4" : "rgba(255,255,255,.1)"}`, background: p === currentPage ? "rgba(6,182,212,.15)" : "transparent", color: p === currentPage ? "#22d3ee" : "#94a3b8" }}
                                    aria-current={p === currentPage ? "page" : undefined}
                                >
                                    {p}
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            disabled={currentPage >= pages}
                            onClick={() => onPageChange(currentPage + 1)}
                            style={{ padding: "7px 13px", borderRadius: "8px", border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "#94a3b8", cursor: currentPage >= pages ? "not-allowed" : "pointer", opacity: currentPage >= pages ? .4 : 1, fontSize: "12px" }}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>

            {/* ── Action buttons ── */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Link
                    href="/themes"
                    style={{ padding: "10px 18px", border: "1px solid rgba(255,255,255,.12)", borderRadius: "10px", background: "transparent", color: "#94a3b8", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}
                >
                    ← All Themes
                </Link>
                <Link
                    href={`/feedback?q=${encodeURIComponent(name)}`}
                    style={{ padding: "10px 18px", border: "1px solid rgba(6,182,212,.3)", borderRadius: "10px", background: "rgba(6,182,212,.1)", color: "#22d3ee", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}
                >
                    🔍 Open in Inbox
                </Link>
                {canRunAI && (
                    <Link
                        href="/ai"
                        style={{ padding: "10px 18px", border: "1px solid rgba(124,58,237,.3)", borderRadius: "10px", background: "rgba(124,58,237,.1)", color: "#c4b5fd", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}
                    >
                        🤖 AI Reports
                    </Link>
                )}
            </div>
        </div>
    );
}
