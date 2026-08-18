import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import { analyzeFeedback } from "@/app/lib/anthropic";

// POST /api/ai/analyze
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "run-ai")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { feedbackId } = body as { feedbackId?: string };

    if (!feedbackId) {
        return NextResponse.json({ error: "feedbackId is required." }, { status: 400 });
    }

    const feedback = await prisma.feedback.findFirst({
        where: { id: feedbackId, workspaceId: session.user.workspaceId },
    });

    if (!feedback) {
        return NextResponse.json({ error: "Feedback not found." }, { status: 404 });
    }

    const analysis = await analyzeFeedback(feedback.content);

    const updated = await prisma.feedback.update({
        where: { id: feedbackId },
        data: {
            sentiment: analysis.sentiment,
            topics: JSON.stringify(analysis.topics),
            keywords: JSON.stringify(analysis.keywords),
            aiSummary: analysis.summary,
            recommendations: JSON.stringify(analysis.recommendations),
            status: "ANALYZED",
            analyzedAt: new Date(),
        },
    });

    return NextResponse.json({
        success: true,
        sentiment: analysis.sentiment,
        topics: analysis.topics,
        keywords: analysis.keywords,
        summary: analysis.summary,
        recommendations: analysis.recommendations,
        feedbackId: updated.id,
    });
}
