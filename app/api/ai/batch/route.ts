/**
 * POST /api/ai/batch
 *
 * Queues all un-analyzed feedback in the workspace for AI classification.
 * Admin and Analyst only (run-ai permission).
 *
 * Optional body: { limit?: number }  — default 50, max 200
 *
 * Response: { queued: number, total: number }
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
        return NextResponse.json({ error: "Forbidden — run-ai permission required." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({})) as { limit?: number };
    const limit = Math.min(Math.max(1, body.limit ?? 50), 200);

    const workspaceId = session.user.workspaceId;

    // Find feedback that hasn't been analyzed yet (not ANALYZED status)
    const pending = await prisma.feedback.findMany({
        where: {
            workspaceId,
            status: { not: "ANALYZED" },
            aiStatus: { not: "Processing" },
        },
        select: { id: true },
        orderBy: { createdAt: "asc" },
        take: limit,
    });

    if (pending.length === 0) {
        return NextResponse.json({ queued: 0, total: 0, message: "No pending feedback to analyze." });
    }

    // Mark all as Processing immediately so re-submits don't double-queue
    await prisma.feedback.updateMany({
        where: { id: { in: pending.map(f => f.id) } },
        data: { aiStatus: "Processing" },
    });

    // Fire-and-forget all classifications with a small stagger to avoid rate limits
    let delay = 0;
    for (const f of pending) {
        const id = f.id;
        setTimeout(() => {
            classifyFeedback(id).catch((err) =>
                console.error(`[batch] classifyFeedback error for ${id}:`, err)
            );
        }, delay);
        delay += 200; // 200 ms stagger between each
    }

    return NextResponse.json(
        { queued: pending.length, total: pending.length, message: `Queued ${pending.length} items for analysis.` },
        { status: 202 }
    );
}
