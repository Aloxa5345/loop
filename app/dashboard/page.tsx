import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import Sidebar from "@/components/Sidebar";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import { FeedbackStatus } from "@/app/generated/prisma/enums";
import Link from "next/link";
import "./dashboard.css";
import DashboardRealtime from "./DashboardRealtime";
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { name, email, role, workspaceId } = session.user;
    const safeRole = role as RoleKey;

    // ── Data fetching ──────────────────────────────────────────
    // Wrapped in try/catch so dashboard renders even when DB is unreachable
    let memberCount = 0, feedbackCount = 0, pendingCount = 0, reviewedCount = 0;
    let analyzedCount = 0, positiveCount = 0, negativeCount = 0, neutralCount = 0;
    let recentFeedback: { id: string; customerLabel: string; channel: string; status: string; sentiment: string | null; createdAt: Date }[] = [];
    let workspace: { name: string } | null = null;

    try {
        [
            memberCount,
            feedbackCount,
            pendingCount,
            reviewedCount,
            analyzedCount,
            positiveCount,
            negativeCount,
            neutralCount,
            recentFeedback,
            workspace,
        ] = await Promise.all([
            prisma.workspaceMember.count({ where: { workspaceId } }),
            prisma.feedback.count({ where: { workspaceId } }),
            prisma.feedback.count({ where: { workspaceId, status: FeedbackStatus.PENDING } }),
            prisma.feedback.count({ where: { workspaceId, status: FeedbackStatus.REVIEWED } }),
            prisma.feedback.count({ where: { workspaceId, status: FeedbackStatus.ANALYZED } }),
            prisma.feedback.count({ where: { workspaceId, sentiment: "Positive" } }),
            prisma.feedback.count({ where: { workspaceId, sentiment: "Negative" } }),
            prisma.feedback.count({ where: { workspaceId, sentiment: "Neutral" } }),
            prisma.feedback.findMany({
                where: { workspaceId },
                orderBy: { createdAt: "desc" },
                take: 6,
                select: { id: true, customerLabel: true, channel: true, status: true, sentiment: true, createdAt: true },
            }),
            prisma.workspace.findUnique({
                where: { id: workspaceId },
                select: { name: true },
            }),
        ]);
    } catch {
        // DB unreachable — render dashboard with zero stats
    }

    const roleLabel = { ADMIN: "Admin", ANALYST: "Analyst", VIEWER: "Viewer" }[role] ?? role;
    const analyzed = analyzedCount;
    const sentTotal = positiveCount + negativeCount + neutralCount || 1;
    const posPct = Math.round((positiveCount / sentTotal) * 100);
    const negPct = Math.round((negativeCount / sentTotal) * 100);
    const neuPct = Math.round((neutralCount / sentTotal) * 100);

    // Mock weekly trend using actual total spread across 7 bars
    const base = Math.max(1, Math.floor(feedbackCount / 7));
    const trend = [
        Math.floor(base * 0.7), Math.floor(base * 1.0), Math.floor(base * 0.85),
        Math.floor(base * 1.2), Math.floor(base * 0.9), Math.floor(base * 1.4),
        feedbackCount - Math.floor(base * 6.05),
    ].map((v) => Math.max(0, v));
    const maxTrend = Math.max(...trend, 1);

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Quick action tiles — role-aware
    const tiles = [
        { href: "/feedback", icon: "💬", label: "Feedback Inbox", desc: "Browse all customer feedback", bg: "ic-cyan", show: true },
        { href: "/feedback/new", icon: "➕", label: "Add Feedback", desc: "Manually submit a new entry", bg: "ic-blue", show: hasPermission(safeRole, "upload-feedback") },
        { href: "/upload", icon: "📂", label: "Upload CSV", desc: "Bulk import from a CSV file", bg: "ic-violet", show: hasPermission(safeRole, "upload-feedback") },
        { href: "/simulated", icon: "🔌", label: "Demo Data", desc: "Import simulated feedback channels", bg: "ic-green", show: hasPermission(safeRole, "view-simulated") },
        { href: "/ai", icon: "🤖", label: "AI Reports", desc: "Sentiment, topics & insights", bg: "ic-yellow", show: hasPermission(safeRole, "run-ai") || hasPermission(safeRole, "view-reports") },
        { href: "/reports", icon: "📄", label: "Reports & Export", desc: "PDF, CSV, Excel & scheduled emails", bg: "ic-red", show: hasPermission(safeRole, "view-reports") },
        { href: "/workspace/members", icon: "👥", label: "Manage Members", desc: "Invite users and assign roles", bg: "ic-blue", show: hasPermission(safeRole, "manage-users") },
        { href: "/workspace/settings", icon: "⚙️", label: "Settings", desc: "Configure workspace preferences", bg: "ic-violet", show: hasPermission(safeRole, "workspace-settings") },
    ].filter((t) => t.show);

    // Status helpers
    const statusColor: Record<string, string> = { PENDING: "#fbbf24", REVIEWED: "#22d3ee", ANALYZED: "#4ade80" };
    const statusClass: Record<string, string> = { PENDING: "badge-pending", REVIEWED: "badge-reviewed", ANALYZED: "badge-analyzed" };
    const statusLabel: Record<string, string> = { PENDING: "Pending", REVIEWED: "Reviewed", ANALYZED: "Analyzed" };
    const sentColor = (s: string | null) => s === "Positive" ? "#4ade80" : s === "Negative" ? "#f87171" : "#fbbf24";

    return (
        <div className="dashboard">
            <Sidebar role={safeRole} />
            <div className="main">
                {/* Real-time refresh — invisible, just subscribes to SSE */}
                <DashboardRealtime />

                {/* ── Topbar ── */}
                <div className="topbar">
                    <div className="topbar-left">
                        <h1>👋 Welcome back, {name}</h1>
                        <p>{workspace?.name ?? "Your Workspace"} · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
                    </div>
                    <div className="topbar-right">
                        <span className="topbar-email">{email}</span>
                        <span className="topbar-role">{roleLabel}</span>
                        {hasPermission(safeRole, "manage-users") && (
                            <Link href="/workspace/members" className="topbar-link">👥 Members</Link>
                        )}
                    </div>
                </div>

                {/* ── Hero Banner ── */}
                <div className="hero-banner">
                    <div className="hero-content">
                        <div className="hero-eyebrow">
                            <span className="hero-eyebrow-dot" />
                            LOOP AI Platform
                        </div>
                        <h1>Close the Loop on<br />Customer Feedback</h1>
                        <p>Collect, analyze, and act on customer feedback with AI-powered sentiment analysis, theme clustering, and instant insights.</p>
                        <div className="hero-actions">
                            {hasPermission(safeRole, "upload-feedback") && (
                                <Link href="/feedback/new" className="hero-btn hero-btn-primary">💬 Add Feedback</Link>
                            )}
                            {hasPermission(safeRole, "run-ai") && (
                                <Link href="/ai" className="hero-btn hero-btn-primary">🤖 AI Analysis</Link>
                            )}
                            <Link href="/feedback" className="hero-btn hero-btn-secondary">📥 Open Inbox</Link>
                            {hasPermission(safeRole, "view-reports") && (
                                <Link href="/reports" className="hero-btn hero-btn-secondary">📄 Reports</Link>
                            )}
                        </div>
                    </div>
                    <div className="hero-right-deco">
                        <div className="hero-deco-card">
                            <span>💬</span>
                            <div>
                                <strong>{feedbackCount.toLocaleString()}</strong>
                                Total Feedback
                            </div>
                        </div>
                        <div className="hero-deco-card">
                            <span>😊</span>
                            <div>
                                <strong>{positiveCount.toLocaleString()}</strong>
                                Positive
                            </div>
                        </div>
                        <div className="hero-deco-card">
                            <span>🤖</span>
                            <div>
                                <strong>{analyzedCount.toLocaleString()}</strong>
                                Analyzed
                            </div>
                        </div>
                        <div className="hero-deco-card">
                            <span>👥</span>
                            <div>
                                <strong>{memberCount}</strong>
                                Members
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Stats ── */}
                <div className="stat-grid">
                    {[
                        { icon: "💬", label: "Total Feedback", value: feedbackCount, bg: "ic-cyan" },
                        { icon: "⏳", label: "Pending", value: pendingCount, bg: "ic-yellow" },
                        { icon: "👁️", label: "Reviewed", value: reviewedCount, bg: "ic-blue" },
                        { icon: "🤖", label: "Analyzed", value: analyzedCount, bg: "ic-violet" },
                        { icon: "😊", label: "Positive", value: positiveCount, bg: "ic-green" },
                        { icon: "👥", label: "Members", value: memberCount, bg: "ic-blue" },
                    ].map(({ icon, label, value, bg }) => (
                        <div key={label} className="stat-card">
                            <div className={`stat-card-icon ${bg}`}>{icon}</div>
                            <h5>{label}</h5>
                            <h2>{value.toLocaleString()}</h2>
                        </div>
                    ))}
                </div>

                {/* ── Mid row: chart + sentiment ── */}
                <div className="mid-grid">

                    {/* Weekly bar chart */}
                    <div className="chart-panel">
                        <div className="section-header">
                            <span className="panel-title">📈 Feedback Trend</span>
                            <Link href="/reports" className="view-all">View Reports →</Link>
                        </div>
                        <div className="bar-chart">
                            {trend.map((v, i) => (
                                <div key={i} className="bar-chart-col">
                                    <div
                                        className="bar-chart-bar"
                                        style={{ height: `${Math.round((v / maxTrend) * 100)}%` }}
                                        title={`${days[i]}: ${v}`}
                                    />
                                    <span className="bar-chart-label">{days[i]}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px", flexWrap: "wrap", gap: "8px" }}>
                            {[
                                { label: "Total", value: feedbackCount, color: "#22d3ee" },
                                { label: "Analyzed", value: analyzed, color: "#4ade80" },
                                { label: "Pending", value: pendingCount, color: "#fbbf24" },
                            ].map(({ label, value, color }) => (
                                <div key={label} style={{ textAlign: "center" }}>
                                    <p style={{ fontSize: "20px", fontWeight: 800, color }}>{value.toLocaleString()}</p>
                                    <p style={{ fontSize: "11px", color: "#475569" }}>{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sentiment breakdown */}
                    <div className="sentiment-panel">
                        <div className="panel-title">😊 Sentiment Breakdown</div>
                        <div className="sentiment-row">
                            {[
                                { label: "Positive", count: positiveCount, pct: posPct, color: "#4ade80" },
                                { label: "Neutral", count: neutralCount, pct: neuPct, color: "#fbbf24" },
                                { label: "Negative", count: negativeCount, pct: negPct, color: "#f87171" },
                            ].map(({ label, count, pct, color }) => (
                                <div key={label} className="sentiment-item">
                                    <div className="sentiment-dot" style={{ background: color }} />
                                    <div className="sentiment-info">
                                        <span>{label} — {count.toLocaleString()}</span>
                                        <div className="sentiment-bar-track">
                                            <div className="sentiment-bar-fill" style={{ width: `${pct}%`, background: color }} />
                                        </div>
                                    </div>
                                    <span className="sentiment-pct" style={{ color }}>{pct}%</span>
                                </div>
                            ))}
                        </div>

                        {/* Donut visual */}
                        <div style={{ marginTop: "auto", paddingTop: "20px", display: "flex", justifyContent: "center" }}>
                            <svg width="110" height="110" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="3.2" />
                                {(() => {
                                    const r = 15.9, circ = 2 * Math.PI * r;
                                    const segs = [
                                        { pct: posPct, color: "#4ade80" },
                                        { pct: neuPct, color: "#fbbf24" },
                                        { pct: negPct, color: "#f87171" },
                                    ];
                                    let offset = 0;
                                    return segs.map(({ pct, color }) => {
                                        const len = (pct / 100) * circ;
                                        const el = (
                                            <circle key={color} cx="18" cy="18" r={r}
                                                fill="none" stroke={color} strokeWidth="3.2"
                                                strokeDasharray={`${len} ${circ - len}`}
                                                strokeDashoffset={-offset}
                                            />
                                        );
                                        offset += len;
                                        return el;
                                    });
                                })()}
                            </svg>
                        </div>
                    </div>
                </div>

                {/* ── Quick Actions ── */}
                <div style={{ marginBottom: "28px" }}>
                    <div className="section-header" style={{ marginBottom: "14px" }}>
                        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#e2e8f0" }}>⚡ Quick Actions</h2>
                    </div>
                    <div className="actions-grid">
                        {tiles.map(({ href, icon, label, desc, bg }) => (
                            <Link key={href} href={href} className="action-tile">
                                <div className={`action-tile-icon ${bg}`}>{icon}</div>
                                <h4>{label}</h4>
                                <p>{desc}</p>
                                <span className="action-tile-arrow">→</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── Bottom: Recent + AI insight ── */}
                <div className="bottom-grid">

                    {/* Recent feedback */}
                    <div className="recent-panel">
                        <div className="section-header">
                            <span className="panel-title">🕐 Recent Feedback</span>
                            <Link href="/feedback" className="view-all">View all →</Link>
                        </div>
                        {recentFeedback.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "32px 0", color: "#475569" }}>
                                <p style={{ fontSize: "32px", marginBottom: "8px" }}>📭</p>
                                <p style={{ fontSize: "14px" }}>No feedback yet</p>
                                {hasPermission(safeRole, "upload-feedback") && (
                                    <Link href="/feedback/new" style={{ color: "#06b6d4", fontSize: "13px", textDecoration: "none" }}>+ Add first feedback</Link>
                                )}
                            </div>
                        ) : (
                            <div className="recent-list">
                                {recentFeedback.map((fb) => (
                                    <Link key={fb.id} href={`/feedback/${fb.id}`} className="recent-item">
                                        <div className="recent-dot" style={{ background: sentColor(fb.sentiment) }} />
                                        <div className="recent-text">
                                            <h4>{fb.customerLabel}</h4>
                                            <span>{fb.channel} · {new Date(fb.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                        </div>
                                        <span className={`recent-tag ${statusClass[fb.status] ?? ""}`}>
                                            {statusLabel[fb.status] ?? fb.status}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* AI Insight panel */}
                    <div className="ai-insight-panel">
                        <h3>🤖 AI Insights</h3>
                        <p>
                            {analyzed > 0
                                ? `${analyzed.toLocaleString()} of ${feedbackCount.toLocaleString()} feedback entries have been analyzed.`
                                : "Run AI analysis to detect sentiment, extract topics, keywords, and generate actionable recommendations."}
                        </p>
                        <div className="ai-stat-row">
                            <div className="ai-stat-item">
                                <span>😊 Positive</span>
                                <strong style={{ color: "#4ade80" }}>{posPct}%</strong>
                            </div>
                            <div className="ai-stat-item">
                                <span>😞 Negative</span>
                                <strong style={{ color: "#f87171" }}>{negPct}%</strong>
                            </div>
                            <div className="ai-stat-item">
                                <span>🤖 Analyzed</span>
                                <strong style={{ color: "#22d3ee" }}>{analyzed.toLocaleString()}</strong>
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                            {hasPermission(safeRole, "run-ai") && (
                                <Link href="/ai" className="ai-btn">🤖 Open AI Reports</Link>
                            )}
                            {hasPermission(safeRole, "view-reports") && (
                                <Link href="/reports" className="ai-btn" style={{ background: "linear-gradient(90deg,#7c3aed,#4f46e5)" }}>
                                    📄 View Reports
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
