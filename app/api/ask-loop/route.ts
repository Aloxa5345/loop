/**
 * POST /api/ask-loop
 *
 * RAG-powered chat endpoint.
 *
 * 1. Embeds the question via Voyage AI (falls back to local TF-IDF when no key).
 * 2. Searches for the top-5 most similar feedback in the workspace.
 * 3. Sends context + question to Claude with strict grounding instructions.
 * 4. Persists the exchange in ChatHistory.
 * 5. Returns { answer, sources }.
 *
 * All roles (Admin, Analyst, Viewer) can ask questions.
 * Only Admins can delete chat history (DELETE handler below).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { askLoop } from "@/lib/ai/chat";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = session.user.workspaceId;
    const userId = session.user.id;

    // ── Parse + validate ─────────────────────────────────────
    const body = await request.json().catch(() => ({}));
    const { question } = body as { question?: string };

    if (!question || typeof question !== "string" || question.trim().length === 0) {
        return NextResponse.json({ error: "question is required." }, { status: 400 });
    }
    if (question.trim().length > 500) {
        return NextResponse.json({ error: "question must be 500 characters or less." }, { status: 400 });
    }

    const q = question.trim();

    // ── Run RAG pipeline ─────────────────────────────────────
    let result: Awaited<ReturnType<typeof askLoop>>;
    try {
        result = await askLoop(q, workspaceId, 5);
    } catch (err) {
        console.error("[ask-loop] Pipeline error:", err);
        return NextResponse.json(
            { error: "AI service temporarily unavailable. Please try again." },
            { status: 503 }
        );
    }

    // ── Persist chat history ─────────────────────────────────
    try {
        await prisma.chatHistory.create({
            data: {
                question: q,
                answer: result.answer,
                sources: JSON.stringify(result.sources),
                workspaceId,
                userId,
            },
        });
    } catch (err) {
        // Non-fatal — answer was generated successfully
        console.warn("[ask-loop] Failed to save chat history:", err);
    }

    return NextResponse.json({
        answer: result.answer,
        sources: result.sources,
        ...(result.fallback ? { notice: "Answer generated from feedback summaries (AI credits unavailable)." } : {}),
    });
}

// ── GET — fetch chat history for current workspace ───────────
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

    const history = await prisma.chatHistory.findMany({
        where: { workspaceId: session.user.workspaceId },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: { id: true, question: true, answer: true, sources: true, createdAt: true },
    });

    return NextResponse.json({ history });
}

// ── DELETE — admin only, wipe workspace chat history ─────────
export async function DELETE() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.chatHistory.deleteMany({
        where: { workspaceId: session.user.workspaceId },
    });

    return NextResponse.json({ success: true });
}
