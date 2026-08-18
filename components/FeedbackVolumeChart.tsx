"use client";

interface DataPoint { month: string; count: number }

interface Props { data: DataPoint[] }

export default function FeedbackVolumeChart({ data }: Props) {
    if (!data.length) return null;

    const W = 500, H = 180, PAD = { top: 16, right: 16, bottom: 32, left: 44 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const maxVal = Math.max(...data.map(d => d.count), 1);
    const step = innerW / (data.length - 1 || 1);

    const pts = data.map((d, i) => ({
        x: PAD.left + i * step,
        y: PAD.top + innerH - (d.count / maxVal) * innerH,
        ...d,
    }));

    const polyline = pts.map(p => `${p.x},${p.y}`).join(" ");
    // Fill area under the line
    const areaPath = [
        `M ${pts[0].x} ${PAD.top + innerH}`,
        ...pts.map(p => `L ${p.x} ${p.y}`),
        `L ${pts[pts.length - 1].x} ${PAD.top + innerH}`,
        "Z",
    ].join(" ");

    // Y-axis ticks — deduplicate so small datasets don't repeat the same label
    const rawTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
        y: PAD.top + innerH - f * innerH,
        label: Math.round(f * maxVal),
    }));
    // Keep only the first occurrence of each label value
    const seenLabels = new Set<number>();
    const yTicks = rawTicks.filter(t => {
        if (seenLabels.has(t.label)) return false;
        seenLabels.add(t.label);
        return true;
    });

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: "100%", height: "auto", overflow: "visible" }}
            role="img"
            aria-label="Feedback volume line chart"
        >
            <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity=".35" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
            </defs>

            {/* Grid lines */}
            {yTicks.map((t, i) => (
                <line
                    key={`grid-${i}`}
                    x1={PAD.left} y1={t.y}
                    x2={PAD.left + innerW} y2={t.y}
                    stroke="rgba(255,255,255,.06)" strokeWidth="1"
                />
            ))}

            {/* Y labels */}
            {yTicks.map((t, i) => (
                <text key={`ylabel-${i}`} x={PAD.left - 8} y={t.y + 4}
                    fill="#475569" fontSize="11" textAnchor="end">
                    {t.label}
                </text>
            ))}

            {/* Area fill */}
            <path d={areaPath} fill="url(#lineGrad)" />

            {/* Line */}
            <polyline
                points={polyline}
                fill="none"
                stroke="url(#lineStroke)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Dots + tooltips */}
            {pts.map((p, i) => (
                <g key={i}>
                    <circle cx={p.x} cy={p.y} r="4" fill="#06b6d4" stroke="#0c1529" strokeWidth="2" />
                    {/* X label */}
                    <text x={p.x} y={H - 6} fill="#475569" fontSize="10" textAnchor="middle">
                        {p.month}
                    </text>
                    {/* Hover value (shown via title tooltip) */}
                    <title>{p.month}: {p.count}</title>
                </g>
            ))}
        </svg>
    );
}
