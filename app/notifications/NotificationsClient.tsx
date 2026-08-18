"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface NotificationItem {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    link: string | null;
    createdAt: string;
}

interface Props {
    initialItems: NotificationItem[];
    initialUnread: number;
}

const TYPE_ICON: Record<string, string> = {
    new_feedback: "💬",
    csv_uploaded: "📂",
    ai_complete: "🤖",
    ai_failed: "❌",
    user_joined: "👤",
    report_ready: "📄",
    simulated_imported: "🔗",
};

const TYPE_LABEL: Record<string, string> = {
    new_feedback: "Feedback",
    csv_uploaded: "CSV Upload",
    ai_complete: "AI",
    ai_failed: "AI",
    user_joined: "User",
    report_ready: "Report",
    simulated_imported: "Import",
};

const TYPE_COLOR: Record<string, string> = {
    new_feedback: "rgba(6,182,212,0.15)",
    csv_uploaded: "rgba(99,102,241,0.15)",
    ai_complete: "rgba(34,197,94,0.15)",
    ai_failed: "rgba(239,68,68,0.15)",
    user_joined: "rgba(245,158,11,0.15)",
    report_ready: "rgba(124,58,237,0.15)",
    simulated_imported: "rgba(16,185,129,0.15)",
};

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type Filter = "all" | "unread" | "new_feedback" | "csv_uploaded" | "ai_complete" | "ai_failed" | "user_joined";

export default function NotificationsClient({ initialItems, initialUnread }: Props) {
    const router = useRouter();
    const [items, setItems] = useState<NotificationItem[]>(initialItems);
    const [unread, setUnread] = useState(initialUnread);
    const [filter, setFilter] = useState<Filter>("all");
    const [markingAll, setMarkingAll] = useState(false);

    const filtered = items.filter((n) => {
        if (filter === "unread") return !n.read;
        if (filter !== "all") return n.type === filter;
        return true;
    });

    const markOne = useCallback(async (id: string) => {
        await fetch(`/api/notifications/${id}`, { method: "PATCH" });
        setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
        setUnread((u) => Math.max(0, u - 1));
    }, []);

    const deleteOne = useCallback(async (id: string) => {
        const wasUnread = items.find((n) => n.id === id)?.read === false;
        await fetch(`/api/notifications/${id}`, { method: "DELETE" });
        setItems((prev) => prev.filter((n) => n.id !== id));
        if (wasUnread) setUnread((u) => Math.max(0, u - 1));
    }, [items]);

    const markAll = async () => {
        setMarkingAll(true);
        await fetch("/api/notifications", { method: "PATCH" });
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnread(0);
        setMarkingAll(false);
        router.refresh();
    };

    const FILTERS: { key: Filter; label: string }[] = [
        { key: "all", label: `All (${items.length})` },
        { key: "unread", label: `Unread (${unread})` },
        { key: "new_feedback", label: "💬 Feedback" },
        { key: "csv_uploaded", label: "📂 CSV" },
        { key: "ai_complete", label: "🤖 AI" },
        { key: "user_joined", label: "👤 Users" },
    ];

    return (
        <div>
            {/* Stats */}
            <div className="notif-stats">
                <div className="notif-stat">
                    <h5>Total</h5>
                    <h3>{items.length}</h3>
                </div>
                <div className="notif-stat" style={{ borderColor: unread > 0 ? "rgba(6,182,212,0.3)" : undefined }}>
                    <h5>Unread</h5>
                    <h3 style={{ color: unread > 0 ? "#22d3ee" : "#e2e8f0" }}>{unread}</h3>
                </div>
                <div className="notif-stat">
                    <h5>Read</h5>
                    <h3>{items.length - unread}</h3>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="notif-tabs">
                {FILTERS.map((f) => (
                    <button
                        key={f.key}
                        type="button"
                        className={`notif-tab${filter === f.key ? " active" : ""}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="notif-list">
                {filtered.length === 0 ? (
                    <div className="notif-empty">
                        <div className="notif-empty-icon">🔔</div>
                        <h3>No notifications</h3>
                        <p>{filter === "unread" ? "You're all caught up!" : "Nothing here yet."}</p>
                    </div>
                ) : (
                    filtered.map((n) => {
                        const icon = TYPE_ICON[n.type] ?? "🔔";
                        const bg = TYPE_COLOR[n.type] ?? "rgba(255,255,255,0.05)";

                        const inner = (
                            <div
                                key={n.id}
                                className={`notif-item${!n.read ? " unread" : ""}`}
                                onClick={() => !n.read && markOne(n.id)}
                            >
                                <div className="notif-icon" style={{ background: bg }}>{icon}</div>
                                <div className="notif-body">
                                    <div className="notif-title">{n.title}</div>
                                    <div className="notif-message">{n.message}</div>
                                    <div className="notif-time" suppressHydrationWarning>
                                        <span style={{
                                            padding: "2px 8px", borderRadius: "6px", fontSize: "10px",
                                            fontWeight: 600, marginRight: "8px",
                                            background: bg, color: "#94a3b8",
                                        }}>
                                            {TYPE_LABEL[n.type] ?? n.type}
                                        </span>
                                        {timeAgo(n.createdAt)}
                                    </div>
                                </div>
                                <div className="notif-item-actions" onClick={(e) => e.stopPropagation()}>
                                    {!n.read && (
                                        <button
                                            type="button"
                                            className="notif-read-btn"
                                            onClick={() => markOne(n.id)}
                                            title="Mark as read"
                                        >
                                            ✓ Read
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="notif-del-btn"
                                        onClick={() => deleteOne(n.id)}
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );

                        // Wrap in Link if notification has a link
                        return n.link ? (
                            <Link key={n.id} href={n.link} style={{ textDecoration: "none" }}>
                                {inner}
                            </Link>
                        ) : (
                            <div key={n.id}>{inner}</div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
