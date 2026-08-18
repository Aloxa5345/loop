"use client";

import Link from "next/link";

interface Props {
    id: string;
    content: string;
    channel: string;
    customerLabel: string;
    status: "PENDING" | "REVIEWED" | "ANALYZED";
    createdAt: string;
    canEdit?: boolean;
    canDelete?: boolean;
    onDelete?: (id: string) => void;
}

const STATUS_CLASS: Record<string, string> = {
    PENDING: "fb-badge fb-badge-pending",
    REVIEWED: "fb-badge fb-badge-reviewed",
    ANALYZED: "fb-badge fb-badge-analyzed",
};

const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pending",
    REVIEWED: "Reviewed",
    ANALYZED: "Analyzed",
};

export default function FeedbackCard({
    id, content, channel, customerLabel, status, createdAt,
    canEdit = false, canDelete = false, onDelete,
}: Props) {
    const date = new Date(createdAt).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
    });

    return (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <span style={{
                    background: "rgba(6,182,212,0.15)",
                    color: "#22d3ee",
                    border: "1px solid rgba(6,182,212,0.25)",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                }}>
                    {channel}
                </span>
                <span className={STATUS_CLASS[status] ?? "fb-badge"} style={{ fontSize: "12px" }}>
                    {STATUS_LABELS[status] ?? status}
                </span>
            </div>

            <div>
                <p style={{ fontWeight: 600, color: "#e2e8f0", fontSize: "15px", marginBottom: "4px" }}>
                    {customerLabel}
                </p>
                <p style={{
                    color: "#94a3b8",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                }}>
                    {content}
                </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ color: "#64748b", fontSize: "12px" }}>{date}</span>
                <div className="fb-action-group">
                    {canEdit && (
                        <Link href={`/feedback/${id}/edit`} className="fb-btn-edit" style={{ fontSize: "12px", padding: "5px 12px" }}>
                            ✏️ Edit
                        </Link>
                    )}
                    {canDelete && onDelete && (
                        <button
                            className="fb-btn-delete"
                            style={{ fontSize: "12px", padding: "5px 12px" }}
                            onClick={() => onDelete(id)}
                        >
                            🗑️ Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
