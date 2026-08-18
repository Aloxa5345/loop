"use client";

interface Props {
    sentiment: string | null;
}

const CONFIG: Record<string, { emoji: string; label: string; color: string; bg: string; border: string }> = {
    Positive: {
        emoji: "😊",
        label: "Positive",
        color: "#4ade80",
        bg: "rgba(34,197,94,0.12)",
        border: "rgba(34,197,94,0.25)",
    },
    Neutral: {
        emoji: "😐",
        label: "Neutral",
        color: "#fbbf24",
        bg: "rgba(245,158,11,0.12)",
        border: "rgba(245,158,11,0.25)",
    },
    Negative: {
        emoji: "😞",
        label: "Negative",
        color: "#f87171",
        bg: "rgba(239,68,68,0.12)",
        border: "rgba(239,68,68,0.25)",
    },
};

export default function SentimentCard({ sentiment }: Props) {
    const cfg = sentiment ? CONFIG[sentiment] ?? CONFIG.Neutral : null;

    return (
        <div
            style={{
                background: cfg ? cfg.bg : "rgba(255,255,255,0.04)",
                border: `1px solid ${cfg ? cfg.border : "rgba(255,255,255,0.08)"}`,
                borderRadius: "16px",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
            }}
        >
            <span style={{ fontSize: "36px" }}>{cfg?.emoji ?? "🤖"}</span>
            <div>
                <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                    Sentiment
                </p>
                <p style={{ fontSize: "22px", fontWeight: 700, color: cfg?.color ?? "#94a3b8" }}>
                    {cfg?.label ?? "Not analyzed"}
                </p>
            </div>
        </div>
    );
}
