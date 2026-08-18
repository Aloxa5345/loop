/**
 * POST /api/ai/retry
 *
 * Retries AI classification for a single feedback item that has
 * aiStatus = "Failed" (or any non-Completed status).
 *
 * Requires: run-ai permission (Admin / Analyst).
 *
 * Body: { feedbackId: string }
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import { classifyFeedback } from "@/lib/ai/classifyFeedback";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "run-ai")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { feedbackId } = body as { feedbackId?: string };

    if (!feedbackId || typeof feedbackId !== "string") {
        return NextResponse.json({ error: "feedbackId is required." }, { status: 400 });
    }

    // Verify the record belongs to this workspace
    const feedback = await prisma.feedback.findFirst({
        where: { id: feedbackId, workspaceId: session.user.workspaceId },
        select: { id: true, aiStatus: true },
    });

    if (!feedback) {
        return NextResponse.json({ error: "Feedback not found." }, { status: 404 });
    }

    if (feedback.aiStatus === "Processing") {
        return NextResponse.json({ error: "Classification already in progress." }, { status: 409 });
    }

    // Reset status to Pending before re-running so classifyFeedback starts fresh
    await prisma.feedback.update({
        where: { id: feedbackId },
        data: { aiStatus: "Pending" },
    });

    // Fire-and-forget — caller gets an immediate 202 Accepted
    classifyFeedback(feedbackId).catch((err) =>
        console.error(`[AI] Retry error for ${feedbackId}:`, err)
    );

    return NextResponse.json({ success: true, message: "AI classification re-queued." }, { status: 202 });
}
