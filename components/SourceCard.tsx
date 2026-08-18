"use client";

import Link from "next/link";

interface Props {
    id: string;
    content: string;
    sentiment: string | null;
    channel: string;
    customerLabel: string;
    score?: number;  // relevance % (0-100)
}

const SENT_CLASS: Record<string, string> = {
    Positive: "al-source-pos",
    Negative: "al-source-neg",
    Neutral: "al-source-neu",
};

export default function SourceCard({ id, content, sentiment, channel, customerLabel, score }: Props) {
    const badgeCls = SENT_CLASS[sentiment ?? ""] ?? "al-source-unk";

    return (
        <Link href={`/feedback/${id}`} className="al-source-card" target="_blank" rel="noopener noreferrer">
            <div className="al-source-card-header">
                <span style={{ fontSize: "11px", color: "#475569", fontWeight: 500 }}>
                    {customerLabel} · {channel}
                </span>
                {sentiment && (
                    <span className={`al-source-badge ${badgeCls}`}>{sentiment}</span>
                )}
                {score != null && (
                    <span style={{ marginLeft: "auto", fontSize: "10px", color: "#475569" }}>
                        {score}% match
                    </span>
                )}
            </div>
            <p className="al-source-text">{content}</p>
        </Link>
    );
}
