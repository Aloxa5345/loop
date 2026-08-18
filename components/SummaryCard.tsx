"use client";

interface Props {
    summary: string | null;
}

export default function SummaryCard({ summary }: Props) {
    return (
        <div style={{
            background: "rgba(79,70,229,0.08)",
            border: "1px solid rgba(79,70,229,0.2)",
            borderRadius: "16px",
            padding: "20px 24px",
        }}>
            <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
                🤖 AI Summary
            </p>
            <p style={{ color: "#cbd5e1", fontSize: "15px", lineHeight: "1.7" }}>
                {summary ?? <span style={{ color: "#475569" }}>Not analyzed yet.</span>}
            </p>
        </div>
    );
}
