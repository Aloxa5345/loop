"use client";

import { useState, useEffect, useCallback } from "react";
import FeedbackDrawer from "@/components/FeedbackDrawer";
import DeleteDialog from "@/components/DeleteDialog";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";

interface FeedbackItem {
    id: string;
    content: string;
    channel: string;
    customerLabel: string;
    status: "PENDING" | "REVIEWED" | "ANALYZED";
    sentiment?: string | null;
    sentimentScore?: number | null;
    topics?: string | null;
    keywords?: string | null;
    aiSummary?: string | null;
    recommendations?: string | null;
    featureArea?: string | null;
    aiStatus?: string | null;
    createdAt: string;
    user?: { name: string; email?: string } | null;
}

interface Props {
    canEdit: boolean;
    canDelete: boolean;
    canRunAI: boolean;
}

const CHANNELS = [
    "Email", "WhatsApp", "Telegram", "Facebook", "Instagram",
    "X / Twitter", "LinkedIn", "Phone Call", "Support Ticket", "Live Chat",
    "Chatbot", "App Store Review", "Google Play Review", "Survey",
    "Website Form", "Sales Notes", "Other",
];

const STATUS_BADGE: Record<string, string> = {
    PENDING: "fb-badge fb-badge-pending",
    REVIEWED: "fb-badge fb-badge-reviewed",
    ANALYZED: "fb-badge fb-badge-analyzed",
};
const STATUS_LABEL: Record<string, string> = {
    PENDING: "Pending", REVIEWED: "Reviewed", ANALYZED: "Analyzed",
};

function SentimentPill({ sentiment }: { sentiment?: string | null }) {
    if (!sentiment) return <span style={{ color: "#475569", fontSize: "12px" }}>—</span>;
    const isPos = sentiment === "Positive";
    const isNeg = sentiment === "Negative";
    return (
        <span style={{
            padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
            background: isPos ? "rgba(34,197,94,0.15)" : isNeg ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
            color: isPos ? "#4ade80" : isNeg ? "#f87171" : "#fbbf24",
            border: `1px solid ${isPos ? "rgba(34,197,94,0.3)" : isNeg ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`,
        }}>
            {isPos ? "😊 " : isNeg ? "😞 " : "😐 "}{sentiment}
        </span>
    );
}

