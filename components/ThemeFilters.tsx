"use client";

const SENTIMENTS = ["Positive", "Neutral", "Negative"];
const STATUSES = ["Trending", "Active", "Declining"];
const RANGES = [
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
    { label: "90 Days", value: "90d" },
    { label: "This Year", value: "year" },
    { label: "All Time", value: "all" },
];

interface Props {
    range: string;
    onRangeChange: (v: string) => void;
    sentiment: string;
    onSentiment: (v: string) => void;
    status: string;
    onStatus: (v: string) => void;
    channel: string;
    onChannel: (v: string) => void;
    channels: string[];   // available channels for this theme / workspace
}

function Pill({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                padding: "7px 13px",
                borderRadius: "8px",
                border: `1px solid ${active ? "#06b6d4" : "rgba(255,255,255,.1)"}`,
                background: active ? "rgba(6,182,212,.15)" : "transparent",
                color: active ? "#22d3ee" : "#64748b",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                transition: ".18s",
                whiteSpace: "nowrap",
            }}
        >
            {children}
        </button>
    );
}

export default function ThemeFilters({
    range, onRangeChange,
    sentiment, onSentiment,
    status, onStatus,
    channel, onChannel,
    channels,
}: Props) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>

            {/* Date range */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", width: "70px", flexShrink: 0 }}>
                    Range
                </span>
                {RANGES.map((r) => (
                    <Pill key={r.value} active={range === r.value} onClick={() => onRangeChange(r.value)}>
                        {r.label}
                    </Pill>
                ))}
            </div>

            {/* Sentiment */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", width: "70px", flexShrink: 0 }}>
                    Sentiment
                </span>
                <Pill active={sentiment === ""} onClick={() => onSentiment("")}>All</Pill>
                {SENTIMENTS.map((s) => (
                    <Pill key={s} active={sentiment === s} onClick={() => onSentiment(sentiment === s ? "" : s)}>
                        {s === "Positive" ? "😊 " : s === "Negative" ? "😞 " : "😐 "}{s}
                    </Pill>
                ))}
            </div>

            {/* Status */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", width: "70px", flexShrink: 0 }}>
                    Status
                </span>
                <Pill active={status === ""} onClick={() => onStatus("")}>All</Pill>
                {STATUSES.map((s) => (
                    <Pill key={s} active={status === s} onClick={() => onStatus(status === s ? "" : s)}>
                        {s}
                    </Pill>
                ))}
            </div>

            {/* Channel — only render when channels are available */}
            {channels.length > 0 && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", width: "70px", flexShrink: 0 }}>
                        Channel
                    </span>
                    <Pill active={channel === ""} onClick={() => onChannel("")}>All</Pill>
                    {channels.map((c) => (
                        <Pill key={c} active={channel === c} onClick={() => onChannel(channel === c ? "" : c)}>
                            {c}
                        </Pill>
                    ))}
                </div>
            )}
        </div>
    );
}
