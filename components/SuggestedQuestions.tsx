"use client";

const DEFAULT_QUESTIONS = [
    "What are customers requesting most?",
    "Why is sentiment negative?",
    "Which themes are growing?",
    "What do customers like most?",
    "Which feature should we build next?",
    "What are the top complaints?",
    "Summarize feedback from the last 30 days.",
    "What problems affect mobile users?",
];

interface Props {
    onSelect: (q: string) => void;
}

export default function SuggestedQuestions({ onSelect }: Props) {
    return (
        <div className="al-suggestions" role="list" aria-label="Suggested questions">
            {DEFAULT_QUESTIONS.map((q) => (
                <button
                    key={q}
                    type="button"
                    className="al-suggestion-btn"
                    onClick={() => onSelect(q)}
                    role="listitem"
                >
                    {q}
                </button>
            ))}
        </div>
    );
}
