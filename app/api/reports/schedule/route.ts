import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";

function calcNextRun(frequency: string, hour: number, dayOfWeek?: number): Date {
    const now = new Date();
    const next = new Date(now);
    next.setMinutes(0, 0, 0);
    next.setHours(hour);

    if (frequency === "daily") {
        if (next <= now) next.setDate(next.getDate() + 1);
    } else if (frequency === "weekly") {
        const target = dayOfWeek ?? 1; // default Monday
        const diff = (target - now.getDay() + 7) % 7 || 7;
        next.setDate(now.getDate() + diff);
    } else if (frequency === "monthly") {
        next.setDate(1);
        if (next <= now) next.setMonth(next.getMonth() + 1);
    }
    return next;
}

// GET /api/reports/schedule — list schedules for workspace
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "view-reports")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const schedules = await prisma.reportSchedule.findMany({
        where: { workspaceId: session.user.workspaceId },
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { name: true } } },
    });

    return NextResponse.json(schedules);
}

// POST /api/reports/schedule — create a new schedule
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "schedule-reports")) {
        return NextResponse.json({ error: "Forbidden — Admin only." }, { status: 403 });
    }

    const body = await request.json() as {
        email?: string; frequency?: string; format?: string;
        dayOfWeek?: number; hour?: number;
    };

    if (!body.email || !body.email.includes("@")) {
        return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }
    const frequency = body.frequency ?? "weekly";
    const format = (body.format ?? "CSV").toUpperCase();
    const hour = typeof body.hour === "number" ? body.hour : 9;
    const dayOfWeek = typeof body.dayOfWeek === "number" ? body.dayOfWeek : 1;

    const nextRun = calcNextRun(frequency, hour, dayOfWeek);

    const schedule = await prisma.reportSchedule.create({
        data: {
            email: body.email,
            frequency,
            format,
            dayOfWeek,
            hour,
            nextRun,
            workspaceId: session.user.workspaceId,
            createdById: session.user.id,
        },
    });

    return NextResponse.json(schedule, { status: 201 });
}

// DELETE /api/reports/schedule?id=xxx
export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "schedule-reports")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

    const existing = await prisma.reportSchedule.findFirst({
        where: { id, workspaceId: session.user.workspaceId },
    });
    if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

    await prisma.reportSchedule.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
