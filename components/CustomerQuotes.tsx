"use client";

import type { VocQuote } from "@/lib/ai/vocReport";

interface Props {
    quotes: VocQuote[];
}

const SENT_STYLE: Record<string, { color: string; bg: string; icon: string }> = {
    Positive: { color: "#4ade80", bg: "rgba(74,222,128,.12)", icon: "😊" },
    Neutral: { color: "#fbbf24", bg: "rgba(251,191,36,.12)", icon: "😐" },
    Negative: { color: "#f87171", bg: "rgba(248,113,113,.12)", icon: "😞" },
};

function Stars({ count, max = 5 }: { count: number; max?: number }) {
    return (
        <span className="voc-stars" aria-label={`${count} out of ${max} stars`}>
            {Array.from({ length: max }, (_, i) => (
                <span key={i} style={{ color: i < count ? "#fbbf24" : "rgba(255,255,255,.15)", fontSize: "13px" }}>
                    ★
                </span>
            ))}
        </span>
    );
}

export default function CustomerQuotes({ quotes }: Props) {
    return (
        <div className="voc-section">
            <h2 className="voc-section-title">💬 Customer Quotes</h2>

            {quotes.length === 0 ? (
                <p className="voc-empty">No feedback found for this period.</p>
            ) : (
                <div className="voc-quotes-grid">
                    {quotes.map((q, i) => {
                        const s = SENT_STYLE[q.sentiment ?? ""] ?? { color: "#94a3b8", bg: "rgba(148,163,184,.08)", icon: "💬" };
                        const stars = q.stars ?? (q.sentiment === "Positive" ? 5 : q.sentiment === "Negative" ? 2 : 3);
                        return (
                            <div key={i} className="voc-quote-card" style={{ borderColor: `${s.color}33` }}>
                                <div className="voc-quote-header">
                                    <Stars count={stars} />
                                    <span className="voc-quote-customer">{q.customerLabel}</span>
                                    <span className="voc-quote-channel">{q.channel}</span>
                                    {q.sentiment && (
                                        <span className="voc-quote-badge" style={{ background: s.bg, color: s.color }}>
                                            {q.sentiment}
                                        </span>
                                    )}
                                </div>
                                <p className="voc-quote-text">"{q.content}"</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
