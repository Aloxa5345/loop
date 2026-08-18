"use client";

import { useRef, useEffect } from "react";
import MessageBubble, { type Message } from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

interface Props {
    messages: Message[];
    thinking: boolean;
}

export default function ChatWindow({ messages, thinking }: Props) {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, thinking]);

    return (
        <div
            className="al-chat-window"
            role="log"
            aria-live="polite"
            aria-label="Chat conversation"
        >
            {messages.length === 0 && !thinking ? (
                <div className="al-empty">
                    <div className="al-empty-icon">💬</div>
                    <h3>Ask LOOP AI</h3>
                    <p>
                        Every answer is grounded in your workspace feedback.<br />
                        Select a suggested question above or type your own.
                    </p>
                </div>
            ) : (
                <>
                    {messages.map((msg, i) => (
                        <MessageBubble key={i} message={msg} />
                    ))}
                    {thinking && <TypingIndicator />}
                </>
            )}
            <div ref={bottomRef} aria-hidden="true" />
        </div>
    );
}
