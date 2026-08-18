"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateWorkspaceForm() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setPending(true);

        const res = await fetch("/api/workspace", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim(), description: description.trim() }),
        });

        const data = await res.json().catch(() => ({}));
        setPending(false);

        if (!res.ok) {
            setError(data.error ?? "Something went wrong. Please try again.");
        } else {
            router.push("/workspace");
            router.refresh();
        }
    }

    return (
        <div className="ws-create-wrap">
            <Link href="/workspace" className="ws-create-back">
                ← Back to workspaces
            </Link>

            <div className="ws-header" style={{ marginBottom: "24px" }}>
                <div>
                    <h1>🏢 Create Workspace</h1>
                    <p>Set up a new workspace for your team.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="ws-create-form">
                <div className="ws-form-field">
                    <label htmlFor="ws-name">
                        Workspace Name <span style={{ color: "#f87171" }}>*</span>
                    </label>
                    <input
                        id="ws-name"
                        type="text"
                        className="ws-form-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. LOOP Company"
                        required
                        maxLength={80}
                        autoFocus
                    />
                </div>

                <div className="ws-form-field">
                    <label htmlFor="ws-desc">Description <span style={{ color: "#475569", fontWeight: 400 }}>(optional)</span></label>
                    <textarea
                        id="ws-desc"
                        className="ws-form-textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. AI Customer Feedback Platform"
                        maxLength={200}
                        rows={3}
                    />
                </div>

                {error && (
                    <div className="ws-form-error">⚠️ {error}</div>
                )}

                <button
                    type="submit"
                    className="ws-form-submit"
                    disabled={pending || !name.trim()}
                >
                    {pending ? "⏳ Creating…" : "🏢 Create Workspace"}
                </button>
            </form>
        </div>
    );
}
