"use client";

import { useState } from "react";
import SourceCard from "./SourceCard";

export interface Source {
    id: string;
    content: string;
    sentiment: string | null;
    channel: string;
    customerLabel: string;
    score: number;
}

export interface Message {
    role: "user" | "ai";
    text: string;
    sources?: Source[];
    timestamp: Date;
}

interface Props { message: Message }

function formatTime(d: Date) {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message }: Props) {
    const [showSources, setShowSources] = useState(false);
    const isUser = message.role === "user";

    return (
        <div className={`al-message ${isUser ? "user" : "ai"}`}>
            <div className={`al-avatar ${isUser ? "user" : "ai"}`} aria-hidden="true">
                {isUser ? "👤" : "🤖"}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "72%" }}>
                <div className={`al-bubble ${isUser ? "user" : "ai"}`}>
                    {/* Render line breaks */}
                    {message.text.split("\n").map((line, i) => (
                        <span key={i}>
                            {line}
                            {i < message.text.split("\n").length - 1 && <br />}
                        </span>
                    ))}
                    <time className="al-bubble-time" dateTime={message.timestamp.toISOString()}>
                        {formatTime(message.timestamp)}
                    </time>
                </div>

                {/* Sources toggle — AI messages only */}
                {!isUser && message.sources && message.sources.length > 0 && (
                    <div style={{ paddingLeft: "4px" }}>
                        <button
                            type="button"
                            onClick={() => setShowSources((v) => !v)}
                            style={{
                                background: "none", border: "none", cursor: "pointer",
                                fontSize: "11px", color: "#64748b", fontWeight: 500,
                                padding: "4px 0", display: "flex", alignItems: "center", gap: "4px",
                            }}
                            aria-expanded={showSources}
                        >
                            {showSources ? "▼" : "▶"}
                            {message.sources.length} source{message.sources.length !== 1 ? "s" : ""}
                        </button>

                        {showSources && (
                            <div className="al-sources">
                                <p className="al-sources-label">Source Feedback</p>
                                {message.sources.map((s) => (
                                    <SourceCard key={s.id} {...s} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
