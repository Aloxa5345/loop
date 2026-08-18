import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import type { FeedbackStatus } from "@/app/generated/prisma/enums";

const VALID_CHANNELS = [
    "Email", "WhatsApp", "Telegram", "Facebook", "Instagram",
    "X / Twitter", "LinkedIn", "Phone Call", "Support Ticket", "Live Chat",
    "Chatbot", "App Store Review", "Google Play Review", "Survey",
    "Website Form", "Sales Notes", "Other",
];
const VALID_STATUSES: FeedbackStatus[] = ["PENDING", "REVIEWED", "ANALYZED"];

type Params = { params: Promise<{ id: string }> };

// GET /api/feedback/:id
export async function GET(_req: Request, { params }: Params) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const feedback = await prisma.feedback.findFirst({
        where: { id, workspaceId: session.user.workspaceId },
        include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!feedback) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(feedback);
}

// PUT /api/feedback/:id
export async function PUT(request: Request, { params }: Params) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "edit-feedback")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.feedback.findFirst({
        where: { id, workspaceId: session.user.workspaceId },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
    if (!channel || channel.trim().length === 0)
        return NextResponse.json({ error: "Channel is required." }, { status: 400 });
    if (status && !VALID_STATUSES.includes(status as FeedbackStatus))
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });

    const updated = await prisma.feedback.update({
        where: { id },
        data: {
            title: title?.trim() || existing.title,
            content: content.trim(),
            channel,
            customerLabel: customerLabel.trim(),
            customerEmail: customerEmail?.trim() || existing.customerEmail,
            priority: priority ?? existing.priority,
            category: category ?? existing.category,
            productArea: productArea ?? existing.productArea,
            rating: rating ?? existing.rating,
            status: (status as FeedbackStatus) ?? existing.status,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(updated);
}

// DELETE /api/feedback/:id
export async function DELETE(_req: Request, { params }: Params) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "delete-feedback")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.feedback.findFirst({
        where: { id, workspaceId: session.user.workspaceId },
        select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Delete related records first to avoid foreign key constraint errors,
    // then delete the feedback itself — all in a single transaction.
    await prisma.$transaction([
        prisma.embedding.deleteMany({ where: { feedbackId: id } }),
        prisma.feedbackTheme.deleteMany({ where: { feedbackId: id } }),
        prisma.feedback.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
}
