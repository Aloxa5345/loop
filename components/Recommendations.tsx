"use client";

import type { VocRecommendation } from "@/lib/ai/vocReport";

interface Props {
    recommendations: VocRecommendation[];
}

const PRIORITY_STYLE: Record<string, { color: string; bg: string }> = {
    High: { color: "#f87171", bg: "rgba(239,68,68,.15)" },
    Medium: { color: "#fbbf24", bg: "rgba(245,158,11,.15)" },
    Low: { color: "#4ade80", bg: "rgba(74,222,128,.15)" },
};

export default function Recommendations({ recommendations }: Props) {
    return (
        <div className="voc-section">
            <h2 className="voc-section-title">✅ Recommended Actions</h2>

            {recommendations.length === 0 ? (
                <p className="voc-empty">No recommendations yet — run AI analysis on your feedback first.</p>
            ) : (
                <div className="voc-recs-list">
                    {recommendations.map((rec, i) => {
                        const style = PRIORITY_STYLE[rec.priority] ?? PRIORITY_STYLE.Low;
                        return (
                            <div key={i} className="voc-rec-row">
                                <span
                                    className="voc-rec-priority"
                                    style={{ background: style.bg, color: style.color }}
                                >
                                    {rec.priority}
                                </span>
                                <span className="voc-rec-action">{rec.action}</span>
                                <span className="voc-rec-count">×{rec.count}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
