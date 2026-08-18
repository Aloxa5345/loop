"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DeleteDialog from "./DeleteDialog";
import SentimentCard from "./SentimentCard";
import TopicCard from "./TopicCard";
import KeywordCard from "./KeywordCard";
import SummaryCard from "./SummaryCard";
import RecommendationCard from "./RecommendationCard";

interface FeedbackItem {
    id: string;
    content: string;
    channel: string;
    customerLabel: string;
    status: "PENDING" | "REVIEWED" | "ANALYZED";
    sentiment?: string | null;
    topics?: string | null;
    keywords?: string | null;
    aiSummary?: string | null;
    recommendations?: string | null;
    createdAt: string;
    user?: { name: string };
}

interface AiResult {
    sentiment: string;
    topics: string[];
    keywords: string[];
    summary: string;
    recommendations: string[];
}

interface Props {
    items: FeedbackItem[];
    canEdit: boolean;
    canDelete: boolean;
    canRunAI: boolean;
}

const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pending",
    REVIEWED: "Reviewed",
    ANALYZED: "Analyzed",
};

const STATUS_CLASS: Record<string, string> = {
    PENDING: "fb-badge fb-badge-pending",
    REVIEWED: "fb-badge fb-badge-reviewed",
    ANALYZED: "fb-badge fb-badge-analyzed",
};

function parseJson<T>(val: string | null | undefined, fallback: T): T {
    if (!val) return fallback;
    try { return JSON.parse(val) as T; } catch { return fallback; }
}

function SentimentPill({ sentiment }: { sentiment: string }) {
    const isPos = sentiment === "Positive";
    const isNeg = sentiment === "Negative";
    return (
        <span style={{
            padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
            background: isPos ? "rgba(34,197,94,0.15)" : isNeg ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
            color: isPos ? "#4ade80" : isNeg ? "#f87171" : "#fbbf24",
            border: `1px solid ${isPos ? "rgba(34,197,94,0.3)" : isNeg ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`,
        }}>
            {isPos ? "😊 " : isNeg ? "😞 " : "😐 "}{sentiment}
        </span>
    );
}

export default function FeedbackTable({ items, canEdit, canDelete, canRunAI }: Props) {
    const router = useRouter();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [aiResults, setAiResults] = useState<Record<string, AiResult>>({});
    const [analyzeError, setAnalyzeError] = useState<string | null>(null);

    async function handleDelete() {
        if (!deleteId) return;
        setDeleting(true);
        await fetch(`/api/feedback/${deleteId}`, { method: "DELETE" });
        setDeleting(false);
        setDeleteId(null);
        router.refresh();
    }

    async function handleAnalyze(id: string) {
        setAnalyzingId(id);
        setAnalyzeError(null);
        try {
            const res = await fetch("/api/ai/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feedbackId: id }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setAnalyzeError(data.error ?? "Analysis failed.");
            } else {
                setAiResults((prev) => ({
                    ...prev,
                    [id]: {
                        sentiment: data.sentiment,
                        topics: data.topics,
                        keywords: data.keywords,
                        summary: data.summary,
                        recommendations: data.recommendations,
                    },
                }));
                setExpandedId(id);
                router.refresh();
            }
        } catch {
            setAnalyzeError("Network error. Please try again.");
        } finally {
            setAnalyzingId(null);
        }
    }

    function toggleExpand(id: string) {
        setExpandedId((prev) => (prev === id ? null : id));
    }

    if (items.length === 0) {
        return (
            <div className="fb-empty">
                <div className="fb-empty-icon">💬</div>
                <h3>No feedback found</h3>
                <p>Try adjusting your search or filters, or add new feedback.</p>
            </div>
        );
    }

    const showActions = canEdit || canDelete || canRunAI;

    return (
        <>
            {analyzeError && (
                <div role="alert" style={{
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "12px", padding: "12px 16px", color: "#fca5a5",
                    fontSize: "14px", marginBottom: "16px",
                }}>
                    ⚠️ {analyzeError}
                </div>
            )}

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
                            {showActions && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => {
                            const ai = aiResults[item.id];
                            const sentiment = ai?.sentiment ?? item.sentiment;
                            const topics = ai?.topics ?? parseJson<string[]>(item.topics, []);
                            const keywords = ai?.keywords ?? parseJson<string[]>(item.keywords, []);
                            const summary = ai?.summary ?? item.aiSummary;
                            const recs = ai?.recommendations ?? parseJson<string[]>(item.recommendations, []);
                            const hasResults = !!(summary || topics.length > 0 || keywords.length > 0);
                            const isExpanded = expandedId === item.id;
                            const isAnalyzing = analyzingId === item.id;

                            return (
                                <Fragment key={item.id}>
                                    <tr>
                                        <td>{item.customerLabel}</td>
                                        <td>{item.channel}</td>
                                        <td className="fb-content-cell" title={item.content}>
                                            {item.content}
                                        </td>
                                        <td>
                                            {sentiment
                                                ? <SentimentPill sentiment={sentiment} />
                                                : <span style={{ color: "#475569", fontSize: "13px" }}>—</span>
                                            }
                                        </td>
                                        <td>
                                            <span className={STATUS_CLASS[item.status] ?? "fb-badge"}>
                                                {STATUS_LABELS[item.status] ?? item.status}
                                            </span>
                                        </td>
                                        <td>
                                            {new Date(item.createdAt).toLocaleDateString("en-US", {
                                                month: "short", day: "numeric", year: "numeric",
                                            })}
                                        </td>
                                        {showActions && (
                                            <td>
                                                <div className="fb-action-group" style={{ flexWrap: "wrap" }}>
                                                    {canRunAI && (
                                                        <button
                                                            className="fb-btn-edit"
                                                            style={{ background: "rgba(124,58,237,0.15)", color: "#c4b5fd", borderColor: "rgba(124,58,237,0.3)" }}
                                                            onClick={() => handleAnalyze(item.id)}
                                                            disabled={isAnalyzing}
                                                        >
                                                            {isAnalyzing ? "⏳ Analyzing…" : "🤖 Analyze"}
                                                        </button>
                                                    )}
                                                    {hasResults && (
                                                        <button
                                                            className="fb-btn-edit"
                                                            onClick={() => toggleExpand(item.id)}
                                                        >
                                                            {isExpanded ? "▲ Hide" : "▼ Results"}
                                                        </button>
                                                    )}
                                                    {canEdit && (
                                                        <Link href={`/feedback/${item.id}/edit`} className="fb-btn-edit">
                                                            ✏️ Edit
                                                        </Link>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            className="fb-btn-delete"
                                                            onClick={() => setDeleteId(item.id)}
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>

                                    {/* Expandable AI results row — 3-col grid */}
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={showActions ? 7 : 6} style={{ padding: "0 20px 24px" }}>
                                                <div style={{
                                                    display: "grid",
                                                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                                                    gap: "12px",
                                                    paddingTop: "16px",
                                                }}>
                                                    <SentimentCard sentiment={sentiment ?? null} />
                                                    <TopicCard topics={topics} />
                                                    <KeywordCard keywords={keywords} />
                                                    <SummaryCard summary={summary ?? null} />
                                                    <RecommendationCard recommendations={recs} />
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {deleteId && (
                <DeleteDialog
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteId(null)}
                    loading={deleting}
                />
            )}
        </>
    );
}
