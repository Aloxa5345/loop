"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import FeedbackVolumeChart from "@/components/FeedbackVolumeChart";
import SentimentPieChart from "@/components/SentimentPieChart";
import TopThemesChart from "@/components/TopThemesChart";
import AIInsights from "@/components/AIInsights";
import RecentFeedback from "@/components/RecentFeedback";
import "./analytics.css";

interface Summary {
    totalFeedback: number;
    positive: number;
    negative: number;
    neutral: number;
    negativePercentage: number;
    newThisWeek: number;
    analyzed: number;
    unanalyzed: number;
    members: number;
}
interface VolumePoint { month: string; count: number }
interface SentimentSeg { name: string; value: number; color: string }
interface ThemeItem { theme: string; count: number }
interface AiInsightsData {
    topTheme: string;
    mostRequestedFeature: string;
    highestSentiment: string;
    trendingIssue: string;
    topKeyword: string;
    recommendation: string;
}
interface RecentItem {
    id: string; customerLabel: string; sentiment: string | null;
    channel: string; content: string; createdAt: string; status: string;
}
interface DashboardData {
    summary: Summary;
    feedbackVolume: VolumePoint[];
    sentimentDistribution: SentimentSeg[];
    topThemes: ThemeItem[];
    aiInsights: AiInsightsData;
    recentFeedback: RecentItem[];
}

interface Props {
    userName: string;
    workspaceId: string;
    role: string;
    canRunAI: boolean;
    canExport: boolean;
}

const DATE_FILTERS = [
    { label: "Last 7 Days", value: "7d" },
    { label: "Last 30 Days", value: "30d" },
    { label: "Last 90 Days", value: "90d" },
    { label: "This Year", value: "year" },
    { label: "All Time", value: "all" },
];

function SkeletonCard() {
    return <div className="an-skeleton" style={{ height: "104px" }} />;
}
function SkeletonPanel({ h = 260 }: { h?: number }) {
    return <div className="an-skeleton an-panel" style={{ height: `${h}px` }} />;
}

