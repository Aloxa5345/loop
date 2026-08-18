"use client";

interface Props {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}

export default function ThemeSearch({ value, onChange, placeholder = "Search themes…" }: Props) {
    return (
        <div className="th-search-wrap">
            <span className="th-search-icon" aria-hidden="true">🔍</span>
            <input
                type="text"
                className="th-search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label="Search themes"
            />
        </div>
    );
}
