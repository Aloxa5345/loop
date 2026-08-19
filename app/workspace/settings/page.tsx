import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import Sidebar from "@/components/Sidebar";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import WorkspaceSettingsClient from "./WorkspaceSettingsClient";
import "./settings.css";

export const dynamic = "force-dynamic";

export default async function WorkspaceSettingsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "workspace-settings")) redirect("/dashboard");

    const workspaceId = session.user.workspaceId;

    type WorkspaceData = {
        id: string;
        name: string;
        description: string | null;
        logo: string | null;
        industry: string | null;
        timezone: string | null;
        ownerId: string;
        createdAt: Date;
        _count: { members: number; feedbacks: number; reports: number };
    };

    let workspace: WorkspaceData | null = null;
    let members: { id: string; userId: string; name: string; email: string; role: string; joinedAt: string }[] = [];
    let dbError = false;

    try {
        const raw = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { _count: { select: { members: true, feedbacks: true, reports: true } } },
        });
        if (raw) {
            workspace = {
                id: raw.id,
                name: raw.name,
                description: raw.description,
                logo: raw.logo ?? null,
                industry: raw.industry ?? null,
                timezone: raw.timezone ?? null,
                ownerId: raw.ownerId,
                createdAt: raw.createdAt,
                _count: raw._count,
            };
        }

        const memberships = await prisma.workspaceMember.findMany({
            where: { workspaceId },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { joinedAt: "asc" },
        });

        members = memberships.map((m) => ({
            id: m.id,
            userId: m.user.id,
            name: m.user.name,
            email: m.user.email,
            role: m.role as string,
            joinedAt: m.joinedAt.toISOString(),
        }));
    } catch { dbError = true; }

    const roleLabel = ({ ADMIN: "Admin", ANALYST: "Analyst", VIEWER: "Viewer" } as Record<string, string>)[role] ?? role;
    // Use workspace name from DB, or fall back to workspaceId as a placeholder
    const workspaceName = workspace?.name ?? "";

    return (
        <div className="dashboard">
            <Sidebar role={role} />
            <div className="main">

                <div style={{ marginBottom: "28px" }}>
                    <h1 style={{ fontSize: "30px", fontWeight: 700 }}>⚙️ Workspace Settings</h1>
                    <p style={{ color: "#94a3b8", marginTop: "4px", fontSize: "15px" }}>
                        {workspaceName ? `${workspaceName} — ` : ""}Manage your workspace, members, roles, and security.
                    </p>
                </div>

                {dbError && (
                    <div style={{
                        background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)",
                        borderRadius: "12px", padding: "12px 16px", marginBottom: "20px",
                        color: "#fca5a5", fontSize: "13px",
                    }}>
                        ⚠️ Database is unreachable — settings may not load correctly. Check your <code>.env</code> and restart the server.
                    </div>
                )}

                <WorkspaceSettingsClient
                    workspaceId={workspaceId}
                    initialName={workspaceName}
                    initialDescription={workspace?.description ?? ""}
                    initialLogo={workspace?.logo ?? ""}
                    initialIndustry={workspace?.industry ?? ""}
                    initialTimezone={workspace?.timezone ?? "UTC"}
                    memberCount={workspace?._count.members ?? 0}
                    feedbackCount={workspace?._count.feedbacks ?? 0}
                    reportCount={workspace?._count.reports ?? 0}
                    createdAt={workspace?.createdAt.toISOString() ?? new Date().toISOString()}
                    isOwner={workspace?.ownerId === session.user.id}
                    canManageSettings={hasPermission(role, "workspace-settings")}
                    currentUserName={session.user.name ?? ""}
                    currentUserEmail={session.user.email ?? ""}
                    currentUserRole={roleLabel}
                    members={members}
                />

            </div>
        </div>
    );
}
