"use client";

interface Props {
    keywords: string[];
}

export default function KeywordCard({ keywords }: Props) {
    return (
        <div style={{
            background: "rgba(6,182,212,0.06)",
            border: "1px solid rgba(6,182,212,0.2)",
            borderRadius: "16px",
            padding: "20px 24px",
        }}>
            <p style={{
                fontSize: "12px", color: "#64748b", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "14px",
            }}>
                🔑 Keywords
            </p>
            {keywords.length === 0 ? (
                <p style={{ color: "#475569", fontSize: "14px" }}>No keywords extracted yet.</p>
            ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {keywords.map((kw) => (
                        <span
                            key={kw}
                            style={{
                                background: "rgba(6,182,212,0.12)",
                                color: "#22d3ee",
                                border: "1px solid rgba(6,182,212,0.25)",
                                borderRadius: "8px",
                                padding: "4px 12px",
                                fontSize: "13px",
                                fontWeight: 500,
                                fontFamily: "monospace",
                            }}
                        >
                            {kw}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
