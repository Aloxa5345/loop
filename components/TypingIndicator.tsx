"use client";

export default function TypingIndicator() {
    return (
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <div className="al-avatar ai" aria-hidden="true">🤖</div>
            <div className="al-typing" role="status" aria-label="LOOP AI is thinking">
                <div className="al-typing-dot" />
                <div className="al-typing-dot" />
                <div className="al-typing-dot" />
            </div>
        </div>
    );
}
