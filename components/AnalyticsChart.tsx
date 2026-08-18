"use client";

interface SentimentCounts {
    positive: number;
    neutral: number;
    negative: number;
}

interface Props {
    counts: SentimentCounts;
    topTopics: { topic: string; count: number }[];
}

export default function AnalyticsChart({ counts, topTopics }: Props) {
    const total = counts.positive + counts.neutral + counts.negative || 1;
    const positivePct = Math.round((counts.positive / total) * 100);
    const neutralPct = Math.round((counts.neutral / total) * 100);
    const negativePct = Math.round((counts.negative / total) * 100);

    const maxTopicCount = topTopics[0]?.count || 1;

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {/* Sentiment breakdown */}
            <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "18px",
                padding: "24px",
            }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px", color: "#e2e8f0" }}>
                    📊 Feedback by Sentiment
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {[
                        { label: "Positive", pct: positivePct, count: counts.positive, color: "#4ade80" },
                        { label: "Neutral", pct: neutralPct, count: counts.neutral, color: "#fbbf24" },
                        { label: "Negative", pct: negativePct, count: counts.negative, color: "#f87171" },
                    ].map(({ label, pct, count, color }) => (
                        <div key={label}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                <span style={{ fontSize: "13px", color: "#94a3b8" }}>{label}</span>
                                <span style={{ fontSize: "13px", fontWeight: 600, color }}>{count} ({pct}%)</span>
                            </div>
                            <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "20px", overflow: "hidden" }}>
                                <div style={{
                                    height: "100%",
                                    width: `${pct}%`,
                                    background: color,
                                    borderRadius: "20px",
                                    transition: "width 0.6s ease",
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top topics */}
            <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "18px",
                padding: "24px",
            }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px", color: "#e2e8f0" }}>
                    🏷️ Top Topics
                </h3>
                {topTopics.length === 0 ? (
                    <p style={{ color: "#475569", fontSize: "14px" }}>No topics yet. Run AI analysis to extract topics.</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {topTopics.map(({ topic, count }) => (
                            <div key={topic}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                    <span style={{ fontSize: "13px", color: "#94a3b8" }}>{topic}</span>
                                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#22d3ee" }}>{count}</span>
                                </div>
                                <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "20px", overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%",
                                        width: `${Math.round((count / maxTopicCount) * 100)}%`,
                                        background: "linear-gradient(90deg,#06b6d4,#4f46e5)",
                                        borderRadius: "20px",
                                        transition: "width 0.6s ease",
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
