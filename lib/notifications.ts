/**
 * notifications.ts
 *
 * Fire-and-forget helper to create in-app notifications for workspace Admins.
 * All functions are safe to call without awaiting — errors are logged but never thrown.
 */

import { prisma } from "@/app/lib/prisma";

export type NotificationType =
    | "new_feedback"
    | "csv_uploaded"
    | "ai_complete"
    | "ai_failed"
    | "user_joined"
    | "report_ready"
    | "simulated_imported";

interface NotifyOptions {
    workspaceId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
}

/**
 * Creates a notification for every ADMIN member of the workspace.
 * Safe to call fire-and-forget (never throws).
 */
export async function notifyAdmins(opts: NotifyOptions): Promise<void> {
    try {
        // Find all admin members in the workspace
        const admins = await prisma.workspaceMember.findMany({
            where: { workspaceId: opts.workspaceId, role: "ADMIN" },
            select: { userId: true },
        });

        if (admins.length === 0) return;

        await prisma.notification.createMany({
            data: admins.map((a) => ({
                workspaceId: opts.workspaceId,
                userId: a.userId,
                type: opts.type,
                title: opts.title,
                message: opts.message,
                link: opts.link ?? null,
            })),
        });
    } catch (err) {
        console.error("[notify] Failed to create notifications:", err);
    }
}

/**
 * Creates a notification for a specific user.
 * Safe to call fire-and-forget.
 */
export async function notifyUser(
    workspaceId: string,
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string
): Promise<void> {
    try {
        await prisma.notification.create({
            data: { workspaceId, userId, type, title, message, link: link ?? null },
        });
    } catch (err) {
        console.error("[notify] Failed to create notification:", err);
    }
}
