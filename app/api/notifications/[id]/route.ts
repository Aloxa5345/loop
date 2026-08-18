/**
 * PATCH /api/notifications/[id] — mark one notification as read
 * DELETE /api/notifications/[id] — delete one notification
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

interface Props { params: Promise<{ id: string }> }

export async function PATCH(_req: Request, { params }: Props) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const n = await prisma.notification.findFirst({
        where: { id, userId: session.user.id, workspaceId: session.user.workspaceId },
    });
    if (!n) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.notification.update({ where: { id }, data: { read: true } });
    return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: Props) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const n = await prisma.notification.findFirst({
        where: { id, userId: session.user.id, workspaceId: session.user.workspaceId },
    });
    if (!n) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
