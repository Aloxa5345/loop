/**
 * POST /api/ai/classify
 *
 * On-demand AI classification for a single feedback item.
 * Any role with run-ai permission can trigger this.
 *
 * Body: { feedbackId: string }
 *
 * Response:
 *   202 — classification queued (fire-and-forget, same pattern as auto-classify)
 *   400 — missing feedbackId
 *   401 — unauthenticated
 *   403 — insufficient role
 *   404 — feedback not found in workspace
 *   409 — already processing
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

    // Verify ownership
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

    // Reset to Pending so the pipeline starts clean (handles re-classify too)
    await prisma.feedback.update({
        where: { id: feedbackId },
        data: { aiStatus: "Pending" },
    });

    // Fire-and-forget — return 202 immediately
    classifyFeedback(feedbackId).catch((err) =>
        console.error(`[AI] /classify error for ${feedbackId}:`, err)
    );

    return NextResponse.json(
        { success: true, message: "AI classification started.", feedbackId },
        { status: 202 }
    );
}
