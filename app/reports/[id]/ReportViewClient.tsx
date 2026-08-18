"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
    reportId: string;
    canDelete: boolean;
    canExport: boolean;
    canShare: boolean;
    initialShareToken?: string | null;
}

export default function ReportViewClient({
    reportId,
    canDelete,
    canExport,
    canShare,
    initialShareToken,
}: Props) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [shareToken, setShareToken] = useState<string | null>(initialShareToken ?? null);
    const [shareLoading, setShareLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    async function handleToggleShare() {
        setShareLoading(true);
        try {
            if (shareToken) {
                // Disable sharing
                await fetch(`/api/reports/${reportId}/share`, { method: "DELETE" });
                setShareToken(null);
            } else {
                // Enable sharing
                const res = await fetch(`/api/reports/${reportId}/share`, { method: "POST" });
                const data = await res.json().catch(() => ({}));
                if (res.ok) setShareToken(data.shareToken);
            }
        } finally {
            setShareLoading(false);
        }
    }

    async function handleCopyLink() {
        if (!shareToken) return;
        const url = `${window.location.origin}/reports/share/${shareToken}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    }

    async function handleDelete() {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        setDeleting(true);
        const res = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
        if (res.ok) router.push("/reports");
        else setDeleting(false);
    }

    return (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            {canExport && (
                <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                        padding: "10px 20px", border: "1px solid rgba(239,68,68,.3)",
                        borderRadius: "10px", background: "rgba(239,68,68,.1)",
                        color: "#fca5a5", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                    }}
                >
                    📄 Export PDF
                </button>
            )}

            {canShare && (
                <>
                    <button
                        type="button"
                        onClick={handleToggleShare}
                        disabled={shareLoading}
                        style={{
                            padding: "10px 20px",
                            border: shareToken ? "1px solid rgba(74,222,128,.3)" : "1px solid rgba(6,182,212,.25)",
                            borderRadius: "10px",
                            background: shareToken ? "rgba(74,222,128,.1)" : "rgba(6,182,212,.07)",
                            color: shareToken ? "#4ade80" : "#22d3ee",
                            fontSize: "13px", fontWeight: 600, cursor: "pointer",
                        }}
                    >
                        {shareLoading ? "…" : shareToken ? "🔗 Sharing On" : "🔗 Share"}
                    </button>

                    {shareToken && (
                        <button
                            type="button"
                            onClick={handleCopyLink}
                            style={{
                                padding: "10px 20px", border: "1px solid rgba(255,255,255,.1)",
                                borderRadius: "10px", background: "rgba(255,255,255,.04)",
                                color: copied ? "#4ade80" : "#94a3b8",
                                fontSize: "13px", cursor: "pointer",
                            }}
                        >
                            {copied ? "✓ Copied!" : "📋 Copy Link"}
                        </button>
                    )}
                </>
            )}

            <button
                type="button"
                onClick={() => router.push("/reports")}
                style={{
                    padding: "10px 20px", border: "1px solid rgba(255,255,255,.1)",
                    borderRadius: "10px", background: "transparent",
                    color: "#64748b", fontSize: "13px", cursor: "pointer",
                }}
            >
                ← All Reports
            </button>

            {canDelete && (
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                        padding: "10px 20px",
                        border: `1px solid ${confirmDelete ? "rgba(239,68,68,.6)" : "rgba(239,68,68,.2)"}`,
                        borderRadius: "10px",
                        background: confirmDelete ? "rgba(239,68,68,.2)" : "transparent",
                        color: "#f87171", fontSize: "13px", cursor: "pointer",
                        transition: ".15s",
                    }}
                >
                    {deleting ? "Deleting…" : confirmDelete ? "⚠️ Confirm Delete" : "🗑️ Delete"}
                </button>
            )}
        </div>
    );
}
