"use client";

interface Props {
    topics: string[];
}

const TAG_COLORS = [
    { bg: "rgba(6,182,212,0.15)", color: "#22d3ee", border: "rgba(6,182,212,0.3)" },
    { bg: "rgba(79,70,229,0.15)", color: "#a5b4fc", border: "rgba(79,70,229,0.3)" },
    { bg: "rgba(124,58,237,0.15)", color: "#c4b5fd", border: "rgba(124,58,237,0.3)" },
    { bg: "rgba(16,185,129,0.15)", color: "#6ee7b7", border: "rgba(16,185,129,0.3)" },
    { bg: "rgba(245,158,11,0.15)", color: "#fcd34d", border: "rgba(245,158,11,0.3)" },
    { bg: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "rgba(239,68,68,0.3)" },
];

export default function TopicCard({ topics }: Props) {
    return (
        <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            padding: "20px 24px",
        }}>
            <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "14px" }}>
                🏷️ Topics
            </p>
            {topics.length === 0 ? (
                <p style={{ color: "#475569", fontSize: "14px" }}>No topics extracted yet.</p>
            ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {topics.map((t, i) => {
                        const c = TAG_COLORS[i % TAG_COLORS.length];
                        return (
                            <span
                                key={t}
                                style={{
                                    background: c.bg,
                                    color: c.color,
                                    border: `1px solid ${c.border}`,
                                    borderRadius: "20px",
                                    padding: "5px 14px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                }}
                            >
                                {t}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