export default function AnalyticsDashboardClient({ userName, role, canRunAI, canExport }: Props) {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState("30d");
    const [batchRunning, setBatchRunning] = useState(false);
    const [batchMsg, setBatchMsg] = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await fetch(`/api/dashboard?range=${dateFilter}`);
        if (res.ok) setData(await res.json().catch(() => ({})));
        setLoading(false);
    }, [dateFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const isAdmin = role === "ADMIN";
    const roleLabel = { ADMIN: "Admin", ANALYST: "Analyst", VIEWER: "Viewer" }[role] ?? role;

    async function handleBatchAnalyze() {
        setBatchRunning(true);
        setBatchMsg("");
        try {
            const res = await fetch("/api/ai/batch", { method: "POST" });
            const d = await res.json().catch(() => ({}));
            setBatchMsg(res.ok
                ? `✓ Queued ${d.queued ?? "all"} feedback items for analysis.`
                : `⚠️ ${d.error ?? "Failed to start batch analysis."}`
            );
            if (res.ok) setTimeout(fetchData, 3000);
        } catch {
            setBatchMsg("⚠️ Network error — please try again.");
        }
        setBatchRunning(false);
    }

    return (
        <div>
            {/* ── Header ── */}
            <div className="an-header">
                <div>
                    <h1>📊 Analytics Dashboard</h1>
                    <p>Hello, {userName} 👋 — real-time feedback insights for your workspace</p>
                </div>
                <div className="an-header-right">
                    <span style={{
                        padding: "5px 14px", borderRadius: "20px", fontSize: "12px",
                        fontWeight: 700, background: "linear-gradient(90deg,#06b6d4,#7c3aed)", color: "#fff",
                    }}>{roleLabel}</span>
                    {canExport && (
                        <Link href="/reports" className="hero-btn hero-btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>
                            📄 Export Reports
                        </Link>
                    )}
                    {canRunAI && (
                        <Link href="/ai" className="hero-btn hero-btn-primary" style={{ padding: "8px 16px", fontSize: "13px", background: "linear-gradient(90deg,#7c3aed,#4f46e5)" }}>
                            🤖 AI Reports
                        </Link>
                    )}
                </div>
            </div>

            {/* ── Date filter ── */}
            <div className="an-filters">
                <span style={{ fontSize: "12px", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginRight: "4px" }}>
                    📅
                </span>
                {DATE_FILTERS.map(f => (
                    <button
                        key={f.value}
                        type="button"
                        className={`an-filter-btn${dateFilter === f.value ? " active" : ""}`}
                        onClick={() => setDateFilter(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* ── Summary cards ── */}
            <div className="an-summary">
                {loading ? (
                    [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
                ) : data && (
                    <>
                        <div className="an-card">
                            <div className="an-card-icon" style={{ background: "rgba(6,182,212,.18)" }}>📊</div>
                            <h5>Total Feedback</h5>
                            <h2>{data.summary.totalFeedback.toLocaleString()}</h2>
                            <p className="an-sub">All channels</p>
                        </div>
                        <div className="an-card">
                            <div className="an-card-icon" style={{ background: "rgba(34,197,94,.18)" }}>😊</div>
                            <h5>Positive Feedback</h5>
                            <h2 style={{ color: "#4ade80" }}>{data.summary.positive.toLocaleString()}</h2>
                            <p className="an-sub">{data.summary.totalFeedback > 0 ? Math.round(data.summary.positive / data.summary.totalFeedback * 100) : 0}% of total</p>
                        </div>
                        <div className="an-card">
                            <div className="an-card-icon" style={{ background: "rgba(239,68,68,.18)" }}>😞</div>
                            <h5>Negative %</h5>
                            <h2 style={{ color: "#f87171" }}>{data.summary.negativePercentage}%</h2>
                            <p className="an-sub">{data.summary.negative.toLocaleString()} items</p>
                        </div>
                        <div className="an-card">
                            <div className="an-card-icon" style={{ background: "rgba(79,70,229,.18)" }}>🆕</div>
                            <h5>New This Week</h5>
                            <h2 style={{ color: "#a5b4fc" }}>{data.summary.newThisWeek.toLocaleString()}</h2>
                            <p className="an-sub">Last 7 days</p>
                        </div>
                    </>
                )}
            </div>

            {/* ── Admin + Analyst: AI Analysis Progress + Workspace Overview ── */}
            {!loading && data && (isAdmin || role === "ANALYST") && (
                <div className="an-row-2" style={{ marginBottom: "20px" }}>

                    {/* AI Analysis Progress */}
                    <div className="an-panel" style={{
                        background: "linear-gradient(135deg,rgba(124,58,237,.08),rgba(79,70,229,.08))",
                        border: "1px solid rgba(124,58,237,.2)",
                    }}>
                        <div className="an-panel-title">
                            <span>🤖 AI Analysis Progress</span>
                            <Link href="/ai">View AI Reports →</Link>
                        </div>

                        {/* Progress bar */}
                        <div style={{ marginBottom: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                                    {data.summary.analyzed.toLocaleString()} of {data.summary.totalFeedback.toLocaleString()} analyzed
                                </span>
                                <span style={{ fontSize: "13px", fontWeight: 700, color: "#c4b5fd" }}>
                                    {data.summary.totalFeedback > 0
                                        ? Math.round((data.summary.analyzed / data.summary.totalFeedback) * 100)
                                        : 0}%
                                </span>
                            </div>
                            <div style={{ height: "8px", background: "rgba(255,255,255,.08)", borderRadius: "20px", overflow: "hidden" }}>
                                <div style={{
                                    height: "100%",
                                    width: `${data.summary.totalFeedback > 0 ? Math.round((data.summary.analyzed / data.summary.totalFeedback) * 100) : 0}%`,
                                    background: "linear-gradient(90deg,#7c3aed,#06b6d4)",
                                    borderRadius: "20px",
                                    transition: "width .6s ease",
                                }} />
                            </div>
                        </div>

                        {/* Stats row */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "16px" }}>
                            {[
                                { label: "Analyzed", value: data.summary.analyzed, color: "#4ade80", icon: "✅" },
                                { label: "Pending", value: data.summary.unanalyzed, color: "#fbbf24", icon: "⏳" },
                                { label: "This Week", value: data.summary.newThisWeek, color: "#22d3ee", icon: "🆕" },
                            ].map(({ label, value, color, icon }) => (
                                <div key={label} style={{
                                    background: "rgba(255,255,255,.04)", borderRadius: "10px",
                                    padding: "12px", textAlign: "center",
                                    border: "1px solid rgba(255,255,255,.06)",
                                }}>
                                    <div style={{ fontSize: "18px", marginBottom: "4px" }}>{icon}</div>
                                    <div style={{ fontSize: "20px", fontWeight: 800, color }}>{value.toLocaleString()}</div>
                                    <div style={{ fontSize: "10px", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Batch analyze button */}
                        {canRunAI && data.summary.unanalyzed > 0 && (
                            <div>
                                <button
                                    type="button"
                                    onClick={handleBatchAnalyze}
                                    disabled={batchRunning}
                                    style={{
                                        width: "100%", padding: "11px", border: "none", borderRadius: "10px",
                                        background: batchRunning ? "rgba(124,58,237,.3)" : "linear-gradient(90deg,#7c3aed,#4f46e5)",
                                        color: "#fff", fontSize: "13px", fontWeight: 700,
                                        cursor: batchRunning ? "not-allowed" : "pointer",
                                        transition: ".2s",
                                    }}
                                >
                                    {batchRunning ? "⏳ Running Analysis…" : `🤖 Analyze ${data.summary.unanalyzed} Pending Items`}
                                </button>
                                {batchMsg && (
                                    <p style={{
                                        marginTop: "8px", fontSize: "12px", textAlign: "center",
                                        color: batchMsg.startsWith("✓") ? "#4ade80" : "#fbbf24",
                                    }}>
                                        {batchMsg}
                                    </p>
                                )}
                            </div>
                        )}

                        {data.summary.unanalyzed === 0 && (
                            <div style={{
                                padding: "10px 14px", borderRadius: "10px",
                                background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.2)",
                                color: "#4ade80", fontSize: "12px", textAlign: "center",
                            }}>
                                ✅ All feedback has been analyzed
                            </div>
                        )}
                    </div>

                    {/* Workspace Overview — Admin sees members/settings, Analyst sees AI stats */}
                    <div className="an-panel">
                        <div className="an-panel-title">
                            <span>{isAdmin ? "🏢 Workspace Overview" : "📊 My Analytics"}</span>
                            {isAdmin && <Link href="/workspace/members">Manage →</Link>}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {[
                                ...(isAdmin ? [{ label: "👥 Total Members", value: data.summary.members.toLocaleString(), color: "#a5b4fc" }] : []),
                                { label: "💬 Total Feedback", value: data.summary.totalFeedback.toLocaleString(), color: "#22d3ee" },
                                { label: "😊 Positive Rate", value: `${data.summary.totalFeedback > 0 ? Math.round(data.summary.positive / data.summary.totalFeedback * 100) : 0}%`, color: "#4ade80" },
                                { label: "😞 Negative Rate", value: `${data.summary.negativePercentage}%`, color: "#f87171" },
                                { label: "🤖 Analyzed Rate", value: `${data.summary.totalFeedback > 0 ? Math.round(data.summary.analyzed / data.summary.totalFeedback * 100) : 0}%`, color: "#c4b5fd" },
                                { label: "🏷️ Top Theme", value: data.aiInsights.topTheme, color: "#fbbf24" },
                            ].map(({ label, value, color }) => (
                                <div key={label} style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "9px 12px", background: "rgba(255,255,255,.03)",
                                    borderRadius: "9px", border: "1px solid rgba(255,255,255,.05)",
                                }}>
                                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{label}</span>
                                    <span style={{
                                        fontSize: "13px", fontWeight: 700, color,
                                        maxWidth: "55%", textAlign: "right",
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}>{value}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
                            {isAdmin ? (
                                <>
                                    <Link href="/workspace/members" style={{
                                        flex: 1, padding: "9px 12px", borderRadius: "9px",
                                        border: "1px solid rgba(6,182,212,.25)", background: "rgba(6,182,212,.07)",
                                        color: "#22d3ee", fontSize: "12px", fontWeight: 600,
                                        textDecoration: "none", textAlign: "center",
                                    }}>
                                        👥 Members
                                    </Link>
                                    <Link href="/workspace/settings" style={{
                                        flex: 1, padding: "9px 12px", borderRadius: "9px",
                                        border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)",
                                        color: "#94a3b8", fontSize: "12px", fontWeight: 600,
                                        textDecoration: "none", textAlign: "center",
                                    }}>
                                        ⚙️ Settings
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href="/feedback" style={{
                                        flex: 1, padding: "9px 12px", borderRadius: "9px",
                                        border: "1px solid rgba(6,182,212,.25)", background: "rgba(6,182,212,.07)",
                                        color: "#22d3ee", fontSize: "12px", fontWeight: 600,
                                        textDecoration: "none", textAlign: "center",
                                    }}>
                                        💬 Feedback
                                    </Link>
                                    <Link href="/reports" style={{
                                        flex: 1, padding: "9px 12px", borderRadius: "9px",
                                        border: "1px solid rgba(124,58,237,.25)", background: "rgba(124,58,237,.07)",
                                        color: "#c4b5fd", fontSize: "12px", fontWeight: 600,
                                        textDecoration: "none", textAlign: "center",
                                    }}>
                                        📄 Reports
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                </div>
            )}

            {/* ── Row 1: Volume line + Sentiment pie ── */}
            <div className="an-row-2">
                <div className="an-panel">
                    <div className="an-panel-title">
                        <span>📈 Feedback Volume</span>
                        <Link href="/reports">View Reports →</Link>
                    </div>
                    {loading
                        ? <div className="an-skeleton" style={{ height: "200px", borderRadius: "10px" }} />
                        : data && <FeedbackVolumeChart data={data.feedbackVolume} />
                    }
                </div>

                <div className="an-panel">
                    <div className="an-panel-title">
                        <span>🥧 Sentiment Distribution</span>
                    </div>
                    {loading
                        ? <div className="an-skeleton" style={{ height: "200px", borderRadius: "10px" }} />
                        : data && <SentimentPieChart data={data.sentimentDistribution} />
                    }
                </div>
            </div>

            {/* ── Row 2: Top Themes bar + AI Insights ── */}
            <div className="an-row-2">
                <div className="an-panel">
                    <div className="an-panel-title">
                        <span>🏷️ Top Themes</span>
                        <Link href="/ai">Full AI Reports →</Link>
                    </div>
                    {loading
                        ? <div className="an-skeleton" style={{ height: "220px", borderRadius: "10px" }} />
                        : data && <TopThemesChart data={data.topThemes} />
                    }
                </div>

                <div className="an-panel" style={{
                    background: "linear-gradient(135deg,rgba(37,99,235,.1),rgba(124,58,237,.1))",
                    border: "1px solid rgba(99,102,241,.2)",
                }}>
                    <div className="an-panel-title">
                        <span>🤖 AI Insights</span>
                    </div>
                    {loading
                        ? <div className="an-skeleton" style={{ height: "220px", borderRadius: "10px" }} />
                        : data && (
                            <AIInsights
                                insights={data.aiInsights}
                                canRunAI={canRunAI}
                            />
                        )
                    }
                </div>
            </div>

            {/* ── Row 3: Recent Feedback full width ── */}
            <div className="an-row-1">
                <div className="an-panel">
                    <div className="an-panel-title">
                        <span>📝 Recent Feedback</span>
                        <Link href="/feedback">View All →</Link>
                    </div>
                    {loading
                        ? <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="an-skeleton" style={{ height: "52px", borderRadius: "10px" }} />
                            ))}
                        </div>
                        : data && <RecentFeedback items={data.recentFeedback} />
                    }
                </div>
            </div>

            {/* ── Neutral row: extra stat strip ── */}
            {!loading && data && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
                    gap: "12px",
                    marginBottom: "20px",
                }}>
                    {[
                        { label: "😐 Neutral", value: data.summary.neutral.toLocaleString(), color: "#fbbf24" },
                        { label: "🏷️ Top Theme", value: data.aiInsights.topTheme, color: "#22d3ee" },
                        { label: "🔑 Top Keyword", value: data.aiInsights.topKeyword, color: "#c4b5fd" },
                        { label: "📅 This Week", value: data.summary.newThisWeek.toLocaleString(), color: "#a5b4fc" },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{
                            background: "rgba(255,255,255,.03)",
                            border: "1px solid rgba(255,255,255,.06)",
                            borderRadius: "12px", padding: "14px 16px",
                            display: "flex", flexDirection: "column", gap: "4px",
                        }}>
                            <span style={{ fontSize: "11px", color: "#475569", fontWeight: 600 }}>{label}</span>
                            <span style={{
                                fontSize: "16px", fontWeight: 700, color,
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}>{value}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
