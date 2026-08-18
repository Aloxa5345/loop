import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

// ── GET /api/workspace — list workspaces the current user belongs to ──────
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const memberships = await prisma.workspaceMember.findMany({
        where: { userId: session.user.id },
        include: {
            workspace: {
                include: {
                    owner: { select: { id: true, name: true, email: true } },
                    _count: { select: { members: true, feedbacks: true } },
                },
            },
        },
        orderBy: { joinedAt: "asc" },
    });

    const workspaces = memberships.map((m) => ({
        ...m.workspace,
        myRole: m.role,
        joinedAt: m.joinedAt,
    }));

    return NextResponse.json(workspaces);
}

// ── POST /api/workspace — create a new workspace ─────────────────────────
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, description } = body as { name?: string; description?: string };

    if (!name || name.trim().length < 2)
        return NextResponse.json({ error: "Workspace name must be at least 2 characters." }, { status: 400 });

    const workspace = await prisma.$transaction(async (tx) => {
        const ws = await tx.workspace.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                ownerId: session.user.id,
            },
        });

        await tx.workspaceMember.create({
            data: { workspaceId: ws.id, userId: session.user.id, role: "ADMIN" },
        });

        return ws;
    });

    return NextResponse.json(workspace, { status: 201 });
}

// ── PATCH /api/workspace — update name/description (Admin only) ───────────
export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = session.user.workspaceId;

    const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
        select: { role: true },
    });
    if (!membership || membership.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden — Admin only." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({})) as {
        name?: string;
        description?: string;
        logo?: string;
        industry?: string;
        timezone?: string;
    };

    if (body.name !== undefined && body.name.trim().length < 2)
        return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
    if (body.name !== undefined && body.name.trim().length > 80)
        return NextResponse.json({ error: "Name must be 80 characters or less." }, { status: 400 });

    const updated = await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
            ...(body.name !== undefined ? { name: body.name.trim() } : {}),
            ...(body.description !== undefined ? { description: body.description.trim() || null } : {}),
            ...(body.logo !== undefined ? { logo: body.logo || null } : {}),
            ...(body.industry !== undefined ? { industry: body.industry || null } : {}),
            ...(body.timezone !== undefined ? { timezone: body.timezone || null } : {}),
        },
        select: { id: true, name: true, description: true, logo: true, industry: true, timezone: true },
    });

    return NextResponse.json(updated);
}

// ── DELETE /api/workspace — delete workspace (owner only) ─────────────────
export async function DELETE() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = session.user.workspaceId;

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { ownerId: true },
    });
    if (!workspace) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    if (workspace.ownerId !== session.user.id) {
        return NextResponse.json({ error: "Only the workspace owner can delete it." }, { status: 403 });
    }

    // Delete in dependency order to respect foreign keys
    await prisma.$transaction([
        prisma.chatHistory.deleteMany({ where: { workspaceId } }),
        prisma.reportSchedule.deleteMany({ where: { workspaceId } }),
        prisma.report.deleteMany({ where: { workspaceId } }),
        prisma.embedding.deleteMany({ where: { feedback: { workspaceId } } }),
        prisma.feedbackTheme.deleteMany({ where: { feedback: { workspaceId } } }),
        prisma.feedback.deleteMany({ where: { workspaceId } }),
        prisma.theme.deleteMany({ where: { workspaceId } }),
        prisma.workspaceMember.deleteMany({ where: { workspaceId } }),
        prisma.workspace.delete({ where: { id: workspaceId } }),
    ]);

    return NextResponse.json({ success: true });
}
