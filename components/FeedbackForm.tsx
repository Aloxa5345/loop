"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// ── Feedback Channels — where the feedback came from ─────────────────────
const CHANNELS = [
    "Email",
    "WhatsApp",
    "Telegram",
    "Facebook",
    "Instagram",
    "X / Twitter",
    "LinkedIn",
    "Phone Call",
    "Support Ticket",
    "Live Chat",
    "Chatbot",
    "App Store Review",
    "Google Play Review",
    "Survey",
    "Website Form",
    "Sales Notes",
    "Other",
];

// ── Product Areas — where the customer experienced the issue ─────────────
const PRODUCT_AREAS = [
    "Website",
    "Mobile App",
    "Web Application",
    "Desktop Application",
    "API / Integration",
    "E-commerce Platform",
    "Dashboard",
    "Reports",
    "AI Reports",
    "Analytics",
    "Settings",
    "Notifications",
    "Billing",
    "Other",
];

const CUSTOMER_LABELS = [
    "Enterprise",
    "Premium Customer",
    "VIP",
    "Startup",
    "Free User",
    "Internal",
    "Other",
];

const PRIORITIES = ["High", "Medium", "Low"];

const CATEGORIES = [
    "Bug Report",
    "Feature Request",
    "Appreciation",
    "Complaint",
    "Performance",
    "UI/UX",
    "Billing",
    "Other",
];

interface FeedbackData {
    id?: string;
    content?: string;
    channel?: string;
    customerLabel?: string;
    customerEmail?: string;
    title?: string;
    priority?: string;
    category?: string;
    productArea?: string;
    rating?: number;
    status?: string;
}

interface Props {
    initialData?: FeedbackData;
    mode: "new" | "edit";
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [hovered, setHovered] = useState(0);
    return (
        <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "26px",
                        padding: "0 2px",
                        color: star <= (hovered || value) ? "#fbbf24" : "rgba(255,255,255,.15)",
                        transition: "color .15s",
                    }}
                >
                    ★
                </button>
            ))}
            {value > 0 && (
                <span style={{ alignSelf: "center", fontSize: "12px", color: "#64748b", marginLeft: "4px" }}>
                    {value}/5
                </span>
            )}
        </div>
    );
}

