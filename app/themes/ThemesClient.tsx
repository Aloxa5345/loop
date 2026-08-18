"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import ThemeSearch from "@/components/ThemeSearch";
import ThemeTable from "@/components/ThemeTable";

// ── Types ──────────────────────────────────────────────────────────────────
interface RecentItem {
    id: string;
    content: string;
    sentiment: string | null;
    customerLabel: string;
    createdAt: string;
}

interface ThemeCluster {
    name: string;
    count: number;
    positive: number;
    neutral: number;
    negative: number;
    trendPct: number;
    trendLabel: string;
    status: "Trending" | "Active" | "Declining";
    aiSummary: string;
    recommendation: string;
    recentFeedback: RecentItem[];
}

interface Props { canRunAI: boolean }

// ── Constants ──────────────────────────────────────────────────────────────
const RANGES = [
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
    { label: "90 Days", value: "90d" },
    { label: "This Year", value: "year" },
    { label: "All Time", value: "all" },
];

const SENTIMENTS = ["Positive", "Neutral", "Negative"];

const SENT_COLOR: Record<string, string> = {
    Positive: "#4ade80",
    Neutral: "#fbbf24",
    Negative: "#f87171",
};

function sentimentDot(s: string | null) {
    return SENT_COLOR[s ?? ""] ?? "#64748b";
}

// ── Status / trend helpers ─────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const cls =
        status === "Trending" ? "th-badge th-badge-trending" :
            status === "Declining" ? "th-badge th-badge-declining" :
                "th-badge th-badge-active";
    return <span className={cls}>{status}</span>;
}

function Pill({ active, onClick, children }: {
    active: boolean; onClick: () => void; children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`th-range-btn${active ? " active" : ""}`}
        >
            {children}
        </button>
    );
}

