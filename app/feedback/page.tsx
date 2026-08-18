import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import Sidebar from "@/components/Sidebar";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import Link from "next/link";
import FeedbackListClient from "./FeedbackListClient";
import ResetFailedButton from "./ResetFailedButton";
import { FeedbackStatus } from "@/app/generated/prisma/enums";
import "./feedback.css";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "view-feedback")) redirect("/dashboard");

    const canCreate = hasPermission(role, "upload-feedback");
    const canEdit = hasPermission(role, "edit-feedback");
    const canDelete = hasPermission(role, "delete-feedback");
    const canRunAI = hasPermission(role, "run-ai");

    // Wrap ALL DB calls in try/catch so the page renders even when DB is down
    let failedAiCount = 0;
    let total = 0, pending = 0, reviewed = 0, analyzed = 0;
    let dbError = false;

    try {
        [total, pending, reviewed, analyzed] = await Promise.all([
            prisma.feedback.count({ where: { workspaceId: session.user.workspaceId } }),
            prisma.feedback.count({ where: { workspaceId: session.user.workspaceId, status: FeedbackStatus.PENDING } }),
            prisma.feedback.count({ where: { workspaceId: session.user.workspaceId, status: FeedbackStatus.REVIEWED } }),
            prisma.feedback.count({ where: { workspaceId: session.user.workspaceId, status: FeedbackStatus.ANALYZED } }),
        ]);

        if (canRunAI) {
            failedAiCount = await prisma.feedback.count({
                where: { workspaceId: session.user.workspaceId, aiStatus: "Failed" },
            });
        }
    } catch {
        // DB unreachable — show page with zero counts, table will show its own error state
        dbError = true;
    }

    return (
        <div className="dashboard">
            <Sidebar role={role} />
            <div className="main">

                {/* Header */}
                <div className="feedback-header">
                    <div>
                        <h1>💬 Feedback</h1>
                        <p>Manage and review customer feedback for your workspace.</p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                        {canCreate && (
                            <Link href="/feedback/new" className="fb-add-btn">
                                + Add Feedback
                            </Link>
                        )}
                        <ResetFailedButton count={failedAiCount} />
                    </div>
                </div>

                {/* DB error banner */}
                {dbError && (
                    <div style={{
                        background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)",
                        borderRadius: "12px", padding: "12px 16px", marginBottom: "20px",
                        color: "#fca5a5", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center",
                    }}>
                        <span>⚠️</span>
                        <span>Database is unreachable. Please check your connection in <code>.env</code> and restart the server.</span>
                    </div>
                )}

                {/* Stats */}
                <div className="fb-stats">
                    <div className="fb-stat-card"><h5>Total Feedback</h5><h2>{total}</h2></div>
                    <div className="fb-stat-card"><h5>Pending</h5><h2>{pending}</h2></div>
                    <div className="fb-stat-card"><h5>Reviewed</h5><h2>{reviewed}</h2></div>
                    <div className="fb-stat-card"><h5>Analyzed</h5><h2>{analyzed}</h2></div>
                </div>

                {/* Read-only notice for Viewers */}
                {!canCreate && (
                    <div style={{
                        background: "rgba(6,182,212,.07)", border: "1px solid rgba(6,182,212,.2)",
                        borderRadius: "12px", padding: "11px 16px", marginBottom: "20px",
                        color: "#22d3ee", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center",
                    }}>
                        <span>👀</span>
                        <span>You have <strong>read-only</strong> access to the Feedback Inbox.</span>
                    </div>
                )}

                {/* Feedback table — handles its own loading/error state */}
                <FeedbackListClient
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canRunAI={canRunAI}
                />

            </div>
        </div>
    );
}
