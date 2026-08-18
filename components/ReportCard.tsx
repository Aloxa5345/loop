"use client";

interface Props {
    id: string;
    title: string;
    format: string;
    periodStart: string;
    periodEnd: string;
    createdAt: string;
    generatedBy: string;
}

const FORMAT_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
    PDF: { icon: "📄", color: "#fca5a5", bg: "rgba(239,68,68,0.12)" },
    CSV: { icon: "📊", color: "#6ee7b7", bg: "rgba(16,185,129,0.12)" },
    EXCEL: { icon: "📋", color: "#fcd34d", bg: "rgba(245,158,11,0.12)" },
};

export default function ReportCard({ title, format, periodStart, periodEnd, createdAt, generatedBy }: Props) {
    const cfg = FORMAT_CONFIG[format.toUpperCase()] ?? FORMAT_CONFIG.PDF;

    return (
        <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            transition: "0.25s",
        }}>
            <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: cfg.bg, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "20px", flexShrink: 0,
            }}>
                {cfg.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: "#e2e8f0", fontSize: "14px", marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {title}
                </p>
                <p style={{ fontSize: "12px", color: "#64748b" }}>
                    {new Date(periodStart).toLocaleDateString()} – {new Date(periodEnd).toLocaleDateString()} · by {generatedBy}
                </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                <span style={{
                    padding: "3px 10px", borderRadius: "20px", fontSize: "11px",
                    fontWeight: 600, background: cfg.bg, color: cfg.color,
                }}>
                    {format}
                </span>
                <span style={{ fontSize: "11px", color: "#475569" }}>
                    {new Date(createdAt).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
}
