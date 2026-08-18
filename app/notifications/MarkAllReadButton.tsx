"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MarkAllReadButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleClick() {
        setLoading(true);
        await fetch("/api/notifications", { method: "PATCH" });
        setLoading(false);
        router.refresh();
    }

    return (
        <button
            type="button"
            className="notif-mark-all-btn"
            onClick={handleClick}
            disabled={loading}
        >
            {loading ? "Marking…" : "✓ Mark All Read"}
        </button>
    );
}
