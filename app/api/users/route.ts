import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { hasPermission } from "@/app/lib/permissions";
import type { RoleKey } from "@/app/lib/permissions";

// GET /api/users — list members of the current workspace (ADMIN only)
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!hasPermission(session.user.role as RoleKey, "manage-users"))
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const members = await prisma.workspaceMember.findMany({
        where: { workspaceId: session.user.workspaceId },
        include: {
            user: { select: { id: true, name: true, email: true, createdAt: true } },
        },
        orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json(
        members.map((m) => ({
            id: m.id,
            userId: m.userId,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            joinedAt: m.joinedAt,
        }))
    );
}

// PATCH /api/users — update a member's role (ADMIN only)
export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!hasPermission(session.user.role as RoleKey, "assign-roles"))
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { memberId, role } = body as { memberId?: string; role?: string };

    const allowedRoles = ["ADMIN", "ANALYST", "VIEWER"];
    if (!memberId || !role || !allowedRoles.includes(role))
        return NextResponse.json({ error: "memberId and a valid role are required." }, { status: 400 });

    // Make sure the target member belongs to the same workspace
    const member = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: session.user.workspaceId },
    });
    if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });

    const updated = await prisma.workspaceMember.update({
        where: { id: memberId },
        data: { role: role as "ADMIN" | "ANALYST" | "VIEWER" },
        include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(updated);
}

// DELETE /api/users — remove a member from the workspace (ADMIN only)
export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!hasPermission(session.user.role as RoleKey, "manage-users"))
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    if (!memberId) return NextResponse.json({ error: "memberId is required." }, { status: 400 });

    const member = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: session.user.workspaceId },
    });
    if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });

    // Prevent removing the last admin
    if (member.role === "ADMIN") {
        const adminCount = await prisma.workspaceMember.count({
            where: { workspaceId: session.user.workspaceId, role: "ADMIN" },
        });
        if (adminCount <= 1)
            return NextResponse.json({ error: "Cannot remove the last ADMIN from the workspace." }, { status: 400 });
    }

    await prisma.workspaceMember.delete({ where: { id: memberId } });
    return NextResponse.json({ message: "Member removed." });
}
