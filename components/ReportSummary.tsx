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

function HealthRing({ score, label }: { score: number; label: string }) {
    const color = HEALTH_COLOR[label] ?? "#94a3b8";
    const r = 36;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;

    return (
        <div className="voc-health-ring-wrap">
            <svg width="90" height="90" viewBox="0 0 90 90" aria-label={`Health score ${score}`}>
                {/* Track */}
                <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="8" />
                {/* Progress */}
                <circle
                    cx="45" cy="45" r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeDashoffset={circ / 4}
                    style={{ transition: "stroke-dasharray .8s ease" }}
                />
            </svg>
            <div className="voc-health-ring-label">
                <span className="voc-health-score" style={{ color }}>{score}</span>
                <span className="voc-health-text" style={{ color }}>{label}</span>
            </div>
        </div>
    );
}

export default function ReportSummary({ summary }: Props) {
    const stats = [
        { label: "Total Feedback", value: summary.totalFeedback.toLocaleString(), color: "#e2e8f0", icon: "📊" },
        { label: "Positive", value: `${summary.positivePct}%`, color: "#4ade80", icon: "😊" },
        { label: "Neutral", value: `${summary.neutralPct}%`, color: "#fbbf24", icon: "😐" },
        { label: "Negative", value: `${summary.negativePct}%`, color: "#f87171", icon: "😞" },
    ];

    const healthLabel = summary.healthLabel ?? (summary.positivePct >= 70 ? "Excellent" : summary.positivePct >= 50 ? "Good" : "Fair");
    const healthScore = summary.healthScore ?? summary.positivePct;

    return (
        <div className="voc-section">
            <h2 className="voc-section-title">📋 Executive Summary</h2>

            {/* Stats row + health ring */}
            <div className="voc-summary-row">
                <div className="voc-stat-grid">
                    {stats.map(({ label, value, color, icon }) => (
                        <div key={label} className="voc-stat-card">
                            <span className="voc-stat-icon">{icon}</span>
                            <p className="voc-stat-label">{label}</p>
                            <p className="voc-stat-value" style={{ color }}>{value}</p>
                        </div>
                    ))}
                </div>
                <HealthRing score={healthScore} label={healthLabel} />
            </div>

            {/* Key insight */}
            <div className="voc-insight-box" style={{ marginBottom: "16px" }}>
                <span className="voc-insight-icon">💡</span>
                <p className="voc-insight-text">{summary.keyInsight}</p>
            </div>

            {/* AI narrative summary bullets */}
            {summary.aiSummary && summary.aiSummary.length > 0 && (
                <div className="voc-ai-summary">
                    <p className="voc-ai-summary-title">🤖 AI Summary</p>
                    <ul className="voc-ai-summary-list">
                        {summary.aiSummary.map((line, i) => (
                            <li key={i}>{line}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
