"use client";

import { useEffect, useState } from "react";
import SentimentCard from "./SentimentCard";
import TopicCard from "./TopicCard";
import KeywordCard from "./KeywordCard";
import SummaryCard from "./SummaryCard";
import RecommendationCard from "./RecommendationCard";
import Link from "next/link";

interface FeedbackItem {
    id: string;
    content: string;
    channel: string;
    customerLabel: string;
    status: string;
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
    item: FeedbackItem | null;
    onClose: () => void;
    canEdit: boolean;
    canRunAI: boolean;
    onAnalyze: (id: string) => Promise<void>;
    analyzing: boolean;
}

function parseJsonArr(v: string | null | undefined): string[] {
    if (!v) return [];
    try { return JSON.parse(v) as string[]; } catch { return []; }
}

const STATUS_BADGE: Record<string, { bg: string; color: string; border: string }> = {
    PENDING: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "rgba(245,158,11,0.3)" },
    REVIEWED: { bg: "rgba(6,182,212,0.15)", color: "#22d3ee", border: "rgba(6,182,212,0.3)" },
    ANALYZED: { bg: "rgba(34,197,94,0.15)", color: "#4ade80", border: "rgba(34,197,94,0.3)" },
};

const AI_STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
    Pending: { bg: "rgba(100,116,139,0.15)", color: "#94a3b8", label: "⏳ Pending" },
    Processing: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24", label: "⚙️ Processing" },
    Completed: { bg: "rgba(34,197,94,0.15)", color: "#4ade80", label: "✅ Completed" },
    Failed: { bg: "rgba(239,68,68,0.15)", color: "#f87171", label: "❌ Failed" },
};

