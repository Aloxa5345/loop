"use client";

interface Props {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = "🔍 Search feedback..." }: Props) {
    return (
        <div className="fb-search">
            <span className="fb-search-icon">🔍</span>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label="Search feedback"
            />
        </div>
    );
}
