"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
    onSend: (q: string) => void;
    disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
    }, [value]);

    function handleSend() {
        const q = value.trim();
        if (!q || disabled) return;
        onSend(q);
        setValue("");
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <div className="al-input-row">
            <div className="al-input-wrap">
                <textarea
                    ref={textareaRef}
                    className="al-input"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about your customer feedback… (Enter to send)"
                    disabled={disabled}
                    aria-label="Ask a question"
                    rows={1}
                    maxLength={500}
                />
                <button
                    type="button"
                    className="al-send-btn"
                    onClick={handleSend}
                    disabled={disabled || !value.trim()}
                    aria-label="Send question"
                >
                    ↑
                </button>
            </div>
        </div>
    );
}