function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function FeedbackListClient({ canEdit, canDelete, canRunAI }: Props) {
    const router = useRouter();

    // Real-time refresh — re-fetch when workspace events arrive
    useRealtimeRefresh({ onEvent: () => fetchFeedback() });

    // Data state
    const [items, setItems] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);

    // Filter state
    const [q, setQ] = useState("");
    const [channel, setChannel] = useState("");
    const [sentiment, setSentiment] = useState("");
    const [status, setStatus] = useState("");
    const [date, setDate] = useState("");
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);

    // UI state
    const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);

    const fetchFeedback = useCallback(async () => {
        setLoading(true);
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        if (channel) p.set("channel", channel);
        if (sentiment) p.set("sentiment", sentiment);
        if (status) p.set("status", status);
        if (date) p.set("date", date);
        p.set("sort", sort);
        p.set("page", String(page));
        p.set("limit", "25");

        const res = await fetch(`/api/feedback?${p.toString()}`);
        if (res.ok) {
            const data = await res.json().catch(() => ({}));
            setItems(Array.isArray(data.items) ? data.items : []);
            setTotal(data.total ?? 0);
            setPages(data.pages ?? 1);
            // Update drawer item if open
            if (selectedItem && Array.isArray(data.items)) {
                const updated = data.items.find((i: FeedbackItem) => i.id === selectedItem.id);
                if (updated) setSelectedItem(updated);
            }
        } else {
            setItems([]);
            setTotal(0);
            setPages(1);
        }
        setLoading(false);
    }, [q, channel, sentiment, status, date, sort, page]); // eslint-disable-line react-hooks/exhaustive-deps

    // Reset page when filters change
    useEffect(() => { setPage(1); }, [q, channel, sentiment, status, date, sort]);
    useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

    async function handleDelete() {
        if (!deleteId) return;
        setDeleting(true);
        await fetch(`/api/feedback/${deleteId}`, { method: "DELETE" });
        setDeleting(false);
        setDeleteId(null);
        if (selectedItem?.id === deleteId) setSelectedItem(null);
        fetchFeedback();
    }

    async function handleAnalyze(id: string) {
        setAnalyzingId(id);
        const res = await fetch("/api/ai/classify", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ feedbackId: id }),
        });
        setAnalyzingId(null);
        if (res.ok) {
            // Classification runs in the background (202 Accepted).
            // Poll the list once after a short delay so the UI reflects the
            // Processing → Completed transition without blocking the user.
            setTimeout(() => fetchFeedback(), 4000);
        }
        fetchFeedback();
    }

    const filterBtnStyle = (active: boolean) => ({
        padding: "7px 13px", borderRadius: "8px", border: "1px solid",
        fontSize: "12px", fontWeight: 500, cursor: "pointer", transition: "0.2s",
        borderColor: active ? "#06b6d4" : "rgba(255,255,255,0.1)",
        background: active ? "rgba(6,182,212,0.15)" : "transparent",
        color: active ? "#22d3ee" : "#94a3b8",
    });

    const startItem = total === 0 ? 0 : (page - 1) * 25 + 1;
    const endItem = Math.min(page * 25, total);

    return (
        <div style={{ position: "relative" }}>

            {/* ── Search bar ── */}
            <div style={{ position: "relative", marginBottom: "16px" }}>
                <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "16px", pointerEvents: "none" }}>
                    🔍
                </span>
                <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by customer, content, topic, keyword…"
                    aria-label="Search feedback"
                    style={{
                        width: "100%", padding: "13px 16px 13px 44px",
                        border: "1px solid rgba(255,255,255,0.12)", outline: "none",
                        borderRadius: "14px", background: "rgba(255,255,255,0.05)",
                        color: "#fff", fontSize: "14px", transition: "0.3s",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#06b6d4"; e.target.style.background = "rgba(6,182,212,0.06)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.background = "rgba(255,255,255,0.05)"; }}
                />
            </div>

            {/* ── Filter rows ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>

                {/* Channel */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", width: "70px", flexShrink: 0 }}>Channel</span>
                    <button type="button" style={filterBtnStyle(!channel)} onClick={() => setChannel("")}>All</button>
                    {CHANNELS.map((c) => (
                        <button key={c} type="button" style={filterBtnStyle(channel === c)} onClick={() => setChannel(channel === c ? "" : c)}>{c}</button>
                    ))}
                </div>

                {/* Sentiment */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", width: "70px", flexShrink: 0 }}>Sentiment</span>
                    {["", "Positive", "Neutral", "Negative"].map((s) => (
                        <button key={s} type="button" style={filterBtnStyle(sentiment === s)} onClick={() => setSentiment(s)}>
                            {!s ? "All" : s === "Positive" ? "😊 Positive" : s === "Negative" ? "😞 Negative" : "😐 Neutral"}
                        </button>
                    ))}
                </div>

                {/* Status */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", width: "70px", flexShrink: 0 }}>Status</span>
                    {[["", "All"], ["PENDING", "Pending"], ["REVIEWED", "Reviewed"], ["ANALYZED", "Analyzed"]].map(([v, l]) => (
                        <button key={v} type="button" style={filterBtnStyle(status === v)} onClick={() => setStatus(v)}>{l}</button>
                    ))}
                </div>

                {/* Date + Sort */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", width: "70px", flexShrink: 0 }}>Date</span>
                    {[["", "All"], ["today", "Today"], ["yesterday", "Yesterday"], ["7d", "7 Days"], ["30d", "30 Days"], ["90d", "90 Days"]].map(([v, l]) => (
                        <button key={v} type="button" style={filterBtnStyle(date === v)} onClick={() => setDate(v)}>{l}</button>
                    ))}
                    <span style={{ marginLeft: "8px", fontSize: "11px", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sort</span>
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        style={{
                            padding: "7px 10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
                            background: "rgba(255,255,255,0.05)", color: "#94a3b8", fontSize: "12px", outline: "none",
                        }}
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="positive">Positive First</option>
                        <option value="negative">Negative First</option>
                        <option value="az">A–Z</option>
                        <option value="za">Z–A</option>
                    </select>
                </div>
            </div>

            {/* ── Results count ── */}
            {!loading && (
                <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "12px" }}>
                    {total === 0 ? "No results" : `Showing ${startItem}–${endItem} of ${total.toLocaleString()} feedback`}
                </p>
            )}

            {/* ── Table ── */}
            {loading ? (
                <div>{[...Array(6)].map((_, i) => <div key={i} className="fb-skeleton-row" />)}</div>
            ) : items.length === 0 ? (
                <div className="fb-empty">
                    <div className="fb-empty-icon">📥</div>
                    <h3>No feedback found</h3>
                    <p>Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="fb-table-wrap">
                    <table className="fb-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Channel</th>
                                <th>Content</th>
                                <th>Sentiment</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={() => setSelectedItem(item)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <td style={{ fontWeight: 600, color: "#e2e8f0" }}>{item.customerLabel}</td>
                                    <td>
                                        <span style={{
                                            padding: "3px 9px", borderRadius: "8px", fontSize: "11px", fontWeight: 500,
                                            background: "rgba(79,70,229,0.15)", color: "#a5b4fc",
                                            border: "1px solid rgba(79,70,229,0.25)",
                                        }}>
                                            {item.channel}
                                        </span>
                                    </td>
                                    <td className="fb-content-cell" title={item.content}>{item.content}</td>
                                    <td>
                                        <SentimentPill sentiment={item.sentiment} />
                                        {item.aiStatus && item.aiStatus !== "Completed" && (
                                            <div style={{ marginTop: "4px" }}>
                                                <span style={{
                                                    fontSize: "10px", fontWeight: 600, padding: "2px 7px",
                                                    borderRadius: "6px",
                                                    background: item.aiStatus === "Failed" ? "rgba(239,68,68,0.15)"
                                                        : item.aiStatus === "Processing" ? "rgba(245,158,11,0.15)"
                                                            : "rgba(100,116,139,0.15)",
                                                    color: item.aiStatus === "Failed" ? "#f87171"
                                                        : item.aiStatus === "Processing" ? "#fbbf24"
                                                            : "#94a3b8",
                                                }}>
                                                    {item.aiStatus === "Failed" ? "❌ Failed" : item.aiStatus === "Processing" ? "⚙️ Processing" : "⏳ Pending"}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span className={STATUS_BADGE[item.status] ?? "fb-badge"}>
                                            {STATUS_LABEL[item.status] ?? item.status}
                                        </span>
                                    </td>
                                    <td style={{ color: "#64748b", fontSize: "12px" }}>{formatDate(item.createdAt)}</td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <div className="fb-action-group">
                                            {canRunAI && (
                                                <button
                                                    className="fb-btn-edit"
                                                    style={{ background: "rgba(124,58,237,0.15)", color: "#c4b5fd", borderColor: "rgba(124,58,237,0.3)", fontSize: "12px", padding: "5px 10px" }}
                                                    onClick={() => handleAnalyze(item.id)}
                                                    disabled={analyzingId === item.id}
                                                >
                                                    {analyzingId === item.id ? "⏳" : "🤖"}
                                                </button>
                                            )}
                                            {canEdit && (
                                                <Link href={`/feedback/${item.id}/edit`} className="fb-btn-edit" style={{ fontSize: "12px", padding: "5px 10px" }}>
                                                    ✏️
                                                </Link>
                                            )}
                                            {canDelete && (
                                                <button className="fb-btn-delete" style={{ fontSize: "12px", padding: "5px 10px" }} onClick={() => setDeleteId(item.id)}>
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Pagination ── */}
            {!loading && pages > 1 && (
                <div className="fb-pagination" role="navigation" aria-label="Feedback pagination">
                    <button className="fb-page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>← Prev</button>
                    {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                        // Show pages around current
                        let p: number;
                        if (pages <= 7) { p = i + 1; }
                        else if (page <= 4) { p = i + 1; }
                        else if (page >= pages - 3) { p = pages - 6 + i; }
                        else { p = page - 3 + i; }
                        return (
                            <button
                                key={p}
                                className={`fb-page-btn${p === page ? " active" : ""}`}
                                onClick={() => setPage(p)}
                                aria-current={p === page ? "page" : undefined}
                            >
                                {p}
                            </button>
                        );
                    })}
                    <button className="fb-page-btn" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}>Next →</button>
                </div>
            )}

            {/* ── Drawer ── */}
            <FeedbackDrawer
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
                canEdit={canEdit}
                canRunAI={canRunAI}
                onAnalyze={handleAnalyze}
                analyzing={analyzingId === selectedItem?.id}
            />

            {/* ── Delete confirm ── */}
            {deleteId && (
                <DeleteDialog
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteId(null)}
                    loading={deleting}
                />
            )}
        </div>
    );
}
