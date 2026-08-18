"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetFailedButton({ count }: { count: number }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    if (count === 0 || done) return null;

    async function handleReset() {
        setLoading(true);
        await fetch("/api/ai/reset-failed", { method: "POST" });
        setLoading(false);
        setDone(true);
        router.refresh();
    }

    return (
        <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            title={`${count} items failed AI analysis — click to reset to Pending`}
            style={{
                padding: "9px 16px", border: "1px solid rgba(245,158,11,.3)",
                borderRadius: "10px", background: "rgba(245,158,11,.08)",
                color: "#fbbf24", fontSize: "12px", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap",
            }}
        >
            {loading ? "⏳ Resetting…" : `⚠️ Reset ${count} Failed`}
        </button>
    );
}
