"use client";

import type { VocSentimentRow, VocSentimentTrendPoint, VocSentimentChange } from "@/lib/ai/vocReport";

interface Props {
    rows: VocSentimentRow[];
    trend?: VocSentimentTrendPoint[];
    changes?: VocSentimentChange[];
}

// ── Mini SVG sparkline ────────────────────────────────────────────────────
function Sparkline({ points, color }: { points: number[]; color: string }) {
    if (points.length < 2) return null;
    const max = Math.max(...points, 1);
    const W = 200;
    const H = 40;
    const step = W / (points.length - 1);

    const coords = points.map((v, i) => ({
        x: i * step,
        y: H - (v / max) * (H - 4) - 2,
    }));

    const d = coords.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={coords.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
            />
            {coords.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
            ))}
        </svg>
    );
}

// ── Period change badge ───────────────────────────────────────────────────
function ChangeBadge({ change }: { change: VocSentimentChange }) {
    const trendColor = change.trend === "↑" ? "#4ade80" : change.trend === "↓" ? "#f87171" : "#fbbf24";
    const sign = change.delta > 0 ? "+" : "";
    return (
        <div className="voc-sent-change-row">
            <div className="voc-sent-dot" style={{ background: change.color }} />
            <span className="voc-sent-change-label">{change.label}</span>
            <span className="voc-sent-change-pct" style={{ color: change.color }}>{change.currentPct}%</span>
            <span className="voc-sent-change-trend" style={{ color: trendColor }}>
                {change.trend} {sign}{change.delta}%
            </span>
        </div>
    );
}

export default function SentimentChart({ rows, trend, changes }: Props) {
    const total = rows.reduce((s, r) => s + r.count, 0) || 1;
    const segments = rows.filter((r) => r.count > 0);
    const trendPoints = trend?.map((t) => t.positivePct) ?? [];
    const trendLabels = trend?.map((t) => t.month) ?? [];

    return (
        <div className="voc-section">
            <h2 className="voc-section-title">📈 Sentiment</h2>

            {/* Stacked bar */}
            <div className="voc-sentiment-bar" style={{ marginBottom: "16px" }}>
                {segments.map((row) => (
                    <div
                        key={row.label}
                        className="voc-sentiment-segment"
                        style={{ width: `${Math.round((row.count / total) * 100)}%`, background: row.color }}
                        title={`${row.label}: ${row.pct}%`}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="voc-sentiment-legend" style={{ marginBottom: changes ? "20px" : "0" }}>
                {rows.map((row) => (
                    <div key={row.label} className="voc-sentiment-legend-row">
                        <div className="voc-sentiment-dot" style={{ background: row.color }} />
                        <span className="voc-sentiment-label">{row.label}</span>
                        <div className="voc-sentiment-track">
                            <div className="voc-sentiment-fill" style={{ width: `${row.pct}%`, background: row.color }} />
                        </div>
                        <span className="voc-sentiment-pct" style={{ color: row.color }}>{row.pct}%</span>
                        <span className="voc-sentiment-n">({row.count.toLocaleString()})</span>
                    </div>
                ))}
            </div>

            {/* Period-over-period changes */}
            {changes && changes.length > 0 && (
                <div className="voc-sent-changes">
                    <p className="voc-sent-changes-title">📊 Period Changes</p>
                    {changes.map((c) => <ChangeBadge key={c.label} change={c} />)}
                </div>
            )}

            {/* Sparkline trend */}
            {trendPoints.length >= 2 && (
                <div className="voc-sparkline-wrap">
                    <p className="voc-sparkline-title">Positive % trend</p>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                        <Sparkline points={trendPoints} color="#4ade80" />
                        <div className="voc-sparkline-labels">
                            {trendLabels.map((l) => (
                                <span key={l}>{l}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
