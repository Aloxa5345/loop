"use client";

interface Props {
    recommendations: string[];
}

export default function RecommendationCard({ recommendations }: Props) {
    return (
        <div style={{
            background: "rgba(16,185,129,0.07)",
            border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: "16px",
            padding: "20px 24px",
        }}>
            <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "14px" }}>
                💡 Recommendations
            </p>
            {recommendations.length === 0 ? (
                <p style={{ color: "#475569", fontSize: "14px" }}>No recommendations yet.</p>
            ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                    {recommendations.map((rec, i) => (
                        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                            <span style={{
                                minWidth: "22px",
                                height: "22px",
                                borderRadius: "50%",
                                background: "linear-gradient(135deg,#06b6d4,#10b981)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#fff",
                                marginTop: "1px",
                            }}>
                                {i + 1}
                            </span>
                            <span style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6" }}>{rec}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