// ── Detail Panel (slide-in drawer) ─────────────────────────────────────────
function DetailPanel({
    theme, onClose, canRunAI,
}: {
    theme: ThemeCluster; onClose: () => void; canRunAI: boolean;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const total = theme.count || 1;

    return (
        <>
            <div className="th-overlay" onClick={onClose} aria-hidden="true" />
            <aside className="th-panel" role="dialog" aria-modal="true" aria-label={`Theme: ${theme.name}`}>

                {/* Header */}
                <div className="th-panel-head">
                    <div>
                        <h2>🏷️ {theme.name}</h2>
                        <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                            Theme Cluster · <StatusBadge status={theme.status} />
                        </p>
                    </div>
                    <button className="th-close-btn" onClick={onClose} aria-label="Close panel">✕</button>
                </div>

                {/* Body */}
                <div className="th-panel-body">

                    {/* Stats */}
                    <div className="th-panel-stats">
                        {[
                            { label: "Total Feedback", value: theme.count.toLocaleString(), color: "#e2e8f0" },
                            { label: "Positive", value: theme.positive.toLocaleString(), color: "#4ade80" },
                            { label: "Neutral", value: theme.neutral.toLocaleString(), color: "#fbbf24" },
                            { label: "Negative", value: theme.negative.toLocaleString(), color: "#f87171" },
                            {
                                label: "Trend", value: theme.trendLabel,
                                color: theme.trendPct > 0 ? "#4ade80" : theme.trendPct < 0 ? "#f87171" : "#94a3b8",
                            },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="th-panel-stat">
                                <p>{label}</p>
                                <p style={{ color }}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Sentiment distribution bars */}
                    <div>
                        <p className="th-section-label">Sentiment Distribution</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {[
                                { label: "Positive", count: theme.positive, color: "#4ade80" },
                                { label: "Neutral", count: theme.neutral, color: "#fbbf24" },
                                { label: "Negative", count: theme.negative, color: "#f87171" },
                            ].map(({ label, count, color }) => {
                                const pct = Math.round((count / total) * 100);
                                return (
                                    <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                                                <span style={{ fontSize: "12px", color: "#94a3b8" }}>{label} — {count}</span>
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

                    {/* AI Summary */}
                    {theme.aiSummary && (
                        <div>
                            <p className="th-section-label">🤖 AI Summary</p>
                            <div className="th-insight-box"><p>{theme.aiSummary}</p></div>
                        </div>
                    )}

                    {/* Recommended Action */}
                    {theme.recommendation && (
                        <div>
                            <p className="th-section-label">💡 Recommended Action</p>
                            <div className="th-insight-box" style={{ borderColor: "rgba(16,185,129,.2)", background: "rgba(16,185,129,.04)" }}>
                                <p style={{ color: "#6ee7b7" }}>{theme.recommendation}</p>
                            </div>
                        </div>
                    )}

                    {/* Recent Feedback */}
                    {theme.recentFeedback.length > 0 && (
                        <div>
                            <p className="th-section-label">📝 Recent Feedback</p>
                            <div className="th-recent-list">
                                {theme.recentFeedback.map((item) => (
                                    <Link key={item.id} href={`/feedback/${item.id}`} style={{ textDecoration: "none" }}>
                                        <div className="th-recent-item">
                                            <div className="th-recent-dot" style={{ background: sentimentDot(item.sentiment) }} />
                                            <div>
                                                <p className="th-recent-text">{item.content}</p>
                                                <p className="th-recent-meta">
                                                    {item.customerLabel} · {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer links */}
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", paddingTop: "4px" }}>
                        <Link
                            href={`/themes/${encodeURIComponent(theme.name)}`}
                            style={{ padding: "10px 18px", border: "1px solid rgba(6,182,212,.3)", borderRadius: "10px", background: "rgba(6,182,212,.1)", color: "#22d3ee", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}
                        >
                            📊 Full Theme Page
                        </Link>
                        <Link
                            href={`/feedback?q=${encodeURIComponent(theme.name)}`}
                            style={{ padding: "10px 18px", border: "1px solid rgba(255,255,255,.1)", borderRadius: "10px", background: "transparent", color: "#94a3b8", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}
                        >
                            🔍 View in Inbox
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
            </aside>
        </>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ThemesClient({ canRunAI }: Props) {
    const [themes, setThemes] = useState<ThemeCluster[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState("30d");
    const [q, setQ] = useState("");
    const [sentiment, setSentiment] = useState("");
    const [selected, setSelected] = useState<ThemeCluster | null>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchThemes = useCallback(async (searchQ: string, r: string, sent: string) => {
        setLoading(true);
        const p = new URLSearchParams({ range: r });
        if (searchQ) p.set("q", searchQ);
        if (sent) p.set("sentiment", sent);
        const res = await fetch(`/api/themes?${p.toString()}`);
        if (res.ok) {
            const data = await res.json().catch(() => ({}));
            setThemes(data.themes);
            setTotal(data.total);
        }
        setLoading(false);
    }, []);

    // Debounced re-fetch on any filter change
    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchThemes(q, range, sentiment), 300);
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
    }, [q, range, sentiment, fetchThemes]);

    // Derived summary stats
    const totalFeedback = themes.reduce((s, t) => s + t.count, 0);
    const trending = themes.filter((t) => t.status === "Trending").length;
    const topTheme = themes[0]?.name ?? "—";

    return (
        <div>
            {/* ── Page header ── */}
            <div className="th-header">
                <div>
                    <h1>🏷️ Theme Clustering</h1>
                    <p>AI-grouped feedback themes — identify patterns, track trends, and act on insights.</p>
                </div>
                {canRunAI && (
                    <Link
                        href="/ai"
                        style={{ padding: "9px 18px", fontSize: "13px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", border: "1px solid rgba(124,58,237,.4)", borderRadius: "10px", background: "rgba(124,58,237,.15)", color: "#c4b5fd", fontWeight: 600 }}
                    >
                        🤖 AI Reports
                    </Link>
                )}
            </div>

            {/* ── Search + filters ── */}
            <div className="th-controls" style={{ flexWrap: "wrap", gap: "10px" }}>
                <ThemeSearch value={q} onChange={setQ} />
            </div>

            {/* Range pills */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", width: "56px", flexShrink: 0 }}>Range</span>
                {RANGES.map((r) => (
                    <Pill key={r.value} active={range === r.value} onClick={() => setRange(r.value)}>
                        {r.label}
                    </Pill>
                ))}
            </div>

            {/* Sentiment pills */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", marginBottom: "20px" }}>
                <span style={{ fontSize: "11px", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", width: "56px", flexShrink: 0 }}>Sent.</span>
                <Pill active={sentiment === ""} onClick={() => setSentiment("")}>All</Pill>
                {SENTIMENTS.map((s) => (
                    <Pill key={s} active={sentiment === s} onClick={() => setSentiment(sentiment === s ? "" : s)}>
                        {s === "Positive" ? "😊 " : s === "Negative" ? "😞 " : "😐 "}{s}
                    </Pill>
                ))}
            </div>

            {/* ── Summary strip ── */}
            <div className="th-summary">
                {[
                    { icon: "🏷️", label: "Unique Themes", value: total, isStr: false },
                    { icon: "💬", label: "Total Feedback", value: totalFeedback, isStr: false },
                    { icon: "🔥", label: "Trending Themes", value: trending, isStr: false },
                    { icon: "📌", label: "Top Theme", value: topTheme, isStr: true },
                ].map(({ icon, label, value, isStr }) => (
                    <div key={label} className="th-stat">
                        <h5>{icon} {label}</h5>
                        <h2 style={{ fontSize: isStr ? "16px" : undefined, color: isStr ? "#22d3ee" : undefined }}>
                            {isStr ? (value as string) : (value as number).toLocaleString()}
                        </h2>
                    </div>
                ))}
            </div>

            {/* ── Results count ── */}
            {!loading && (
                <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "12px" }}>
                    {total === 0 ? "No themes found" : `${total} theme${total === 1 ? "" : "s"}`}
                    {q ? ` matching "${q}"` : ""}
                </p>
            )}

            {/* ── Theme table (or empty state) ── */}
            {!loading && themes.length === 0 ? (
                <div className="th-empty">
                    <div className="th-empty-icon">🏷️</div>
                    <h3>{q ? "No themes match your search" : "No themes found"}</h3>
                    <p>
                        {q
                            ? "Try a different search term or broaden the date range."
                            : "Run AI classification on feedback items to generate themes automatically."}
                    </p>
                    {!q && canRunAI && (
                        <Link href="/feedback" style={{ color: "#06b6d4", fontSize: "13px", marginTop: "12px", display: "inline-block", textDecoration: "none" }}>
                            → Go to Feedback Inbox
                        </Link>
                    )}
                </div>
            ) : (
                <ThemeTable
                    themes={themes}
                    loading={loading}
                    onSelect={(theme) => setSelected(theme as ThemeCluster)}
                />
            )}

            {/* ── Detail drawer ── */}
            {selected && (
                <DetailPanel
                    theme={selected}
                    onClose={() => setSelected(null)}
                    canRunAI={canRunAI}
                />
            )}
        </div>
    );
}
