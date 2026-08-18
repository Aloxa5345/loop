"use client";

interface BarItem { label: string; value: number; color: string }

interface Props {
    sentimentCounts: { positive: number; neutral: number; negative: number };
    byChannel: { channel: string; count: number }[];
    topTopics: { topic: string; count: number }[];
}

function BarChart({ items, title }: { items: BarItem[]; title: string }) {
    const max = Math.max(...items.map((i) => i.value), 1);
    return (
        <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px", padding: "24px",
        }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#e2e8f0", marginBottom: "20px" }}>{title}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {items.map((item) => (
                    <div key={item.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ fontSize: "13px", color: "#94a3b8" }}>{item.label}</span>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: item.color }}>{item.value}</span>
                        </div>
                        <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "20px", overflow: "hidden" }}>
                            <div style={{
                                height: "100%", borderRadius: "20px",
                                width: `${Math.round((item.value / max) * 100)}%`,
                                background: item.color,
                                transition: "width 0.6s ease",
                            }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DonutChart({ items, title }: { items: BarItem[]; title: string }) {
    const total = items.reduce((s, i) => s + i.value, 0) || 1;
    return (
        <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px", padding: "24px",
        }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#e2e8f0", marginBottom: "20px" }}>{title}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {items.map((item) => {
                    const pct = Math.round((item.value / total) * 100);
                    return (
                        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: "13px", color: "#94a3b8" }}>{item.label}</span>
                            <div style={{ width: "120px", height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "10px", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: item.color, borderRadius: "10px" }} />
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: item.color, width: "36px", textAlign: "right" }}>{pct}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function ReportsChart({ sentimentCounts, byChannel, topTopics }: Props) {
    const sentimentItems: BarItem[] = [
        { label: "😊 Positive", value: sentimentCounts.positive, color: "#4ade80" },
        { label: "😐 Neutral", value: sentimentCounts.neutral, color: "#fbbf24" },
        { label: "😞 Negative", value: sentimentCounts.negative, color: "#f87171" },
    ];

    const channelColors = ["#22d3ee", "#a5b4fc", "#fcd34d", "#6ee7b7", "#f87171", "#c4b5fd", "#fb923c"];
    const channelItems: BarItem[] = byChannel.slice(0, 7).map((c, i) => ({
        label: c.channel, value: c.count, color: channelColors[i % channelColors.length],
    }));

    const topicColors = ["#06b6d4", "#4f46e5", "#7c3aed", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
    const topicItems: BarItem[] = topTopics.slice(0, 8).map((t, i) => ({
        label: t.topic, value: t.count, color: topicColors[i % topicColors.length],
    }));

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            <BarChart items={sentimentItems} title="📊 Sentiment Analysis" />
            <DonutChart items={channelItems} title="📡 Channel Distribution" />
            <BarChart items={topicItems} title="🏷️ Top Topics" />
        </div>
    );
}
