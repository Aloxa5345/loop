import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import ThemesClient from "./ThemesClient";
import "./themes.css";
export const dynamic = "force-dynamic";

export const metadata = { title: "Theme Clustering — LOOP AI" };

export default async function ThemesPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "view-analytics")) redirect("/dashboard");

    const canRunAI = hasPermission(role, "run-ai");

    return (
        <div className="dashboard">
            <Sidebar role={role} />
            <div className="main">
                <ThemesClient canRunAI={canRunAI} />
            </div>
        </div>
    );
}
