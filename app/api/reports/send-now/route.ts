/**
 * POST /api/reports/send-now
 *
 * Immediately sends the LOOP feedback report to:
 *  1. The email address provided in the request body
 *  2. All workspace members (their registered emails)
 *
 * Body: { email?: string }  — if omitted, sends only to workspace members
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import { getReportData, getDateRange } from "@/app/lib/reportData";
import { buildReportEmail } from "@/lib/email/reportEmail";
import { sendMail } from "@/lib/email/mailer";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "schedule-reports")) {
        return NextResponse.json({ error: "Forbidden — Admin only." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({})) as { email?: string; preset?: string };
    const workspaceId = session.user.workspaceId;

    // ── 1. Gather report data (last 30 days by default) ───────
    const { from, to } = getDateRange(body.preset ?? "30d");

    const [data, workspace, memberships] = await Promise.all([
        getReportData({ workspaceId, from, to }),
        prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } }),
        prisma.workspaceMember.findMany({
            where: { workspaceId },
            include: { user: { select: { email: true, name: true } } },
        }),
    ]);

    // ── 2. Collect all recipient emails ───────────────────────
    const recipientSet = new Set<string>();

    // Explicit email from request body
    if (body.email && body.email.includes("@")) {
        recipientSet.add(body.email.trim().toLowerCase());
    }

    // All workspace member emails
    for (const m of memberships) {
        if (m.user.email) recipientSet.add(m.user.email.trim().toLowerCase());
    }

    const recipients = Array.from(recipientSet);
    if (recipients.length === 0) {
        return NextResponse.json({ error: "No recipients found." }, { status: 400 });
    }

    // ── 3. Build email ────────────────────────────────────────
    const { subject, html, text } = buildReportEmail({
        workspaceName: workspace?.name ?? "Workspace",
        from,
        to,
        total: data.total,
        positive: data.positive,
        neutral: data.neutral,
        negative: data.negative,
        unanalyzed: data.unanalyzed,
        topTopics: data.topTopics,
        topRecommendations: data.topRecommendations,
        byChannel: data.byChannel,
    });

    // ── 4. Send email ─────────────────────────────────────────
    try {
        await sendMail({ to: recipients, subject, html, text });
    } catch (err) {
        const msg = (err as { message?: string })?.message ?? "Unknown error";
        console.error("[send-now] Email send failed:", msg);
        return NextResponse.json({
            error: `Email failed: ${msg}. Make sure SMTP_PASS is set in .env`,
        }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        sent: recipients.length,
        recipients,
        subject,
    });
}
