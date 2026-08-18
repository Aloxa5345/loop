import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import Sidebar from "@/components/Sidebar";
import MembersClient from "./MembersClient";
import "@/app/dashboard/dashboard.css";
import "./members.css";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Users — LOOP" };

export default async function MembersPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const workspaceId = session.user.workspaceId;
    const role = session.user.role as RoleKey;
    const canManage = hasPermission(role, "manage-users");

    let workspace: { name: string } | null = null;
    let members: { id: string; userId: string; name: string; email: string; role: string; joinedAt: string }[] = [];
    let dbError = false;

    try {
        const [ws, memberships] = await Promise.all([
            prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } }),
            prisma.workspaceMember.findMany({
                where: { workspaceId },
                include: { user: { select: { id: true, name: true, email: true } } },
                orderBy: { joinedAt: "asc" },
            }),
        ]);
        workspace = ws;
        members = memberships.map((m) => ({
            id: m.id,
            userId: m.user.id,
            name: m.user.name,
            email: m.user.email,
            role: m.role as string,
            joinedAt: m.joinedAt.toISOString(),
        }));
    } catch {
        dbError = true;
    }

    const roleLabel = { ADMIN: "Admin", ANALYST: "Analyst", VIEWER: "Viewer" }[role] ?? role;

    return (
        <div className="dashboard">
            <Sidebar role={role} />
            <div className="main">

                {/* Header */}
                <div className="mem-header">
                    <div>
                        <h1>👤 Users</h1>
                        <p>{workspace?.name ?? "Workspace"} · {members.length} member{members.length !== 1 ? "s" : ""}</p>
                    </div>
                    <span className="mem-role-badge">{roleLabel}</span>
                </div>

                {/* DB error banner */}
                {dbError && (
                    <div style={{
                        background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)",
                        borderRadius: "12px", padding: "12px 16px", marginBottom: "20px",
                        color: "#fca5a5", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center",
                    }}>
                        <span>⚠️</span>
                        <span>Database is unreachable. Check your <code>.env</code> and restart the server.</span>
                    </div>
                )}

                {/* Members panel */}
                <div className="mem-panel">
                    <MembersClient
                        initialMembers={members}
                        canManage={canManage}
                        currentUserId={session.user.id}
                    />
                </div>

            </div>
        </div>
    );
}
