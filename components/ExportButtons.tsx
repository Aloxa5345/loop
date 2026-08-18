"use client";

import { useState } from "react";

interface Props {
    preset: string;
    from: string;
    to: string;
    canExport: boolean;
}

export default function ExportButtons({ preset, from, to, canExport }: Props) {
    const [loading, setLoading] = useState<string | null>(null);

    async function handleExport(format: "CSV" | "Excel" | "PDF") {
        if (!canExport) return;

        if (format === "PDF") {
            // PDF: open print dialog on the reports page
            window.print();
            return;
        }

        setLoading(format);
        try {
            const res = await fetch("/api/reports/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ format, preset, from, to }),
            });

            if (!res.ok) return;

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const ext = format === "Excel" ? "xls" : "csv";
            a.href = url;
            a.download = `loop-report-${new Date().toISOString().slice(0, 10)}.${ext}`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setLoading(null);
        }
    }

    const btnStyle = (color: string, bg: string, border: string) => ({
        padding: "11px 20px", border: `1px solid ${border}`,
        borderRadius: "10px", background: bg, color,
        fontSize: "14px", fontWeight: 600, cursor: canExport ? "pointer" : "not-allowed",
        transition: "0.25s", opacity: canExport ? 1 : 0.45,
        display: "inline-flex", alignItems: "center", gap: "6px",
    });

    return (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
                type="button"
                style={btnStyle("#fca5a5", "rgba(239,68,68,0.12)", "rgba(239,68,68,0.3)")}
                onClick={() => handleExport("PDF")}
                disabled={!canExport}
                title={canExport ? "Print / Save as PDF" : "Admin or Analyst required"}
            >
                📄 {loading === "PDF" ? "…" : "Export PDF"}
            </button>
            <button
                type="button"
                style={btnStyle("#6ee7b7", "rgba(16,185,129,0.12)", "rgba(16,185,129,0.3)")}
                onClick={() => handleExport("CSV")}
                disabled={!canExport || loading === "CSV"}
                title={canExport ? "Export CSV" : "Admin or Analyst required"}
            >
                📊 {loading === "CSV" ? "Exporting…" : "Export CSV"}
            </button>
            <button
                type="button"
                style={btnStyle("#fcd34d", "rgba(245,158,11,0.12)", "rgba(245,158,11,0.3)")}
                onClick={() => handleExport("Excel")}
                disabled={!canExport || loading === "Excel"}
                title={canExport ? "Export Excel" : "Admin or Analyst required"}
            >
                📋 {loading === "Excel" ? "Exporting…" : "Export Excel"}
            </button>
        </div>
    );
}
