import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import Sidebar from "@/components/Sidebar";
import { type RoleKey } from "@/app/lib/permissions";
import NotificationsClient from "./NotificationsClient";
import MarkAllReadButton from "./MarkAllReadButton";
import type { NotificationItem } from "./NotificationsClient";
import "./notifications.css";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const role = session.user.role as RoleKey;

    let notifications: NotificationItem[] = [];
    let unread = 0;

    try {
        const raw = await prisma.notification.findMany({
            where: {
                workspaceId: session.user.workspaceId,
                userId: session.user.id,
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        notifications = raw.map((n) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            read: n.read,
            link: n.link,
            createdAt: n.createdAt.toISOString(),
        }));
        unread = notifications.filter((n) => !n.read).length;
    } catch {
        // DB unreachable — show empty
    }

    return (
        <div className="dashboard">
            <Sidebar role={role} />
            <div className="main">

                {/* Header */}
                <div className="notif-header">
                    <div>
                        <h1>🔔 Notifications</h1>
                        <p>System alerts and workspace activity updates.</p>
                    </div>
                    <div className="notif-actions">
                        {unread > 0 && <MarkAllReadButton />}
                    </div>
                </div>

                <NotificationsClient
                    initialItems={notifications}
                    initialUnread={unread}
                />

            </div>
        </div>
    );
}
