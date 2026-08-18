import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import { getReportData, getDateRange } from "@/app/lib/reportData";
import { buildVocReport, type VocReportJson } from "@/lib/ai/vocReport";

// GET /api/reports?preset=30d&from=&to=
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "view-reports")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const preset = searchParams.get("preset") ?? "30d";
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    let from: Date, to: Date;
    if (fromParam && toParam) {
        from = new Date(fromParam);
        to = new Date(toParam);
        to.setHours(23, 59, 59, 999);
    } else {
        ({ from, to } = getDateRange(preset));
    }

    const data = await getReportData({ workspaceId: session.user.workspaceId, from, to });

    // Saved VoC reports list
    const savedReports = await prisma.report.findMany({
        where: { workspaceId: session.user.workspaceId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
            id: true, title: true, format: true,
            periodStart: true, periodEnd: true, createdAt: true,
            generatedBy: { select: { name: true } },
        },
    });

    return NextResponse.json({ ...data, savedReports, from: from.toISOString(), to: to.toISOString() });
}

// POST /api/reports — generate and save a new VoC report
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "generate-reports")) {
        return NextResponse.json({ error: "Forbidden — Admin or Analyst required." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({})) as {
        title?: string; preset?: string; from?: string; to?: string;
    };

    let from: Date, to: Date;
    if (body.from && body.to) {
        from = new Date(body.from);
        to = new Date(body.to);
        to.setHours(23, 59, 59, 999);
    } else {
        ({ from, to } = getDateRange(body.preset ?? "30d"));
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id: session.user.workspaceId },
        select: { name: true },
    });

    const data = await getReportData({ workspaceId: session.user.workspaceId, from, to });

    // Build VoC report content
    const reportJson: VocReportJson = buildVocReport(data, {
        workspaceName: workspace?.name ?? "Workspace",
        from,
        to,
    });

    const title = body.title?.trim() ||
        `VoC Report — ${from.toLocaleDateString("en-US", { month: "short", year: "numeric" })} – ${to.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;

    const saved = await prisma.report.create({
        data: {
            title,
            format: "VoC",
            periodStart: from,
            periodEnd: to,
            contentJson: reportJson as object,
            workspaceId: session.user.workspaceId,
            generatedById: session.user.id,
        },
        include: { generatedBy: { select: { name: true } } },
    });

    return NextResponse.json(saved, { status: 201 });
}
