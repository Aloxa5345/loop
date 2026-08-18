"use client";

import { FormEvent, useState } from "react";

interface Props {
    onSuccess: (member: { id: string; userId: string; name: string; email: string; role: string; joinedAt: string }) => void;
}

export default function InviteModal({ onSuccess }: Props) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("ANALYST");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setPending(true);

        const res = await fetch("/api/invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
        });

        const data = await res.json().catch(() => ({}));
        setPending(false);

        if (!res.ok) {
            setError(data.error ?? "Something went wrong.");
        } else {
            // data.user contains the invited user
            onSuccess({
                id: data.id,
                userId: data.userId ?? data.user?.id,
                name: data.user.name,
                email: data.user.email,
                role: data.role,
                joinedAt: data.joinedAt,
            });
            setEmail("");
            setRole("ANALYST");
            setOpen(false);
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
                + Invite member
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Invite member"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                >
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
                        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            Invite a member
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    Role
                                </label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="ANALYST">ANALYST</option>
                                    <option value="VIEWER">VIEWER</option>
                                </select>
                            </div>

                            {error && <p className="text-sm text-red-500">{error}</p>}

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setOpen(false); setError(null); }}
                                    className="rounded-lg px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={pending}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {pending ? "Inviting…" : "Send invite"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
