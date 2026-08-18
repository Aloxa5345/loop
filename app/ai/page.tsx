import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import Sidebar from "@/components/Sidebar";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import AnalyticsChart from "@/components/AnalyticsChart";
import AIInsightCard from "@/components/AIInsightCard";
import Link from "next/link";
import "./ai.css";
export const dynamic = "force-dynamic";

function parseJsonArr(val: string | null | undefined): string[] {
    if (!val) return [];
    try { return JSON.parse(val) as string[]; } catch { return []; }
}

function countMap(items: string[]): Record<string, number> {
    const map: Record<string, number> = {};
    for (const i of items) map[i] = (map[i] ?? 0) + 1;
    return map;
}

function topEntries(map: Record<string, number>, n: number) {
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n);
}

export default async function AIPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const role = session.user.role as RoleKey;
    // All roles with view-ai can see this page (Admin+Analyst can run AI, Viewer can read)
    if (!hasPermission(role, "view-ai")) redirect("/dashboard");

    const canRunAI = hasPermission(role, "run-ai");
    const workspaceId = session.user.workspaceId;

    let allFeedback: { sentiment: string | null; topics: string | null; keywords: string | null; aiSummary: string | null; recommendations: string | null; status: string; analyzedAt: Date | null }[] = [];
    try {
        allFeedback = await prisma.feedback.findMany({
            where: { workspaceId },
            select: {
                sentiment: true, topics: true, keywords: true,
                aiSummary: true, recommendations: true,
                status: true, analyzedAt: true,
            },
        });
    } catch { /* DB unreachable — render with empty data */ }

    const total = allFeedback.length;
    const analyzed = allFeedback.filter((f) => f.status === "ANALYZED").length;
    const positive = allFeedback.filter((f) => f.sentiment === "Positive").length;
    const neutral = allFeedback.filter((f) => f.sentiment === "Neutral").length;
    const negative = allFeedback.filter((f) => f.sentiment === "Negative").length;

    // Aggregate topics
    const topicMap: Record<string, number> = {};
    for (const f of allFeedback) {
        for (const t of parseJsonArr(f.topics)) topicMap[t] = (topicMap[t] ?? 0) + 1;
    }
    const topTopics = topEntries(topicMap, 8).map(([topic, count]) => ({ topic, count }));

    // Aggregate keywords
    const keywordMap: Record<string, number> = {};
    for (const f of allFeedback) {
        for (const k of parseJsonArr(f.keywords)) keywordMap[k] = (keywordMap[k] ?? 0) + 1;
    }
    const topKeywords = topEntries(keywordMap, 10);

    // Aggregate recommendations
    const recMap: Record<string, number> = {};
    for (const f of allFeedback) {
        for (const r of parseJsonArr(f.recommendations)) recMap[r] = (recMap[r] ?? 0) + 1;
    }
    const topRecs = topEntries(recMap, 5);

    // Percentages
    const positivePct = total > 0 ? Math.round((positive / total) * 100) : 0;
    const neutralPct = total > 0 ? Math.round((neutral / total) * 100) : 0;
    const negativePct = total > 0 ? Math.round((negative / total) * 100) : 0;

    const mostDiscussed = topTopics[0]?.topic ?? "—";
    const topKeyword = topKeywords[0]?.[0] ?? "—";
    const topRec = topRecs[0]?.[0] ?? "—";

    return (
        <div className="dashboard">
            <Sidebar role={role} />
            <div className="main">

                {/* Header */}
                <div className="ai-page-header">
                    <div>
                        <h1>🤖 AI Reports</h1>
                        <p>Sentiment, topics, keywords and recommendations powered by Claude.</p>
                    </div>
                    {canRunAI && (
                        <Link href="/feedback" className="fb-add-btn">▶ Analyze Feedback</Link>
                    )}
                </div>

                {/* AI Insight Card */}
                <div style={{ marginBottom: "28px" }}>
                    <AIInsightCard insights={[
                        { label: "Positive Feedback", value: `${positivePct}%`, accent: "green" },
                        { label: "Negative Feedback", value: `${negativePct}%`, accent: "red" },
                        { label: "Neutral Feedback", value: `${neutralPct}%`, accent: "orange" },
                        { label: "Top Topic", value: mostDiscussed, accent: "cyan" },
                        { label: "Most Mentioned Keyword", value: topKeyword, accent: "purple" },
                        { label: "Most Requested Feature", value: topRec.length > 30 ? topRec.slice(0, 30) + "…" : topRec },
                        { label: "Analyzed", value: `${analyzed} / ${total}`, sub: "feedback items" },
                    ]} />
                </div>

                {/* Stats cards */}
                <div className="ai-stats">
                    <div className="ai-stat total">
                        <h5>📊 Total</h5>
                        <h2>{total}</h2>
                    </div>
                    <div className="ai-stat positive">
                        <h5>😊 Positive</h5>
                        <h2>{positive}</h2>
                    </div>
                    <div className="ai-stat neutral">
                        <h5>😐 Neutral</h5>
                        <h2>{neutral}</h2>
                    </div>
                    <div className="ai-stat negative">
                        <h5>😞 Negative</h5>
                        <h2>{negative}</h2>
                    </div>
                </div>

                {/* Sentiment + Topics chart */}
                <AnalyticsChart
                    counts={{ positive, neutral, negative }}
                    topTopics={topTopics}
                />

                {/* Keywords + Recommendations side by side */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>

                    {/* Top Keywords */}
                    <div style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "18px", padding: "24px",
                    }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "18px", color: "#e2e8f0" }}>
                            🔑 Most Common Keywords
                        </h3>
                        {topKeywords.length === 0 ? (
                            <p style={{ color: "#475569", fontSize: "14px" }}>No keywords yet.</p>
                        ) : (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {topKeywords.map(([kw, count]) => (
                                    <span key={kw} style={{
                                        background: "rgba(6,182,212,0.1)",
                                        color: "#22d3ee",
                                        border: "1px solid rgba(6,182,212,0.2)",
                                        borderRadius: "8px",
                                        padding: "5px 14px",
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        fontFamily: "monospace",
                                    }}>
                                        {kw}
                                        <span style={{ marginLeft: "6px", color: "#475569", fontSize: "11px" }}>×{count}</span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Top AI Recommendations */}
                    <div style={{
                        background: "rgba(16,185,129,0.05)",
                        border: "1px solid rgba(16,185,129,0.15)",
                        borderRadius: "18px", padding: "24px",
                    }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "18px", color: "#e2e8f0" }}>
                            💡 AI Recommendations
                        </h3>
                        {topRecs.length === 0 ? (
                            <p style={{ color: "#475569", fontSize: "14px" }}>No recommendations yet.</p>
                        ) : (
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                                {topRecs.map(([rec, count], i) => (
                                    <li key={rec} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                        <span style={{
                                            minWidth: "22px", height: "22px", borderRadius: "50%",
                                            background: "linear-gradient(135deg,#06b6d4,#10b981)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "11px", fontWeight: 700, color: "#fff", marginTop: "1px",
                                        }}>
                                            {i + 1}
                                        </span>
                                        <span style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: 1.6 }}>
                                            {rec}
                                            <span style={{ marginLeft: "6px", color: "#475569", fontSize: "12px" }}>({count}×)</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Empty state */}
                {analyzed === 0 && (
                    <div style={{
                        marginTop: "32px", textAlign: "center", padding: "48px 24px",
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "18px", color: "#475569",
                    }}>
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🤖</div>
                        <h3 style={{ color: "#94a3b8", marginBottom: "8px" }}>No AI analysis yet</h3>
                        <p style={{ fontSize: "14px" }}>
                            Go to{" "}
                            <Link href="/feedback" style={{ color: "#06b6d4", textDecoration: "none" }}>
                                Feedback
                            </Link>{" "}
                            and click 🤖 Analyze on any item to get started.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}