export default function FeedbackForm({ initialData, mode }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [title, setTitle] = useState(initialData?.title ?? "");
    const [content, setContent] = useState(initialData?.content ?? "");
    const [channel, setChannel] = useState(initialData?.channel ?? "");
    const [customerLabel, setCustomerLabel] = useState(initialData?.customerLabel ?? "");
    const [customerEmail, setCustomerEmail] = useState(initialData?.customerEmail ?? "");
    const [status, setStatus] = useState(initialData?.status ?? "PENDING");
    const [priority, setPriority] = useState(initialData?.priority ?? "");
    const [category, setCategory] = useState(initialData?.category ?? "");
    const [productArea, setProductArea] = useState(initialData?.productArea ?? "");
    const [rating, setRating] = useState(initialData?.rating ?? 0);
    const [error, setError] = useState("");

    const MAX = 5000;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!content.trim()) { setError("Description is required."); return; }
        if (content.trim().length > MAX) { setError("Content must be 5000 characters or less."); return; }
        if (!customerLabel.trim()) { setError("Customer name is required."); return; }
        if (!channel) { setError("Channel is required."); return; }

        const url = mode === "edit" && initialData?.id
            ? `/api/feedback/${initialData.id}`
            : "/api/feedback";
        const method = mode === "edit" ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: title.trim(),
                content: content.trim(),
                channel,
                customerLabel: customerLabel.trim(),
                customerEmail: customerEmail.trim() || undefined,
                priority: priority || undefined,
                category: category || undefined,
                productArea: productArea || undefined,
                rating: rating > 0 ? rating : undefined,
                status,
            }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            setError(data.error ?? "Something went wrong.");
            return;
        }

        startTransition(() => {
            router.push("/feedback");
            router.refresh();
        });
    }

    const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" };

    return (
        <form onSubmit={handleSubmit} noValidate>
            {error && (
                <p className="fb-error" role="alert" style={{ marginBottom: "16px" }}>
                    ⚠️ {error}
                </p>
            )}

            {/* Row 1: Customer Name + Email */}
            <div style={grid2}>
                <div className="fb-field">
                    <label className="fb-label" htmlFor="customerLabel">
                        Customer Name <span className="required">*</span>
                    </label>
                    <input
                        id="customerLabel"
                        list="customerLabel-options"
                        className="fb-input"
                        value={customerLabel}
                        onChange={(e) => setCustomerLabel(e.target.value)}
                        placeholder="e.g. John Smith"
                        required
                    />
                    <datalist id="customerLabel-options">
                        {CUSTOMER_LABELS.map((l) => <option key={l} value={l} />)}
                    </datalist>
                </div>
                <div className="fb-field">
                    <label className="fb-label" htmlFor="customerEmail">
                        Customer Email
                    </label>
                    <input
                        id="customerEmail"
                        type="email"
                        className="fb-input"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="e.g. john@company.com"
                    />
                </div>
            </div>

            {/* Row 2: Channel + Status */}
            <div style={grid2}>
                <div className="fb-field">
                    <label className="fb-label" htmlFor="channel">
                        Feedback Channel <span className="required">*</span>
                    </label>
                    <select
                        id="channel"
                        className="fb-select-input"
                        value={channel}
                        onChange={(e) => setChannel(e.target.value)}
                        required
                    >
                        <option value="">— Select channel —</option>
                        {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="fb-field">
                    <label className="fb-label" htmlFor="status">Status</label>
                    <select
                        id="status"
                        className="fb-select-input"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="PENDING">Pending</option>
                        <option value="REVIEWED">Reviewed</option>
                        <option value="ANALYZED">Analyzed</option>
                    </select>
                </div>
            </div>

            {/* Row 3: Priority + Category */}
            <div style={grid2}>
                <div className="fb-field">
                    <label className="fb-label" htmlFor="priority">Priority</label>
                    <select
                        id="priority"
                        className="fb-select-input"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                    >
                        <option value="">— Select priority —</option>
                        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div className="fb-field">
                    <label className="fb-label" htmlFor="category">Category</label>
                    <select
                        id="category"
                        className="fb-select-input"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="">— Select category —</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Row 4: Product Area */}
            <div className="fb-field">
                <label className="fb-label" htmlFor="productArea">
                    Product Area
                    <span style={{ marginLeft: "6px", fontSize: "11px", color: "#475569", fontWeight: 400 }}>
                        (where the customer experienced the issue)
                    </span>
                </label>
                <select
                    id="productArea"
                    className="fb-select-input"
                    value={productArea}
                    onChange={(e) => setProductArea(e.target.value)}
                >
                    <option value="">— Select product area —</option>
                    {PRODUCT_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
            </div>

            {/* Feedback Title */}
            <div className="fb-field">
                <label className="fb-label" htmlFor="title">
                    Feedback Title <span className="required">*</span>
                </label>
                <input
                    id="title"
                    type="text"
                    className="fb-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Dashboard loading is very slow"
                    maxLength={200}
                    required
                />
            </div>

            {/* Feedback Description */}
            <div className="fb-field">
                <label className="fb-label" htmlFor="content">
                    Feedback Description <span className="required">*</span>
                </label>
                <textarea
                    id="content"
                    className="fb-input fb-textarea"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Describe the issue or feedback in detail…"
                    required
                    rows={5}
                />
                <p className={`fb-char-count${content.length > MAX ? " over" : ""}`}>
                    {content.length > MAX
                        ? `${content.length - MAX} over limit`
                        : `${MAX - content.length} characters remaining`}
                </p>
            </div>

            {/* Rating */}
            <div className="fb-field">
                <label className="fb-label">Rating</label>
                <StarRating value={rating} onChange={setRating} />
            </div>

            {/* Actions */}
            <div className="fb-form-actions" style={{ marginTop: "8px" }}>
                <button type="submit" className="fb-submit-btn" disabled={isPending}>
                    {isPending ? "Saving…" : mode === "edit" ? "💾 Save Changes" : "💾 Save Feedback"}
                </button>
                <a href="/feedback" className="fb-cancel-btn">Cancel</a>
            </div>
        </form>
    );
}
