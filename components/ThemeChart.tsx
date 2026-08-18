"use client";

import type { VocThemeRow } from "@/lib/ai/vocReport";

interface Props {
    themes: VocThemeRow[];
}

const TREND_COLOR = { "↑": "#4ade80", "↓": "#f87171", "→": "#fbbf24" };
const ROW_COLORS = ["#06b6d4", "#4f46e5", "#7c3aed", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function ThemeChart({ themes }: Props) {
    const max = Math.max(...themes.map((t) => t.count), 1);

    return (
        <div className="voc-section">
            <h2 className="voc-section-title">🏷️ Top Themes</h2>

            {themes.length === 0 ? (
                <p className="voc-empty">No themes found — run AI analysis on your feedback first.</p>
            ) : (
                <div className="voc-theme-table">
                    <div className="voc-theme-header">
                        <span>#</span>
                        <span>Theme</span>
                        <span>Feedback</span>
                        <span>Trend</span>
                        <span>Share</span>
                    </div>
                    {themes.map((row, i) => (
                        <div key={row.theme} className="voc-theme-row">
                            <span className="voc-theme-rank">{i + 1}</span>
                            <span className="voc-theme-name" style={{ color: ROW_COLORS[i % ROW_COLORS.length] }}>
                                {row.theme}
                            </span>
                            <span className="voc-theme-count">{row.count}</span>
                            <span className="voc-theme-trend" style={{ color: TREND_COLOR[row.trend] }}>
                                {row.trend}
                            </span>
                            <div className="voc-theme-bar-wrap">
                                <div
                                    className="voc-theme-bar"
                                    style={{
                                        width: `${Math.round((row.count / max) * 100)}%`,
                                        background: ROW_COLORS[i % ROW_COLORS.length],
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
