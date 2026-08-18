"use client";

/**
 * ThemeTable — sortable, keyboard-accessible table of theme clusters.
 *
 * Clicking a row fires `onSelect` (opens the detail drawer).
 * The theme name cell also has a permalink to /themes/[name].
 */

import Link from "next/link";

interface ThemeCluster {
    name: string;
    count: number;
    positive: number;
    neutral: number;
    negative: number;
    trendPct: number;
    trendLabel: string;
    status: "Trending" | "Active" | "Declining";
    // optional extended fields (populated by detail panel)
    aiSummary?: string;
    recommendation?: string;
    recentFeedback?: unknown[];
}

interface Props {
    themes: ThemeCluster[];
    loading: boolean;
    onSelect: (theme: ThemeCluster) => void;
}

// ── helpers ────────────────────────────────────────────────────────────────
function TrendBadge({ label, pct }: { label: string; pct: number }) {
    const cls = pct > 0 ? "th-trend-up" : pct < 0 ? "th-trend-down" : "th-trend-flat";
    return <span className={cls}>{label}</span>;
}

function StatusBadge({ status }: { status: string }) {
    const cls =
        status === "Trending" ? "th-badge th-badge-trending" :
            status === "Declining" ? "th-badge th-badge-declining" :
                "th-badge th-badge-active";
    return <span className={cls}>{status}</span>;
}

function SentimentBar({ pos, neu, neg }: { pos: number; neu: number; neg: number }) {
    const total = pos + neu + neg || 1;
    return (
        <div className="th-sent-bar" title={`😊 ${pos}  😐 ${neu}  😞 ${neg}`}>
            <div className="th-sent-pos" style={{ width: `${(pos / total) * 100}%` }} />
            <div className="th-sent-neu" style={{ width: `${(neu / total) * 100}%` }} />
            <div className="th-sent-neg" style={{ width: `${(neg / total) * 100}%` }} />
        </div>
    );
}

function SkeletonRow() {
    return (
        <tr>
            {[160, 60, 90, 80, 80, 70].map((w, i) => (
                <td key={i} style={{ padding: "14px 18px" }}>
                    <div className="th-skeleton" style={{ height: "14px", width: `${w}px` }} />
                </td>
            ))}
        </tr>
    );
}

// ── component ──────────────────────────────────────────────────────────────
export default function ThemeTable({ themes, loading, onSelect }: Props) {
    return (
        <div className="th-table-wrap">
            <table className="th-table">
                <thead>
                    <tr>
                        <th>Theme</th>
                        <th>Feedback</th>
                        <th>Trend</th>
                        <th>Sentiment</th>
                        <th>Status</th>
                        <th>Negative %</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                    ) : themes.length === 0 ? (
                        <tr>
                            <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#475569" }}>
                                No themes found.
                            </td>
                        </tr>
                    ) : (
                        themes.map((theme) => {
                            const total = theme.count || 1;
                            const negPct = Math.round((theme.negative / total) * 100);

                            return (
                                <tr
                                    key={theme.name}
                                    onClick={() => onSelect(theme)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === "Enter" && onSelect(theme)}
                                    aria-label={`View details for theme ${theme.name}`}
                                >
                                    {/* Name — stop propagation on the permalink so clicking the link
                                        navigates to the page instead of also opening the drawer */}
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <span style={{ fontWeight: 600, color: "#e2e8f0" }}>
                                                🏷️ {theme.name}
                                            </span>
                                            <Link
                                                href={`/themes/${encodeURIComponent(theme.name)}`}
                                                onClick={(e) => e.stopPropagation()}
                                                title={`Open ${theme.name} detail page`}
                                                style={{
                                                    fontSize: "11px", color: "#64748b",
                                                    textDecoration: "none", flexShrink: 0,
                                                    padding: "2px 6px",
                                                    borderRadius: "5px",
                                                    border: "1px solid rgba(255,255,255,.08)",
                                                    transition: ".15s",
                                                }}
                                                onMouseEnter={(e) => {
                                                    (e.currentTarget as HTMLAnchorElement).style.color = "#22d3ee";
                                                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(6,182,212,.4)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    (e.currentTarget as HTMLAnchorElement).style.color = "#64748b";
                                                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,.08)";
                                                }}
                                            >
                                                ↗
                                            </Link>
                                        </div>
                                    </td>

                                    <td>
                                        <span style={{ fontWeight: 700, color: "#22d3ee", fontSize: "15px" }}>
                                            {theme.count.toLocaleString()}
                                        </span>
                                    </td>

                                    <td>
                                        <TrendBadge label={theme.trendLabel} pct={theme.trendPct} />
                                    </td>

                                    <td>
                                        <SentimentBar
                                            pos={theme.positive}
                                            neu={theme.neutral}
                                            neg={theme.negative}
                                        />
                                    </td>

                                    <td>
                                        <StatusBadge status={theme.status} />
                                    </td>

                                    <td>
                                        <span style={{
                                            color: negPct >= 50 ? "#f87171" : negPct >= 25 ? "#fbbf24" : "#4ade80",
                                            fontWeight: 600,
                                        }}>
                                            {negPct}%
                                        </span>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
