import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";

// GET /api/reports/:id
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "view-reports")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const report = await prisma.report.findFirst({
        where: { id, workspaceId: session.user.workspaceId },
        include: { generatedBy: { select: { name: true, email: true } } },
    });

    if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });

    return NextResponse.json(report);
}

// DELETE /api/reports/:id  — Admin only
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const report = await prisma.report.findFirst({
        where: { id, workspaceId: session.user.workspaceId },
    });
    if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });

    await prisma.report.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
