"use client";

interface Props {
    channel: string;
    status: string;
    sort: string;
    onChannelChange: (v: string) => void;
    onStatusChange: (v: string) => void;
    onSortChange: (v: string) => void;
}

const CHANNELS = [
    "Website", "Email", "Twitter", "Instagram", "Facebook",
    "LinkedIn", "WhatsApp", "Support Ticket", "App Store", "Play Store", "Manual",
];

export default function FeedbackFilters({
    channel, status, sort,
    onChannelChange, onStatusChange, onSortChange,
}: Props) {
    return (
        <>
            <select
                className="fb-select"
                value={channel}
                onChange={(e) => onChannelChange(e.target.value)}
                aria-label="Filter by channel"
            >
                <option value="">All Channels</option>
                {CHANNELS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>

            <select
                className="fb-select"
                value={status}
                onChange={(e) => onStatusChange(e.target.value)}
                aria-label="Filter by status"
            >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="ANALYZED">Analyzed</option>
            </select>

            <select
                className="fb-select"
                value={sort}
                onChange={(e) => onSortChange(e.target.value)}
                aria-label="Sort feedback"
            >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="az">A–Z</option>
                <option value="status">Status</option>
                <option value="channel">Channel</option>
            </select>
        </>
    );
}
