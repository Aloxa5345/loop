import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import type { FeedbackWhereInput, FeedbackOrderByWithRelationInput } from "@/app/generated/prisma/models/Feedback";
import type { FeedbackStatus } from "@/app/generated/prisma/enums";
import { classifyFeedback } from "@/lib/ai/classifyFeedback";
import { notifyAdmins } from "@/lib/notifications";

const VALID_CHANNELS = [
    "Email", "WhatsApp", "Telegram", "Facebook", "Instagram",
    "X / Twitter", "LinkedIn", "Phone Call", "Support Ticket", "Live Chat",
    "Chatbot", "App Store Review", "Google Play Review", "Survey",
    "Website Form", "Sales Notes", "Other",
];
const VALID_STATUSES: FeedbackStatus[] = ["PENDING", "REVIEWED", "ANALYZED"];

function getDateBounds(dateFilter: string): { gte?: Date; lte?: Date } | null {
    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);

    switch (dateFilter) {
        case "today": {
            const end = new Date(today); end.setHours(23, 59, 59, 999);
            return { gte: today, lte: end };
        }
        case "yesterday": {
            const start = new Date(today); start.setDate(start.getDate() - 1);
            const end = new Date(start); end.setHours(23, 59, 59, 999);
            return { gte: start, lte: end };
        }
        case "7d": {
            const start = new Date(today); start.setDate(start.getDate() - 6);
            return { gte: start };
        }
        case "30d": {
            const start = new Date(today); start.setDate(start.getDate() - 29);
            return { gte: start };
        }
        case "90d": {
            const start = new Date(today); start.setDate(start.getDate() - 89);
            return { gte: start };
        }
        default: return null;
    }
}

// GET /api/feedback
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    const canView =
        hasPermission(role, "view-feedback") ||
        hasPermission(role, "upload-feedback") ||
        hasPermission(role, "view-analytics");
    if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const channel = searchParams.get("channel") ?? "";
    const sentiment = searchParams.get("sentiment") ?? "";
    const status = searchParams.get("status") ?? "";
    const dateFilter = searchParams.get("date") ?? "";
    const sort = searchParams.get("sort") ?? "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10)));

    const where: FeedbackWhereInput = {
        workspaceId: session.user.workspaceId,
    };

    if (q) {
        where.OR = [
            { content: { contains: q, mode: "insensitive" } },
            { customerLabel: { contains: q, mode: "insensitive" } },
            { channel: { contains: q, mode: "insensitive" } },
            { topics: { contains: q, mode: "insensitive" } },
            { keywords: { contains: q, mode: "insensitive" } },
        ];
    }
    if (channel) where.channel = channel;
    if (sentiment) where.sentiment = sentiment;
    if (status && VALID_STATUSES.includes(status as FeedbackStatus)) {
        where.status = status as FeedbackStatus;
    }
    const dateBounds = dateFilter ? getDateBounds(dateFilter) : null;
    if (dateBounds) where.createdAt = dateBounds;

    const sortMap: Record<string, FeedbackOrderByWithRelationInput> = {
        oldest: { createdAt: "asc" },
        az: { customerLabel: "asc" },
        za: { customerLabel: "desc" },
        status: { status: "asc" },
        channel: { channel: "asc" },
        positive: { sentiment: "asc" },
        negative: { sentiment: "desc" },
    };
    const orderBy = sortMap[sort] ?? { createdAt: "desc" };

    const [total, items] = await Promise.all([
        prisma.feedback.count({ where }),
        prisma.feedback.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include: { user: { select: { id: true, name: true, email: true } } },
        }),
    ]);

    return NextResponse.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
}

// POST /api/feedback
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "upload-feedback")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { content, channel, customerLabel, customerEmail, title, priority, category, productArea, rating, status } = body as {
        content?: string; channel?: string; customerLabel?: string;
        customerEmail?: string; title?: string;
        priority?: string; category?: string; productArea?: string;
        rating?: number; status?: string;
    };

    if (!content || content.trim().length === 0)
        return NextResponse.json({ error: "Content is required." }, { status: 400 });
    if (content.trim().length > 5000)
        return NextResponse.json({ error: "Content must be 5000 characters or less." }, { status: 400 });
    if (!customerLabel || customerLabel.trim().length === 0)
        return NextResponse.json({ error: "Customer label is required." }, { status: 400 });
    if (!channel || !VALID_CHANNELS.includes(channel))
        return NextResponse.json({ error: "Channel is required." }, { status: 400 });
    if (status && !VALID_STATUSES.includes(status as FeedbackStatus))
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    if (rating !== undefined && (rating < 1 || rating > 5))
        return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });

    const feedback = await prisma.feedback.create({
        data: {
            content: content.trim(),
            channel,
            customerLabel: customerLabel.trim(),
            customerEmail: customerEmail?.trim() || null,
            title: title?.trim() || null,
            priority: priority || null,
            category: category || null,
            productArea: productArea || null,
            rating: rating ?? null,
            status: (status as FeedbackStatus) ?? "PENDING",
            workspaceId: session.user.workspaceId,
            userId: session.user.id,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
    });

    // ── Fire-and-forget AI classification ──────────────────────
    classifyFeedback(feedback.id).catch((err) =>
        console.error("[AI] Background classification error:", err)
    );

    // ── Notify admins of new feedback ───────────────────────────
    notifyAdmins({
        workspaceId: session.user.workspaceId,
        type: "new_feedback",
        title: "New Feedback Added",
        message: `${session.user.name} added feedback from ${channel} — "${(title ?? content).slice(0, 60)}${(title ?? content).length > 60 ? "…" : ""}"`,
        link: `/feedback/${feedback.id}`,
    }).catch(() => { });

    return NextResponse.json(feedback, { status: 201 });
}


// DELETE /api/feedback — bulk delete all feedback in the workspace (Admin only)
export async function DELETE() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "delete-feedback")) {
        return NextResponse.json({ error: "Forbidden — Admin only." }, { status: 403 });
    }

    const workspaceId = session.user.workspaceId;

    // Get all feedback IDs in the workspace
    const feedbackIds = await prisma.feedback.findMany({
        where: { workspaceId },
        select: { id: true },
    });
    const ids = feedbackIds.map((f) => f.id);

    if (ids.length === 0) {
        return NextResponse.json({ deleted: 0 });
    }

    // Delete related records first, then feedback — in one transaction
    await prisma.$transaction([
        prisma.embedding.deleteMany({ where: { feedbackId: { in: ids } } }),
        prisma.feedbackTheme.deleteMany({ where: { feedbackId: { in: ids } } }),
        prisma.feedback.deleteMany({ where: { workspaceId } }),
    ]);

    return NextResponse.json({ deleted: ids.length });
}
