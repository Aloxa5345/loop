"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PRESETS = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "year", label: "This year" },
    { value: "custom", label: "Custom range" },
];

export default function NewReportClient() {
    const router = useRouter();
    const [preset, setPreset] = useState("30d");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleGenerate(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (preset === "custom" && (!from || !to)) {
            setError("Please select both a start and end date.");
            return;
        }
        if (preset === "custom" && new Date(from) > new Date(to)) {
            setError("Start date must be before end date.");
            return;
        }

        setLoading(true);
        try {
            const body: Record<string, string> = { preset };
            if (title) body.title = title;
            if (preset === "custom") { body.from = from; body.to = to; }

            const res = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) { setError(data.error ?? "Failed to generate report."); return; }

            router.push(`/reports/${data.id}`);
        } catch {
            setError("Network error — please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: "640px" }}>
            <div className="rpt-header" style={{ marginBottom: "32px" }}>
                <div>
                    <h1>📄 Generate VoC Report</h1>
                    <p>Select a date range and generate a Voice of Customer report from your workspace feedback.</p>
                </div>
            </div>

            <form onSubmit={handleGenerate}>
                <div className="voc-section">
                    <h2 className="voc-section-title">Report Settings</h2>

                    <div className="rpt-form-grid" style={{ gridTemplateColumns: "1fr" }}>
                        <div className="rpt-field">
                            <label htmlFor="rpt-title">Report Title (optional)</label>
                            <input
                                id="rpt-title"
                                type="text"
                                className="rpt-input"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. July 2026 VoC Report"
                                maxLength={100}
                            />
                        </div>

                        <div className="rpt-field">
                            <label htmlFor="rpt-preset">Date Range</label>
                            <select
                                id="rpt-preset"
                                className="rpt-select"
                                value={preset}
                                onChange={(e) => setPreset(e.target.value)}
                            >
                                {PRESETS.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>

                        {preset === "custom" && (
                            <>
                                <div className="rpt-field">
                                    <label htmlFor="rpt-from">Start Date</label>
                                    <input
                                        id="rpt-from"
                                        type="date"
                                        className="rpt-input"
                                        value={from}
                                        onChange={(e) => setFrom(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="rpt-field">
                                    <label htmlFor="rpt-to">End Date</label>
                                    <input
                                        id="rpt-to"
                                        type="date"
                                        className="rpt-input"
                                        value={to}
                                        onChange={(e) => setTo(e.target.value)}
                                        required
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {error && (
                        <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "16px" }}>⚠️ {error}</p>
                    )}

                    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: "13px 32px", border: "none", borderRadius: "12px",
                                background: "linear-gradient(90deg,#06b6d4,#4f46e5,#7c3aed)",
                                color: "#fff", fontSize: "15px", fontWeight: 700,
                                cursor: loading ? "not-allowed" : "pointer",
                                opacity: loading ? 0.6 : 1,
                                transition: ".2s",
                            }}
                        >
                            {loading ? "⏳ Generating…" : "📄 Generate Report"}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push("/reports")}
                            style={{
                                padding: "13px 24px", border: "1px solid rgba(255,255,255,.1)",
                                borderRadius: "12px", background: "transparent",
                                color: "#64748b", fontSize: "14px", cursor: "pointer",
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </form>

            <div className="voc-section" style={{ marginTop: "24px", background: "rgba(6,182,212,.05)", borderColor: "rgba(6,182,212,.15)" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#22d3ee", marginBottom: "10px" }}>ℹ️ What's included in a VoC Report?</h3>
                <ul style={{ color: "#64748b", fontSize: "13px", lineHeight: 1.8, paddingLeft: "18px", margin: 0 }}>
                    <li>Executive summary with key insight</li>
                    <li>Sentiment breakdown (Positive / Neutral / Negative)</li>
                    <li>Top themes and trends</li>
                    <li>Representative customer quotes</li>
                    <li>AI-powered action recommendations</li>
                    <li>Channel distribution</li>
                </ul>
            </div>
        </div>
    );
}
