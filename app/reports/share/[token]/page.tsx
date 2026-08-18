/**
 * /reports/share/:token
 *
 * Public read-only view of a shared VoC report.
 * No auth required — accessible to anyone with the link.
 * Never allows editing, and never exposes workspace internals.
 */
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import ReportSummary from "@/components/ReportSummary";
import ThemeChart from "@/components/ThemeChart";
import SentimentChart from "@/components/SentimentChart";
import CustomerQuotes from "@/components/CustomerQuotes";
import Recommendations from "@/components/Recommendations";
import type { VocReportJson } from "@/lib/ai/vocReport";
import "../../reports.css";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const report = await prisma.report.findUnique({
        where: { shareToken: token },
        select: { title: true },
    });
    return { title: report ? `${report.title} — LOOP` : "Shared Report — LOOP" };
}

export default async function SharedReportPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;

    const report = await prisma.report.findUnique({
        where: { shareToken: token },
        include: { generatedBy: { select: { name: true } } },
    });

    if (!report) notFound();

    const voc = report.contentJson as unknown as VocReportJson;

    const fmt = (d: string) =>
        new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
    const periodLabel = `${fmt(voc.periodStart)} – ${fmt(voc.periodEnd)}`;

    return (
        <div style={{ minHeight: "100vh", background: "#0f172a" }}>
            {/* ── Public header ── */}
            <div style={{
                background: "linear-gradient(135deg,#0f172a,#1e1b4b)",
                borderBottom: "1px solid rgba(255,255,255,.08)",
                padding: "24px 40px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: "12px",
            }}>
                <div>
                    <div style={{
                        fontSize: "11px", color: "#6366f1", fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "4px",
                    }}>
                        🔗 Shared Report · Read Only
                    </div>
                    <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#f1f5f9", margin: 0 }}>
                        {report.title}
                    </h1>
                    <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
                        {voc.workspaceName} · {periodLabel}
                    </p>
                </div>
            </div>

            {/* ── Report body ── */}
            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
                <ReportSummary summary={voc.summary} />

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(380px,1fr))", gap: "20px" }}>
                    <ThemeChart themes={voc.topThemes} />
                    <SentimentChart
                        rows={voc.sentimentBreakdown}
                        trend={voc.sentimentTrend}
                        changes={voc.sentimentChanges}
                    />
                </div>

                <CustomerQuotes quotes={voc.customerQuotes} />
                <Recommendations recommendations={voc.recommendations} />

                {voc.topKeywords.length > 0 && (
                    <div className="voc-section">
                        <h2 className="voc-section-title">🔑 Top Keywords</h2>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {voc.topKeywords.map((kw) => (
                                <span key={kw} className="voc-keyword-chip">{kw}</span>
                            ))}
                        </div>
                    </div>
                )}

                {voc.byChannel.length > 0 && (
                    <div className="voc-section">
                        <h2 className="voc-section-title">📡 Channel Distribution</h2>
                        <div className="voc-channel-grid">
                            {voc.byChannel.slice(0, 6).map((c) => (
                                <div key={c.channel} className="voc-channel-card">
                                    <p className="voc-channel-name">{c.channel}</p>
                                    <p className="voc-channel-count">{c.count}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{
                    textAlign: "center", color: "#334155", fontSize: "12px",
                    padding: "20px 0 8px", borderTop: "1px solid rgba(255,255,255,.06)", marginTop: "8px",
                }}>
                    Generated by LOOP AI · {voc.workspaceName} · {new Date(voc.generatedAt).toLocaleString()}
                    {" · "}by {report.generatedBy.name}
                </div>
            </div>
        </div>
    );
}
