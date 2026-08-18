/**
 * activityLog.ts
 *
 * Fire-and-forget helper to record workspace activity events.
 * Call from API routes after successful mutations.
 *
 * Never throws — errors are logged to console only so they
 * never break the main request flow.
 */
import { prisma } from "@/app/lib/prisma";

export type ActivityAction =
    | "user.login"
    | "user.invited"
    | "user.removed"
    | "user.role_changed"
    | "feedback.created"
    | "feedback.updated"
    | "feedback.deleted"
    | "feedback.analyzed"
    | "csv.uploaded"
    | "simulated.imported"
    | "simulated.cleared"
    | "report.generated"
    | "report.shared"
    | "report.deleted"
    | "ai.batch_started"
    | "workspace.updated"
    | "workspace.deleted"
    | "chat.asked";

interface LogParams {
    workspaceId: string;
    userId: string;
    userEmail: string;
    userName: string;
    action: ActivityAction;
    entity: string;
    entityId?: string;
    detail?: string;
}

export function logActivity(params: LogParams): void {
    // Fire-and-forget — do not await
    prisma.activityLog.create({ data: params }).catch((err) =>
        console.error("[ActivityLog] Failed to write log:", err)
    );
}

/**
 * Create a notification for specific users in a workspace.
 */
export function createNotification(params: {
    workspaceId: string;
    userIds: string[];
    type: string;
    title: string;
    message: string;
    link?: string;
}): void {
    const { workspaceId, userIds, type, title, message, link } = params;
    Promise.all(
        userIds.map((userId) =>
            prisma.notification.create({
                data: { workspaceId, userId, type, title, message, link },
            })
        )
    ).catch((err) => console.error("[Notification] Failed to create:", err));
}

/**
 * Notify all ADMIN members of a workspace.
 */
export async function notifyAdmins(params: {
    workspaceId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
}): Promise<void> {
    try {
        const admins = await prisma.workspaceMember.findMany({
            where: { workspaceId: params.workspaceId, role: "ADMIN" },
            select: { userId: true },
        });
        createNotification({ ...params, userIds: admins.map((a) => a.userId) });
    } catch (err) {
        console.error("[Notification] Failed to notify admins:", err);
    }
}
