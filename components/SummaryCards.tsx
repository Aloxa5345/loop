"use client";

import type { VocReportJson } from "@/lib/ai/vocReport";

interface Props {
    summary: VocReportJson["summary"];
}

const HEALTH_COLOR: Record<string, string> = {
    Excellent: "#4ade80",
    Good: "#22d3ee",
    Fair: "#fbbf24",
    Poor: "#f87171",
};

export default function SummaryCards({ summary }: Props) {
    const healthLabel = summary.healthLabel ?? "—";
    const healthScore = summary.healthScore ?? 0;
    const color = HEALTH_COLOR[healthLabel] ?? "#94a3b8";

    const cards = [
        { label: "Total Feedback", value: summary.totalFeedback.toLocaleString(), icon: "📊", color: "#e2e8f0" },
        { label: "Positive", value: `${summary.positivePct}%`, icon: "😊", color: "#4ade80" },
        { label: "Neutral", value: `${summary.neutralPct}%`, icon: "😐", color: "#fbbf24" },
        { label: "Negative", value: `${summary.negativePct}%`, icon: "😞", color: "#f87171" },
        { label: "Health Score", value: `${healthScore}`, icon: "❤️", color },
        { label: "Health", value: healthLabel, icon: "🏥", color },
    ];

    return (
        <div className="voc-summary-cards">
            {cards.map(({ label, value, icon, color: c }) => (
                <div key={label} className="voc-summary-card">
                    <span className="voc-summary-card-icon">{icon}</span>
                    <p className="voc-summary-card-label">{label}</p>
                    <p className="voc-summary-card-value" style={{ color: c }}>{value}</p>
                </div>
            ))}
        </div>
    );
}
