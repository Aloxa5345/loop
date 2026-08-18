import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import NewReportClient from "./NewReportClient";
import "../reports.css";
export const dynamic = "force-dynamic";

export const metadata = { title: "Generate VoC Report — LOOP" };

export default async function NewReportPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const role = session.user.role as RoleKey;
    // Viewers cannot generate reports
    if (!hasPermission(role, "view-reports") || role === "VIEWER") redirect("/reports");

    return (
        <div className="dashboard">
            <Sidebar role={role} />
            <div className="main">
                <NewReportClient />
            </div>
        </div>
    );
}