export default function FeedbackDrawer({ item, onClose, canEdit, canRunAI, onAnalyze, analyzing }: Props) {
    // Close on Escape
    useEffect(() => {
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (!item) return null;

    const topics = parseJsonArr(item.topics);
    const keywords = parseJsonArr(item.keywords);
    const recs = parseJsonArr(item.recommendations);
    const hasAI = !!(item.sentiment || item.aiSummary || topics.length || keywords.length);
    const statusCfg = STATUS_BADGE[item.status] ?? STATUS_BADGE.PENDING;
    const aiStatusCfg = AI_STATUS_BADGE[item.aiStatus ?? "Pending"] ?? AI_STATUS_BADGE.Pending;

    return (
        <>
            {/* Overlay */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed", inset: 0,
                    background: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(3px)",
                    zIndex: 1500,
                    animation: "fadeIn 0.2s ease",
                }}
                aria-hidden="true"
            />

            {/* Drawer panel */}
            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Feedback detail"
                style={{
                    position: "fixed", top: 0, right: 0, bottom: 0,
                    width: "min(560px, 96vw)",
                    background: "#0c1529",
                    borderLeft: "1px solid rgba(255,255,255,0.1)",
                    zIndex: 1600,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    animation: "slideInRight 0.28s ease",
                }}
            >
                <style>{`
                    @keyframes slideInRight {
                        from { transform: translateX(100%); opacity: 0; }
                        to   { transform: translateX(0);    opacity: 1; }
                    }
                `}</style>

                {/* Header */}
                <div style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    position: "sticky", top: 0,
                    background: "#0c1529", zIndex: 10,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "22px" }}>💬</span>
                        <div>
                            <p style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "16px" }}>{item.customerLabel}</p>
                            <p style={{ fontSize: "12px", color: "#64748b" }}>{item.channel} · {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{
                            padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                            background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`,
                        }}>
                            {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                        </span>
                        <span style={{
                            padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                            background: aiStatusCfg.bg, color: aiStatusCfg.color,
                        }}>
                            {aiStatusCfg.label}
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close drawer"
                            style={{
                                width: "32px", height: "32px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)",
                                background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: "16px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px", flex: 1 }}>

                    {/* Meta row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        {[
                            { label: "Customer", value: item.customerLabel },
                            { label: "Channel", value: item.channel },
                            { label: "Status", value: item.status.charAt(0) + item.status.slice(1).toLowerCase() },
                            { label: "Submitted", value: new Date(item.createdAt).toLocaleDateString() },
                            ...(item.user ? [{ label: "Submitted by", value: item.user.name }] : []),
                        ].map(({ label, value }) => (
                            <div key={label} style={{
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: "10px", padding: "12px 14px",
                            }}>
                                <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{label}</p>
                                <p style={{ fontSize: "14px", color: "#e2e8f0", fontWeight: 500 }}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Content */}
                    <div style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "14px", padding: "18px 20px",
                    }}>
                        <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
                            💬 Feedback
                        </p>
                        <p style={{ color: "#cbd5e1", fontSize: "15px", lineHeight: 1.7 }}>{item.content}</p>
                    </div>

                    {/* AI Section */}
                    {hasAI && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {/* AI Classification summary strip */}
                            {(item.featureArea || item.sentimentScore != null) && (
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                                    gap: "10px",
                                }}>
                                    {topics[0] && (
                                        <div style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "10px", padding: "10px 12px" }}>
                                            <p style={{ fontSize: "10px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Theme</p>
                                            <p style={{ fontSize: "13px", fontWeight: 700, color: "#22d3ee" }}>{topics[0]}</p>
                                        </div>
                                    )}
                                    {item.featureArea && (
                                        <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "10px", padding: "10px 12px" }}>
                                            <p style={{ fontSize: "10px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Feature Area</p>
                                            <p style={{ fontSize: "13px", fontWeight: 700, color: "#c4b5fd" }}>{item.featureArea}</p>
                                        </div>
                                    )}
                                    {item.sentimentScore != null && (
                                        <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "10px", padding: "10px 12px" }}>
                                            <p style={{ fontSize: "10px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Confidence</p>
                                            <p style={{ fontSize: "13px", fontWeight: 700, color: "#4ade80" }}>{Math.round(item.sentimentScore * 100)}%</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            <SentimentCard sentiment={item.sentiment ?? null} />
                            {topics.length > 0 && <TopicCard topics={topics} />}
                            {keywords.length > 0 && <KeywordCard keywords={keywords} />}
                            {item.aiSummary && <SummaryCard summary={item.aiSummary} />}
                            {recs.length > 0 && <RecommendationCard recommendations={recs} />}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "auto", paddingTop: "8px" }}>
                        {canRunAI && (
                            <button
                                type="button"
                                onClick={() => onAnalyze(item.id)}
                                disabled={analyzing}
                                style={{
                                    padding: "11px 20px", border: "1px solid rgba(124,58,237,0.4)",
                                    borderRadius: "10px", background: "rgba(124,58,237,0.15)",
                                    color: "#c4b5fd", fontSize: "14px", fontWeight: 600,
                                    cursor: analyzing ? "not-allowed" : "pointer",
                                    opacity: analyzing ? 0.6 : 1,
                                }}
                            >
                                {analyzing ? "⏳ Analyzing…" : "🤖 Run AI Analysis"}
                            </button>
                        )}
                        {canEdit && (
                            <Link
                                href={`/feedback/${item.id}/edit`}
                                style={{
                                    padding: "11px 20px", border: "1px solid rgba(79,70,229,0.4)",
                                    borderRadius: "10px", background: "rgba(79,70,229,0.15)",
                                    color: "#a5b4fc", fontSize: "14px", fontWeight: 600,
                                    textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px",
                                }}
                            >
                                ✏️ Edit
                            </Link>
                        )}
                        <Link
                            href={`/feedback/${item.id}`}
                            style={{
                                padding: "11px 20px", border: "1px solid rgba(255,255,255,0.12)",
                                borderRadius: "10px", background: "transparent",
                                color: "#94a3b8", fontSize: "14px", fontWeight: 500,
                                textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px",
                            }}
                        >
                            🔗 Full Page
                        </Link>
                    </div>
                </div>
            </aside>
        </>
    );
}
