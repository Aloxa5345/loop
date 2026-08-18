import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import Sidebar from "@/components/Sidebar";
export const dynamic = "force-dynamic";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import ReportHeader from "@/components/ReportHeader";
import ReportSummary from "@/components/ReportSummary";
import SummaryCards from "@/components/SummaryCards";
import ThemeChart from "@/components/ThemeChart";
import SentimentChart from "@/components/SentimentChart";
import CustomerQuotes from "@/components/CustomerQuotes";
import Recommendations from "@/components/Recommendations";
import ReportActions from "@/components/ReportActions";
import type { VocReportJson } from "@/lib/ai/vocReport";
import "../reports.css";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const report = await prisma.report.findUnique({ where: { id }, select: { title: true } });
    return { title: report?.title ?? "VoC Report — LOOP" };
}

export default async function ReportViewPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "view-reports")) redirect("/dashboard");

    const { id } = await params;

    const report = await prisma.report.findFirst({
        where: { id, workspaceId: session.user.workspaceId },
        include: { generatedBy: { select: { name: true } } },
    });

    if (!report) notFound();

    const voc = report.contentJson as unknown as VocReportJson;
    const canDelete = role === "ADMIN";
    const canExport = hasPermission(role, "export-reports");
    const canShare = role !== "VIEWER";

    return (
        <div className="dashboard">
            <Sidebar role={role} />
            <div className="main">

                {/* ── Header + actions ── */}
                <div className="rpt-header">
                    <ReportHeader
                        title={report.title}
                        voc={voc}
                        generatedBy={report.generatedBy.name}
                        createdAt={report.createdAt.toISOString()}
                    />
                    <ReportActions
                        reportId={id}
                        canDelete={canDelete}
                        canExport={canExport}
                        canShare={canShare}
                        initialShareToken={report.shareToken}
                    />
                </div>

                {/* ── Summary cards (compact, print-friendly) ── */}
                <div className="voc-section rpt-no-print">
                    <h2 className="voc-section-title">📊 Voice of Customer Report · {voc.workspaceName}</h2>
                    <SummaryCards summary={voc.summary} />
                </div>

                {/* ── Executive summary + AI bullets ── */}
                <ReportSummary summary={voc.summary} />

                {/* ── Themes + Sentiment side by side ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "0" }}>
                    <ThemeChart themes={voc.topThemes} />
                    <SentimentChart
                        rows={voc.sentimentBreakdown}
                        trend={voc.sentimentTrend}
                        changes={voc.sentimentChanges}
                    />
                </div>

                {/* ── Customer quotes ── */}
                <CustomerQuotes quotes={voc.customerQuotes} />

                {/* ── Recommended actions ── */}
                <Recommendations recommendations={voc.recommendations} />

                {/* ── Keywords ── */}
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

                {/* ── Channel distribution ── */}
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

                {/* ── Footer ── */}
                <div style={{
                    textAlign: "center", color: "#334155", fontSize: "12px",
                    padding: "20px 0 8px", borderTop: "1px solid rgba(255,255,255,.06)", marginTop: "8px",
                }}>
                    Generated by LOOP AI · {voc.workspaceName} · {new Date(voc.generatedAt).toLocaleString()}
                </div>

            </div>
        </div>
    );
}
