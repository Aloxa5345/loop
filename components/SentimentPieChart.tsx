"use client";

interface Segment { name: string; value: number; color: string }

interface Props { data: Segment[] }

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`;
}

export default function SentimentPieChart({ data }: Props) {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const cx = 100, cy = 100, r = 80;

    let cursor = 0;
    const slices = data.map(d => {
        const angle = (d.value / total) * 360;
        const start = cursor;
        cursor += angle;
        return { ...d, start, end: cursor, pct: Math.round((d.value / total) * 100) };
    });

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
            <svg
                viewBox="0 0 200 200"
                style={{ width: "160px", height: "160px", flexShrink: 0 }}
                role="img"
                aria-label="Sentiment pie chart"
            >
                <defs>
                    <filter id="pieShadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity=".25" />
                    </filter>
                </defs>
                {slices.map((s, i) => (
                    <path
                        key={i}
                        d={arcPath(cx, cy, r, s.start, s.end)}
                        fill={s.color}
                        opacity=".9"
                        filter="url(#pieShadow)"
                    >
                        <title>{s.name}: {s.pct}%</title>
                    </path>
                ))}
                {/* Donut hole */}
                <circle cx={cx} cy={cy} r={46} fill="#0c1529" />
                <text x={cx} y={cy - 8} textAnchor="middle" fill="#e2e8f0" fontSize="18" fontWeight="700">
                    {total.toLocaleString()}
                </text>
                <text x={cx} y={cy + 10} textAnchor="middle" fill="#475569" fontSize="10">
                    total
                </text>
            </svg>

            {/* Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {slices.map((s) => (
                    <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                            width: "12px", height: "12px", borderRadius: "3px",
                            background: s.color, flexShrink: 0,
                        }} />
                        <div>
                            <p style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: 600 }}>
                                {s.name}
                            </p>
                            <p style={{ fontSize: "12px", color: "#475569" }}>
                                {s.pct}% ({s.value.toLocaleString()})
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
