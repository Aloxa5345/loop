"use client";

/**
 * ThemeTrendChart — SVG line chart showing monthly feedback volume for a theme.
 * Matches the FeedbackVolumeChart pattern already used in the project.
 */

interface DataPoint { month: string; count: number }
interface Props { data: DataPoint[] }

export default function ThemeTrendChart({ data }: Props) {
    if (!data.length || data.every((d) => d.count === 0)) {
        return (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#475569", fontSize: "13px" }}>
                No volume data available for this period.
            </div>
        );
    }

    const W = 500, H = 180;
    const PAD = { top: 16, right: 16, bottom: 32, left: 44 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const maxVal = Math.max(...data.map((d) => d.count), 1);
    const step = innerW / (data.length - 1 || 1);

    const pts = data.map((d, i) => ({
        x: PAD.left + i * step,
        y: PAD.top + innerH - (d.count / maxVal) * innerH,
        ...d,
    }));

    const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
    const areaPath = [
        `M ${pts[0].x} ${PAD.top + innerH}`,
        ...pts.map((p) => `L ${p.x} ${p.y}`),
        `L ${pts[pts.length - 1].x} ${PAD.top + innerH}`,
        "Z",
    ].join(" ");

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
        y: PAD.top + innerH - f * innerH,
        label: Math.round(f * maxVal),
    }));

    // Only show a label every nth point when there are many months
    const labelEvery = data.length > 8 ? 2 : 1;

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: "100%", height: "auto", overflow: "visible" }}
            role="img"
            aria-label="Theme volume trend chart"
        >
            <defs>
                <linearGradient id="themeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity=".3" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="themeStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
            </defs>

            {/* Grid lines */}
            {yTicks.map((t) => (
                <line
                    key={t.label}
                    x1={PAD.left} y1={t.y}
                    x2={PAD.left + innerW} y2={t.y}
                    stroke="rgba(255,255,255,.06)" strokeWidth="1"
                />
            ))}

            {/* Y-axis labels */}
            {yTicks.map((t) => (
                <text key={t.label} x={PAD.left - 8} y={t.y + 4}
                    fill="#475569" fontSize="11" textAnchor="end">
                    {t.label}
                </text>
            ))}

            {/* Area fill */}
            <path d={areaPath} fill="url(#themeGrad)" />

            {/* Line */}
            <polyline
                points={polyline}
                fill="none"
                stroke="url(#themeStroke)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Dots + X labels */}
            {pts.map((p, i) => (
                <g key={i}>
                    <circle cx={p.x} cy={p.y} r="4" fill="#06b6d4" stroke="#0c1529" strokeWidth="2" />
                    {i % labelEvery === 0 && (
                        <text x={p.x} y={H - 6} fill="#475569" fontSize="10" textAnchor="middle">
                            {p.month}
                        </text>
                    )}
                    <title>{p.month}: {p.count}</title>
                </g>
            ))}
        </svg>
    );
}
