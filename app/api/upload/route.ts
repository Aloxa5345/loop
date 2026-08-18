import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import Papa from "papaparse";
import { z } from "zod";
import type { FeedbackStatus } from "@/app/generated/prisma/enums";
import { classifyFeedback } from "@/lib/ai/classifyFeedback";
import { notifyAdmins } from "@/lib/notifications";

const VALID_CHANNELS = new Set([
    // New channels
    "Email", "WhatsApp", "Telegram", "Facebook", "Instagram",
    "X / Twitter", "LinkedIn", "Phone Call", "Support Ticket", "Live Chat",
    "Chatbot", "App Store Review", "Google Play Review", "Survey",
    "Website Form", "Sales Notes", "Other",
    // Legacy channel names (backward compatibility for old CSV files)
    "Website", "Twitter", "Play Store", "App Store", "Manual",
]);

// Zod schema for one CSV row (after header parsing)
const RowSchema = z.object({
    content: z.string().min(1, "Content is required").max(5000, "Content too long"),
    channel: z.string().min(1, "Channel is required"),
    customer_label: z.string().min(1, "Customer label is required"),
    // Optional extended fields
    title: z.string().optional(),
    customer_email: z.string().email("Invalid email").optional().or(z.literal("")),
    priority: z.enum(["High", "Medium", "Low"]).optional().or(z.literal("")),
    category: z.string().optional(),
    product_area: z.string().optional(),
    rating: z.string().optional().refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= 5), { message: "Rating must be 1-5" }),
    created_at: z.string().optional().refine((v) => !v || !isNaN(Date.parse(v)), { message: "Invalid date" }),
});

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "upload-feedback")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
        return NextResponse.json({ error: "No CSV file provided." }, { status: 400 });
    }

    const text = await (file as Blob).text();

    // Parse CSV
    const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
        transform: (v) => v.trim(),
    });

    if (!parsed.data.length) {
        return NextResponse.json({ error: "CSV is empty." }, { status: 400 });
    }

    const errors: { row: number; message: string }[] = [];
    const validRows: {
        content: string;
        channel: string;
        customerLabel: string;
        title: string | null;
        customerEmail: string | null;
        priority: string | null;
        category: string | null;
        productArea: string | null;
        rating: number | null;
        createdAt: Date;
    }[] = [];

    for (let i = 0; i < parsed.data.length; i++) {
        const rowNum = i + 2;
        const rawRow = parsed.data[i];

        const result = RowSchema.safeParse(rawRow);
        if (!result.success) {
            const messages = result.error.issues.map((e: { message: string }) => e.message).join("; ");
            errors.push({ row: rowNum, message: messages });
            continue;
        }

        const d = result.data;
        validRows.push({
            content: d.content,
            channel: d.channel,
            customerLabel: d.customer_label,
            title: d.title?.trim() || null,
            customerEmail: d.customer_email?.trim() || null,
            priority: d.priority?.trim() || null,
            category: d.category?.trim() || null,
            productArea: d.product_area?.trim() || null,
            rating: d.rating ? parseInt(d.rating, 10) : null,
            createdAt: d.created_at ? new Date(d.created_at) : new Date(),
        });
    }

    // Bulk insert valid rows
    let importedRows = 0;
    if (validRows.length > 0) {
        const status: FeedbackStatus = "PENDING";
        const insertedAt = new Date();

        try {
            const result = await prisma.feedback.createMany({
                data: validRows.map((r) => ({
                    content: r.content,
                    channel: r.channel,
                    customerLabel: r.customerLabel,
                    title: r.title,
                    customerEmail: r.customerEmail,
                    priority: r.priority,
                    category: r.category,
                    productArea: r.productArea,
                    rating: r.rating,
                    status,
                    createdAt: r.createdAt,
                    workspaceId: session.user.workspaceId,
                    userId: session.user.id,
                })),
                skipDuplicates: true,
            });
            importedRows = result.count;

            // ── Notify admins of CSV upload ─────────────────────────────
            notifyAdmins({
                workspaceId: session.user.workspaceId,
                type: "csv_uploaded",
                title: "CSV Upload Completed",
                message: `${session.user.name} imported ${importedRows} feedback row${importedRows !== 1 ? "s" : ""} via CSV (${errors.length} failed).`,
                link: "/feedback",
            }).catch(() => { });

            // Fire AI classification for new rows (fire-and-forget)
            if (importedRows > 0) {
                const newRecords = await prisma.feedback.findMany({
                    where: {
                        workspaceId: session.user.workspaceId,
                        aiStatus: "Pending",
                        createdAt: { gte: new Date(insertedAt.getTime() - 5000) },
                    },
                    select: { id: true },
                    orderBy: { createdAt: "desc" },
                    take: importedRows,
                });

                newRecords.forEach((rec, i) => {
                    setTimeout(() => {
                        classifyFeedback(rec.id).catch((err) =>
                            console.error(`[AI] CSV classification error for ${rec.id}:`, err)
                        );
                    }, i * 300);
                });
            }
        } catch (dbErr) {
            console.error("[CSV Upload] Database error:", dbErr);
            return NextResponse.json({
                error: "Database is unreachable. Please check your database connection and try again.",
                totalRows: parsed.data.length,
                importedRows: 0,
                failedRows: errors.length,
                errors,
            }, { status: 503 });
        }
    }

    return NextResponse.json({
        success: true,
        totalRows: parsed.data.length,
        importedRows,
        failedRows: errors.length,
        errors,
    });
}
