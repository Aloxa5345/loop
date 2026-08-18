import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import Sidebar from "@/components/Sidebar";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import Link from "next/link";
import ReportsClient from "./ReportsClient";
import "./reports.css";
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "view-reports")) redirect("/dashboard");

    const canExport = hasPermission(role, "export-reports");
    const canSchedule = hasPermission(role, "schedule-reports");
    const canGenerate = role !== "VIEWER";

    let workspace: { name: string } | null = null;
    let savedReports: { id: string; title: string; periodStart: Date; periodEnd: Date; createdAt: Date; generatedBy: { name: string } }[] = [];
    try {
        [workspace, savedReports] = await Promise.all([
            prisma.workspace.findUnique({
                where: { id: session.user.workspaceId },
                select: { name: true },
            }),
            prisma.report.findMany({
                where: { workspaceId: session.user.workspaceId },
                orderBy: { createdAt: "desc" },
                take: 20,
                select: {
                    id: true, title: true, periodStart: true, periodEnd: true,
                    createdAt: true, generatedBy: { select: { name: true } },
                },
            }),
        ]);
    } catch { /* DB unreachable */ }

    const roleLabel = { ADMIN: "Admin", ANALYST: "Analyst", VIEWER: "Viewer" }[role] ?? role;

    return (
        <div className="dashboard">
            <Sidebar role={role} />
            <div className="main">

                {/* Header */}
                <div className="rpt-header">
                    <div>
                        <h1>📄 Reports & Export</h1>
                        <p>Analyse feedback trends, generate VoC reports, export data, and schedule automated email reports.</p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{
                            background: "linear-gradient(90deg,#06b6d4,#7c3aed)",
                            padding: "6px 16px", borderRadius: "20px",
                            fontSize: "13px", fontWeight: 600, color: "#fff",
                        }}>
                            {roleLabel}
                        </span>
                        {canGenerate && (
                            <Link
                                href="/reports/new"
                                className="fb-add-btn"
                                style={{ fontSize: "13px", padding: "9px 18px", background: "linear-gradient(90deg,#06b6d4,#4f46e5)" }}
                            >
                                ✨ Generate VoC Report
                            </Link>
                        )}
                        <Link href="/feedback" className="fb-add-btn" style={{ fontSize: "13px", padding: "9px 18px" }}>
                            💬 Feedback
                        </Link>
                        <Link href="/ai" className="fb-add-btn" style={{ fontSize: "13px", padding: "9px 18px", background: "linear-gradient(90deg,#7c3aed,#4f46e5)" }}>
                            🤖 AI Reports
                        </Link>
                    </div>
                </div>

                {/* RBAC notice for Viewers */}
                {!canExport && (
                    <div style={{
                        background: "rgba(245,158,11,0.08)",
                        border: "1px solid rgba(245,158,11,0.2)",
                        borderRadius: "14px", padding: "13px 18px",
                        color: "#fbbf24", fontSize: "13px", marginBottom: "22px",
                        display: "flex", alignItems: "center", gap: "10px",
                    }}>
                        <span>🔒</span>
                        <span>You have <strong>view-only</strong> access. Export and scheduling require Admin or Analyst role.</span>
                    </div>
                )}

                {/* ── Saved VoC Reports ── */}
                {savedReports.length > 0 && (
                    <div className="voc-section" style={{ marginBottom: "28px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 className="voc-section-title" style={{ marginBottom: 0 }}>📋 Voice of Customer Reports</h2>
                            {canGenerate && (
                                <Link href="/reports/new" style={{ fontSize: "13px", color: "#22d3ee", textDecoration: "none", fontWeight: 500 }}>
                                    + New Report
                                </Link>
                            )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {savedReports.map((r) => (
                                <div key={r.id} className="voc-saved-row">
                                    <div className="voc-saved-icon">📄</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p className="voc-saved-title">{r.title}</p>
                                        <p className="voc-saved-meta">
                                            {new Date(r.periodStart).toLocaleDateString()} – {new Date(r.periodEnd).toLocaleDateString()}
                                            {" · "}by {r.generatedBy.name}
                                            {" · "}Generated {new Date(r.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Link href={`/reports/${r.id}`} className="voc-saved-btn">
                                        View →
                                    </Link>
                                    {canExport && (
                                        <Link href={`/reports/${r.id}`} className="voc-saved-btn" style={{ color: "#fca5a5", borderColor: "rgba(239,68,68,.2)" }}>
                                            📄 PDF
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {savedReports.length === 0 && canGenerate && (
                    <div style={{
                        background: "linear-gradient(135deg,rgba(6,182,212,.06),rgba(79,70,229,.06))",
                        border: "1px dashed rgba(6,182,212,.2)", borderRadius: "18px",
                        padding: "36px 24px", textAlign: "center", marginBottom: "28px",
                    }}>
                        <div style={{ fontSize: "40px", marginBottom: "12px" }}>📄</div>
                        <h3 style={{ color: "#94a3b8", fontSize: "16px", marginBottom: "8px" }}>No VoC Reports yet</h3>
                        <p style={{ color: "#475569", fontSize: "13px", marginBottom: "20px" }}>
                            Generate your first Voice of Customer report to summarise insights from your feedback.
                        </p>
                        <Link
                            href="/reports/new"
                            style={{
                                padding: "11px 28px", borderRadius: "12px",
                                background: "linear-gradient(90deg,#06b6d4,#4f46e5)",
                                color: "#fff", fontSize: "14px", fontWeight: 600,
                                textDecoration: "none", display: "inline-block",
                            }}
                        >
                            ✨ Generate VoC Report
                        </Link>
                    </div>
                )}

                {/* Client component — analytics, charts, export, schedules */}
                <ReportsClient
                    canExport={canExport}
                    canSchedule={canSchedule}
                    workspaceName={workspace?.name ?? "Workspace"}
                />

            </div>
        </div>
    );
}
