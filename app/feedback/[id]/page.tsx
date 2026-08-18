import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import Sidebar from "@/components/Sidebar";
export const dynamic = "force-dynamic";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import SentimentCard from "@/components/SentimentCard";
import TopicCard from "@/components/TopicCard";
import KeywordCard from "@/components/KeywordCard";
import SummaryCard from "@/components/SummaryCard";
import RecommendationCard from "@/components/RecommendationCard";
import Link from "next/link";
import "../feedback.css";

interface Props {
    params: Promise<{ id: string }>;
}

function parseJsonArr(v: string | null | undefined): string[] {
    if (!v) return [];
    try { return JSON.parse(v) as string[]; } catch { return []; }
}

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
    PENDING: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "rgba(245,158,11,0.3)" },
    REVIEWED: { bg: "rgba(6,182,212,0.15)", color: "#22d3ee", border: "rgba(6,182,212,0.3)" },
    ANALYZED: { bg: "rgba(34,197,94,0.15)", color: "#4ade80", border: "rgba(34,197,94,0.3)" },
};

export default async function FeedbackDetailPage({ params }: Props) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const role = session.user.role as RoleKey;
    const canView =
        hasPermission(role, "upload-feedback") ||
        hasPermission(role, "view-reports") ||
        hasPermission(role, "view-analytics");
    if (!canView) redirect("/dashboard");

    const { id } = await params;

    let feedback: Awaited<ReturnType<typeof prisma.feedback.findFirst>> | null = null;
    try {
        feedback = await prisma.feedback.findFirst({
            where: { id, workspaceId: session.user.workspaceId },
            include: { user: { select: { name: true, email: true } } },
        });
    } catch {
        // DB unreachable — show error page instead of crashing
        return (
            <div className="dashboard">
                <Sidebar role={role} />
                <div className="main">
                    <div style={{
                        background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)",
                        borderRadius: "12px", padding: "20px 24px", color: "#fca5a5",
                        marginTop: "40px",
                    }}>
                        <p style={{ fontWeight: 600, marginBottom: "6px" }}>⚠️ Database Unreachable</p>
                        <p style={{ fontSize: "13px", color: "#64748b" }}>
                            Could not load feedback. Please check your database connection in <code>.env</code> and restart the server.
                        </p>
                        <Link href="/feedback" style={{ color: "#06b6d4", textDecoration: "none", fontSize: "13px", display: "inline-block", marginTop: "12px" }}>
                            ← Back to Inbox
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!feedback) notFound();

    const canEdit = hasPermission(role, "edit-feedback");
    const canDelete = hasPermission(role, "delete-feedback");
    const canRunAI = hasPermission(role, "run-ai");

    const topics = parseJsonArr(feedback.topics);
    const keywords = parseJsonArr(feedback.keywords);
    const recs = parseJsonArr(feedback.recommendations);
    const hasAI = !!(feedback.sentiment || feedback.aiSummary || topics.length);
    const statusStyle = STATUS_STYLE[feedback.status] ?? STATUS_STYLE.PENDING;

    // AI status display config
    const AI_STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
        Pending: { bg: "rgba(100,116,139,0.15)", color: "#94a3b8", label: "⏳ Pending" },
        Processing: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24", label: "⚙️ Processing" },
        Completed: { bg: "rgba(34,197,94,0.15)", color: "#4ade80", label: "✅ Completed" },
        Failed: { bg: "rgba(239,68,68,0.15)", color: "#f87171", label: "❌ Failed" },
    };
    const aiStatusCfg = AI_STATUS_CFG[(feedback as Record<string, unknown>).aiStatus as string ?? "Pending"] ?? AI_STATUS_CFG.Pending;

    return (
        <div className="dashboard">
            <Sidebar role={role} />
            <div className="main">

                {/* Header */}
                <div className="feedback-header">
                    <div>
                        <p style={{ marginBottom: "6px" }}>
                            <Link href="/feedback" style={{ color: "#06b6d4", textDecoration: "none", fontSize: "13px" }}>
                                ← Back to Inbox
                            </Link>
                        </p>
                        <h1>💬 Feedback Detail</h1>
                    </div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        {canRunAI && (
                            <Link
                                href={`/feedback?analyze=${feedback.id}`}
                                className="fb-add-btn"
                                style={{ background: "linear-gradient(90deg,#7c3aed,#4f46e5)" }}
                            >
                                🤖 AI Analysis
                            </Link>
                        )}
                        {canEdit && (
                            <Link href={`/feedback/${feedback.id}/edit`} className="fb-add-btn" style={{ background: "rgba(79,70,229,0.25)", border: "1px solid rgba(79,70,229,0.4)", color: "#a5b4fc" }}>
                                ✏️ Edit
                            </Link>
                        )}
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", maxWidth: "900px" }}>

                    {/* Meta card */}
                    <div style={{
                        gridColumn: "1 / -1",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "18px", padding: "24px",
                    }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "16px", marginBottom: "20px" }}>
                            {[
                                { label: "Customer", value: feedback.customerLabel },
                                ...(((feedback as Record<string, unknown>).customerEmail as string) ? [{ label: "Email", value: (feedback as Record<string, unknown>).customerEmail as string }] : []),
                                { label: "Channel", value: feedback.channel },
                                { label: "Status", value: feedback.status.charAt(0) + feedback.status.slice(1).toLowerCase(), style: statusStyle },
                                ...(((feedback as Record<string, unknown>).priority as string) ? [{ label: "Priority", value: (feedback as Record<string, unknown>).priority as string }] : []),
                                ...(((feedback as Record<string, unknown>).category as string) ? [{ label: "Category", value: (feedback as Record<string, unknown>).category as string }] : []),
                                ...(((feedback as Record<string, unknown>).productArea as string) ? [{ label: "Product Area", value: (feedback as Record<string, unknown>).productArea as string }] : []),
                                { label: "Created", value: new Date(feedback.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
                                { label: "Submitted by", value: feedback.user?.name ?? "—" },
                            ].map(({ label, value, style: s }) => (
                                <div key={label}>
                                    <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "5px" }}>{label}</p>
                                    {s ? (
                                        <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                                            {value}
                                        </span>
                                    ) : (
                                        <p style={{ fontSize: "14px", color: "#e2e8f0", fontWeight: 500 }}>{value}</p>
                                    )}
                                </div>
                            ))}
                            {/* Star rating */}
                            {((feedback as Record<string, unknown>).rating as number) > 0 && (
                                <div>
                                    <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "5px" }}>Rating</p>
                                    <p style={{ fontSize: "16px" }}>
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <span key={i} style={{ color: i < ((feedback as Record<string, unknown>).rating as number) ? "#fbbf24" : "rgba(255,255,255,.15)" }}>★</span>
                                        ))}
                                        <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "6px" }}>{(feedback as Record<string, unknown>).rating as number}/5</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
                            💬 Feedback Content
                        </p>
                        <p style={{ color: "#cbd5e1", fontSize: "15px", lineHeight: 1.8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "16px 18px" }}>
                            {feedback.content}
                        </p>
                    </div>

                    {/* AI Results */}
                    {hasAI ? (
                        <>
                            {/* AI Classification summary */}
                            <div style={{
                                gridColumn: "1 / -1",
                                background: "linear-gradient(135deg, rgba(6,182,212,0.06), rgba(124,58,237,0.06))",
                                border: "1px solid rgba(99,102,241,0.2)",
                                borderRadius: "18px", padding: "20px 24px",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0" }}>🤖 AI Classification</h3>
                                    <span style={{
                                        padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                                        background: aiStatusCfg.bg, color: aiStatusCfg.color,
                                    }}>
                                        {aiStatusCfg.label}
                                    </span>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                                    {[
                                        { label: "Sentiment", value: feedback.sentiment ?? "—", color: feedback.sentiment === "Positive" ? "#4ade80" : feedback.sentiment === "Negative" ? "#f87171" : "#fbbf24" },
                                        { label: "Confidence", value: feedback.sentimentScore != null ? `${Math.round(feedback.sentimentScore * 100)}%` : "—", color: "#22d3ee" },
                                        { label: "Theme", value: topics[0] ?? "—", color: "#06b6d4" },
                                        { label: "Feature Area", value: (feedback as Record<string, unknown>).featureArea as string ?? "—", color: "#c4b5fd" },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "12px 14px" }}>
                                            <p style={{ fontSize: "10px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{label}</p>
                                            <p style={{ fontSize: "14px", fontWeight: 700, color }}>{value}</p>
                                        </div>
                                    ))}
                                </div>
                                {keywords.length > 0 && (
                                    <div style={{ marginTop: "14px" }}>
                                        <p style={{ fontSize: "10px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Keywords</p>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                            {keywords.map((kw) => (
                                                <span key={kw} style={{ padding: "3px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, background: "rgba(6,182,212,0.1)", color: "#22d3ee", border: "1px solid rgba(6,182,212,0.2)", fontFamily: "monospace" }}>
                                                    {kw}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <SentimentCard sentiment={feedback.sentiment ?? null} />
                            <TopicCard topics={topics} />
                            <KeywordCard keywords={keywords} />
                            <SummaryCard summary={feedback.aiSummary ?? null} />
                            <div style={{ gridColumn: "1 / -1" }}>
                                <RecommendationCard recommendations={recs} />
                            </div>
                        </>
                    ) : (
                        <div style={{
                            gridColumn: "1 / -1",
                            background: "rgba(124,58,237,0.07)",
                            border: "1px solid rgba(124,58,237,0.2)",
                            borderRadius: "16px", padding: "28px",
                            textAlign: "center", color: "#64748b",
                        }}>
                            <p style={{ fontSize: "32px", marginBottom: "12px" }}>🤖</p>
                            <p style={{ color: "#94a3b8", fontWeight: 600, marginBottom: "6px" }}>No AI analysis yet</p>
                            {canRunAI && (
                                <p style={{ fontSize: "13px" }}>Go back to the <Link href="/feedback" style={{ color: "#06b6d4", textDecoration: "none" }}>Inbox</Link> and click 🤖 Analyze.</p>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
