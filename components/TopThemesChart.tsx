"use client";

interface Theme { theme: string; count: number }
interface Props { data: Theme[] }

const COLORS = ["#06b6d4", "#4f46e5", "#7c3aed", "#10b981", "#f59e0b", "#ef4444"];

export default function TopThemesChart({ data }: Props) {
    if (!data.length) {
        return (
            <div style={{ textAlign: "center", padding: "32px", color: "#475569" }}>
                <p>No themes yet. Run AI analysis to extract topics.</p>
            </div>
        );
    }

    const max = Math.max(...data.map(d => d.count), 1);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {data.map((d, i) => {
                const pct = Math.round((d.count / max) * 100);
                const color = COLORS[i % COLORS.length];
                return (
                    <div key={d.theme}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                            <span style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 500 }}>
                                {d.theme}
                            </span>
                            <span style={{ fontSize: "13px", fontWeight: 700, color }}>
                                {d.count}
                            </span>
                        </div>
                        <div style={{
                            height: "8px",
                            background: "rgba(255,255,255,.06)",
                            borderRadius: "20px",
                            overflow: "hidden",
                        }}>
                            <div style={{
                                height: "100%",
                                width: `${pct}%`,
                                background: color,
                                borderRadius: "20px",
                                transition: "width 0.6s ease",
                            }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
