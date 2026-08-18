"use client";

interface Insight {
    label: string;
    value: string;
    sub?: string;
    accent?: "green" | "red" | "orange" | "cyan" | "purple";
}

interface Props {
    insights: Insight[];
}

const ACCENT_COLORS: Record<string, string> = {
    green: "#4ade80",
    red: "#f87171",
    orange: "#fbbf24",
    cyan: "#22d3ee",
    purple: "#c4b5fd",
};

export default function AIInsightCard({ insights }: Props) {
    return (
        <div style={{
            background: "linear-gradient(135deg,rgba(37,99,235,0.12),rgba(124,58,237,0.12))",
            border: "1px solid rgba(124,58,237,0.25)",
            borderRadius: "20px",
            padding: "28px 32px",
        }}>
            <h3 style={{
                fontSize: "16px", fontWeight: 700, color: "#e2e8f0",
                marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px",
            }}>
                🤖 AI Insights
            </h3>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "20px",
            }}>
                {insights.map((ins) => (
                    <div key={ins.label}>
                        <p style={{
                            fontSize: "11px", color: "#64748b", fontWeight: 600,
                            textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px",
                        }}>
                            {ins.label}
                        </p>
                        <p style={{
                            fontSize: ins.value.length > 20 ? "14px" : "20px",
                            fontWeight: 700,
                            color: ins.accent ? ACCENT_COLORS[ins.accent] : "#e2e8f0",
                            lineHeight: 1.3,
                        }}>
                            {ins.value}
                        </p>
                        {ins.sub && (
                            <p style={{ fontSize: "12px", color: "#475569", marginTop: "3px" }}>{ins.sub}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
