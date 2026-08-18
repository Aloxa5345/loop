"use client";

export type DatePreset = "today" | "yesterday" | "7d" | "30d" | "90d" | "year" | "custom";

interface Props {
    preset: DatePreset;
    from: string;
    to: string;
    onPresetChange: (p: DatePreset) => void;
    onFromChange: (v: string) => void;
    onToChange: (v: string) => void;
    onApply: () => void;
}

const PRESETS: { value: DatePreset; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 90 Days" },
    { value: "year", label: "This Year" },
    { value: "custom", label: "Custom Range" },
];

export default function DateFilter({ preset, from, to, onPresetChange, onFromChange, onToChange, onApply }: Props) {
    return (
        <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            padding: "18px 22px",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            marginBottom: "24px",
        }}>
            <span style={{ color: "#64748b", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                📅 Date Range
            </span>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {PRESETS.map((p) => (
                    <button
                        key={p.value}
                        type="button"
                        onClick={() => onPresetChange(p.value)}
                        style={{
                            padding: "7px 14px",
                            borderRadius: "8px",
                            border: "1px solid",
                            fontSize: "13px",
                            fontWeight: 500,
                            cursor: "pointer",
                            transition: "0.2s",
                            borderColor: preset === p.value ? "#06b6d4" : "rgba(255,255,255,0.1)",
                            background: preset === p.value ? "rgba(6,182,212,0.15)" : "transparent",
                            color: preset === p.value ? "#22d3ee" : "#94a3b8",
                        }}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {preset === "custom" && (
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => onFromChange(e.target.value)}
                        style={{
                            padding: "8px 12px", borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.05)",
                            color: "#e2e8f0", fontSize: "13px",
                            outline: "none",
                        }}
                    />
                    <span style={{ color: "#64748b" }}>→</span>
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => onToChange(e.target.value)}
                        style={{
                            padding: "8px 12px", borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.05)",
                            color: "#e2e8f0", fontSize: "13px",
                            outline: "none",
                        }}
                    />
                    <button
                        type="button"
                        onClick={onApply}
                        style={{
                            padding: "8px 18px", border: "none", borderRadius: "8px",
                            background: "linear-gradient(90deg,#06b6d4,#4f46e5)",
                            color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                        }}
                    >
                        Apply
                    </button>
                </div>
            )}
        </div>
    );
}
