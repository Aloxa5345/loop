import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import Sidebar from "@/components/Sidebar";
import WorkspaceCard from "@/components/WorkspaceCard";
import { type RoleKey } from "@/app/lib/permissions";
import type { Metadata } from "next";
import Link from "next/link";
import "./workspace.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Workspaces — LOOP" };

export default async function WorkspacePage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const role = session.user.role as RoleKey;

    type MembershipWithWorkspace = Awaited<ReturnType<typeof prisma.workspaceMember.findMany<{
        include: {
            workspace: {
                include: {
                    owner: { select: { id: true; name: true } };
                    _count: { select: { members: true; feedbacks: true } };
                };
            };
        };
    }>>>;
    let memberships: MembershipWithWorkspace = [];
    try {
        memberships = await prisma.workspaceMember.findMany({
            where: { userId: session.user.id },
            include: {
                workspace: {
                    include: {
                        owner: { select: { id: true, name: true } },
                        _count: { select: { members: true, feedbacks: true } },
                    },
                },
            },
            orderBy: { joinedAt: "asc" },
        });
    } catch { /* DB unreachable */ }

    return (
        <div className="dashboard">
            <Sidebar role={role} />
            <div className="main">

                {/* Header */}
                <div className="ws-header">
                    <div>
                        <h1>🏢 Workspaces</h1>
                        <p>{memberships.length} workspace{memberships.length !== 1 ? "s" : ""} you belong to</p>
                    </div>
                    <div className="ws-header-actions">
                        <Link href="/workspace/create" className="ws-new-btn">
                            + New Workspace
                        </Link>
                    </div>
                </div>

                {/* Content */}
                {memberships.length === 0 ? (
                    <div className="ws-empty">
                        <div className="ws-empty-icon">🏢</div>
                        <h3>No workspaces yet</h3>
                        <p>Create a workspace to start collecting and analysing customer feedback.</p>
                        <Link href="/workspace/create" className="ws-new-btn" style={{ margin: "0 auto" }}>
                            + Create Workspace
                        </Link>
                    </div>
                ) : (
                    <div className="ws-grid">
                        {memberships.map((m) => (
                            <WorkspaceCard
                                key={m.workspace.id}
                                id={m.workspace.id}
                                name={m.workspace.name}
                                description={m.workspace.description}
                                memberCount={m.workspace._count.members}
                                feedbackCount={m.workspace._count.feedbacks}
                                myRole={m.role}
                                ownerName={m.workspace.owner.name}
                            />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
