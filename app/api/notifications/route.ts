/**
 * GET  /api/notifications        — list notifications for the current user
 * PATCH /api/notifications       — mark ALL as read
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notifications = await prisma.notification.findMany({
        where: {
            workspaceId: session.user.workspaceId,
            userId: session.user.id,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    const unread = notifications.filter((n) => !n.read).length;
    return NextResponse.json({ notifications, unread });
}

export async function PATCH() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.notification.updateMany({
        where: {
            workspaceId: session.user.workspaceId,
            userId: session.user.id,
            read: false,
        },
        data: { read: true },
    });

    return NextResponse.json({ success: true });
}
