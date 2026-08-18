/**
 * POST /api/reports/share
 * Body: { id: string, enable?: boolean }
 *
 * Convenience alias — delegates to the per-report share endpoint logic.
 * enable=true (default): generate/return shareToken
 * enable=false: revoke sharing
 *
 * Admin and Analyst only.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { type RoleKey } from "@/app/lib/permissions";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => ({})) as { id?: string; enable?: boolean };
    const { id, enable = true } = body;

    if (!id) return NextResponse.json({ error: "Report id is required." }, { status: 400 });

    const report = await prisma.report.findFirst({
        where: { id, workspaceId: session.user.workspaceId },
        select: { id: true, shareToken: true },
    });
    if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });

    if (!enable) {
        await prisma.report.update({ where: { id }, data: { shareToken: null } });
        return NextResponse.json({ success: true, shared: false });
    }

    const token = report.shareToken ?? randomBytes(24).toString("hex");
    await prisma.report.update({ where: { id }, data: { shareToken: token } });

    return NextResponse.json({
        success: true,
        shared: true,
        shareToken: token,
        shareUrl: `/reports/share/${token}`,
    });
}
