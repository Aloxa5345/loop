"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NotificationBell() {
    const pathname = usePathname();
    const [unread, setUnread] = useState(0);

    const fetch_count = async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setUnread(data.unread ?? 0);
            }
        } catch { /* ignore */ }
    };

    // Fetch on mount and whenever the route changes (user navigates back)
    useEffect(() => {
        fetch_count();
    }, [pathname]);

    // Also poll every 30 seconds for new notifications
    useEffect(() => {
        const interval = setInterval(fetch_count, 30000);
        return () => clearInterval(interval);
    }, []);

    const active = pathname === "/notifications";

    return (
        <Link
            href="/notifications"
            className={active ? "active" : ""}
            style={{ position: "relative", display: "flex", alignItems: "center", gap: "8px" }}
        >
            🔔 Notifications
            {unread > 0 && (
                <span style={{
                    background: "linear-gradient(90deg,#ef4444,#dc2626)",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 700,
                    borderRadius: "20px",
                    padding: "1px 7px",
                    minWidth: "18px",
                    textAlign: "center",
                    lineHeight: "16px",
                    display: "inline-block",
                }}>
                    {unread > 99 ? "99+" : unread}
                </span>
            )}
        </Link>
    );
}
