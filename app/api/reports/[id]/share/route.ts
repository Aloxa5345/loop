/**
 * POST /api/reports/:id/share   — enable sharing, returns shareToken
 * DELETE /api/reports/:id/share — disable sharing
 *
 * Admin and Analyst only.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { type RoleKey } from "@/app/lib/permissions";
import { randomBytes } from "crypto";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const report = await prisma.report.findFirst({
        where: { id, workspaceId: session.user.workspaceId },
        select: { id: true, shareToken: true },
    });
    if (!report) return NextResponse.json({ error: "Not found." }, { status: 404 });

    // Reuse existing token or generate a new one
    const token = report.shareToken ?? randomBytes(24).toString("hex");

    await prisma.report.update({
        where: { id },
        data: { shareToken: token },
    });

    return NextResponse.json({ shareToken: token, shareUrl: `/reports/share/${token}` });
}

export async function DELETE(_req: Request, { params }: Params) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const report = await prisma.report.findFirst({
        where: { id, workspaceId: session.user.workspaceId },
        select: { id: true },
    });
    if (!report) return NextResponse.json({ error: "Not found." }, { status: 404 });

    await prisma.report.update({ where: { id }, data: { shareToken: null } });
    return NextResponse.json({ success: true });
}
