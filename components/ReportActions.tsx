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

export default function ReportActions({
    reportId,
    canDelete,
    canExport,
    canShare,
    initialShareToken,
}: Props) {
    const router = useRouter();
    const [shareToken, setShareToken] = useState<string | null>(initialShareToken ?? null);
    const [shareLoading, setShareLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    async function toggleShare() {
        setShareLoading(true);
        try {
            if (shareToken) {
                await fetch(`/api/reports/${reportId}/share`, { method: "DELETE" });
                setShareToken(null);
            } else {
                const res = await fetch(`/api/reports/${reportId}/share`, { method: "POST" });
                const data = await res.json().catch(() => ({}));
                if (res.ok) setShareToken(data.shareToken);
            }
        } finally {
            setShareLoading(false);
        }
    }

    async function copyLink() {
        if (!shareToken) return;
        await navigator.clipboard.writeText(`${window.location.origin}/reports/share/${shareToken}`);
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

    const btn = (
        label: string,
        onClick: () => void,
        opts: { color?: string; bg?: string; border?: string; disabled?: boolean } = {},
    ) => (
        <button
            type="button"
            onClick={onClick}
            disabled={opts.disabled}
            style={{
                padding: "10px 18px",
                border: `1px solid ${opts.border ?? "rgba(255,255,255,.12)"}`,
                borderRadius: "10px",
                background: opts.bg ?? "transparent",
                color: opts.color ?? "#94a3b8",
                fontSize: "13px",
                fontWeight: 600,
                cursor: opts.disabled ? "not-allowed" : "pointer",
                opacity: opts.disabled ? 0.5 : 1,
                transition: ".15s",
                whiteSpace: "nowrap",
            }}
        >
            {label}
        </button>
    );

    return (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Save / back */}
            {btn("← All Reports", () => router.push("/reports"))}

            {/* PDF */}
            {canExport && btn("📄 Save PDF", () => window.print(), {
                color: "#fca5a5", border: "rgba(239,68,68,.3)", bg: "rgba(239,68,68,.08)",
            })}

            {/* Share toggle */}
            {canShare && btn(
                shareLoading ? "…" : shareToken ? "🔗 Sharing On" : "🔗 Share",
                toggleShare,
                {
                    color: shareToken ? "#4ade80" : "#22d3ee",
                    border: shareToken ? "rgba(74,222,128,.3)" : "rgba(6,182,212,.25)",
                    bg: shareToken ? "rgba(74,222,128,.08)" : "rgba(6,182,212,.06)",
                    disabled: shareLoading,
                },
            )}

            {/* Copy link (only when sharing is on) */}
            {canShare && shareToken && btn(
                copied ? "✓ Copied!" : "📋 Copy Link",
                copyLink,
                { color: copied ? "#4ade80" : "#94a3b8" },
            )}

            {/* Delete */}
            {canDelete && btn(
                deleting ? "Deleting…" : confirmDelete ? "⚠️ Confirm Delete" : "🗑️ Delete",
                handleDelete,
                {
                    color: "#f87171",
                    border: confirmDelete ? "rgba(239,68,68,.6)" : "rgba(239,68,68,.2)",
                    bg: confirmDelete ? "rgba(239,68,68,.15)" : "transparent",
                    disabled: deleting,
                },
            )}
        </div>
    );
}
