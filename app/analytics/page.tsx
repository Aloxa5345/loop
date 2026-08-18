import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import AnalyticsDashboardClient from "./AnalyticsDashboardClient";
import "./analytics.css";
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "view-analytics")) redirect("/dashboard");

    const canRunAI = hasPermission(role, "run-ai");
    const canExport = hasPermission(role, "export-reports");

    return (
        <div className="dashboard">
            <Sidebar role={role} />
            <div className="main">
                <AnalyticsDashboardClient
                    userName={session.user.name ?? "User"}
                    workspaceId={session.user.workspaceId}
                    role={role}
                    canRunAI={canRunAI}
                    canExport={canExport}
                />
            </div>
        </div>
    );
}
