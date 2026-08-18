import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { hasPermission } from "@/app/lib/permissions";
import type { RoleKey } from "@/app/lib/permissions";
import { notifyAdmins } from "@/lib/notifications";

// POST /api/invite — invite a user to the current workspace by email
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only ADMINs can invite
    if (!hasPermission(session.user.role as RoleKey, "manage-users"))
        return NextResponse.json({ error: "Forbidden: only ADMINs can invite users." }, { status: 403 });

    const body = await request.json();
    const { email, role } = body as { email?: string; role?: string };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });

    const allowedRoles = ["ADMIN", "ANALYST", "VIEWER"];
    if (!role || !allowedRoles.includes(role))
        return NextResponse.json({ error: "Role must be ADMIN, ANALYST, or VIEWER." }, { status: 400 });

    const workspaceId = session.user.workspaceId;

    // Confirm caller is actually a member/admin of this workspace
    const callerMembership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    });
    if (!callerMembership || callerMembership.role !== "ADMIN")
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    // Find the target user
    const target = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!target)
        return NextResponse.json({ error: "No account found with that email." }, { status: 404 });

    // Check if already a member
    const existing = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: target.id } },
    });
    if (existing)
        return NextResponse.json({ error: "User is already a member of this workspace." }, { status: 409 });

    const membership = await prisma.workspaceMember.create({
        data: { workspaceId, userId: target.id, role: role as "ADMIN" | "ANALYST" | "VIEWER" },
        include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Notify admins that a new user joined
    notifyAdmins({
        workspaceId,
        type: "user_joined",
        title: "New User Joined",
        message: `${target.name} (${target.email}) joined the workspace as ${role}.`,
        link: "/workspace/members",
    }).catch(() => { });

    return NextResponse.json({ ...membership, userId: target.id }, { status: 201 });
}
