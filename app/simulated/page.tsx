import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import Sidebar from "@/components/Sidebar";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import Link from "next/link";
import SimulatedClient from "./SimulatedClient";
import "./simulated.css";

export const dynamic = "force-dynamic";

export default async function SimulatedPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "view-simulated")) redirect("/dashboard");

    const canImport = hasPermission(role, "import-simulated");
    const canDelete = hasPermission(role, "delete-simulated");
    const workspaceId = session.user.workspaceId;
    const roleLabel = { ADMIN: "Admin", ANALYST: "Analyst", VIEWER: "Viewer" }[role] ?? role;

    // Wrap DB calls so page renders even when DB is slow/unreachable
    let total = 0, supportCount = 0, appStoreCount = 0, surveyCount = 0, salesCount = 0;
    try {
        [total, supportCount, appStoreCount, surveyCount, salesCount] = await Promise.all([
            prisma.feedback.count({ where: { workspaceId } }),
            prisma.feedback.count({ where: { workspaceId, channel: "Support Ticket" } }),
            prisma.feedback.count({ where: { workspaceId, channel: "App Store Review" } }),
            prisma.feedback.count({ where: { workspaceId, channel: "Survey" } }),
            prisma.feedback.count({ where: { workspaceId, channel: "Sales Notes" } }),
        ]);
    } catch {
        // DB unreachable — show page with zero counts
    }

    return (
        <div className="dashboard">
            <Sidebar role={role} />
            <div className="main">

                {/* Header */}
                <div className="sim-header">
                    <div>
                        <h1>🔌 Sample Channels</h1>
                        <p>
                            Import demo feedback from 4 simulated channels.{" "}
                            <Link href="/feedback" style={{ color: "#06b6d4", textDecoration: "none" }}>
                                ← View Feedback
                            </Link>
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{
                            background: "linear-gradient(90deg,#06b6d4,#7c3aed)",
                            padding: "6px 16px", borderRadius: "20px",
                            fontSize: "13px", fontWeight: 600, color: "#fff",
                        }}>
                            {roleLabel}
                        </span>
                        <Link href="/feedback" className="fb-add-btn">
                            📋 View Feedback
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="sim-stats">
                    <div className="sim-stat-card">
                        <h5>📊 Total Feedback</h5>
                        <h2>{total.toLocaleString()}</h2>
                    </div>
                    <div className="sim-stat-card">
                        <h5>🎫 Support Tickets</h5>
                        <h2>{supportCount.toLocaleString()}</h2>
                    </div>
                    <div className="sim-stat-card">
                        <h5>📱 App Store Reviews</h5>
                        <h2>{appStoreCount.toLocaleString()}</h2>
                    </div>
                    <div className="sim-stat-card">
                        <h5>📋 Surveys</h5>
                        <h2>{surveyCount.toLocaleString()}</h2>
                    </div>
                    <div className="sim-stat-card">
                        <h5>💼 Sales Notes</h5>
                        <h2>{salesCount.toLocaleString()}</h2>
                    </div>
                </div>

                {/* Channel cards */}
                <SimulatedClient canImport={canImport} canDelete={canDelete} />

            </div>
        </div>
    );
}
