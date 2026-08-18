"use client";

/**
 * MembersTable — legacy export kept for any external imports.
 * The primary rendering is now done inline in MembersClient.tsx
 * using the project's CSS design system instead of Tailwind.
 */

import { useState } from "react";

interface Member {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: string;
    joinedAt: string;
}

interface Props {
    members: Member[];
    canManage: boolean;
    currentUserId: string;
}

const ROLE_STYLE: Record<string, { color: string; bg: string }> = {
    ADMIN: { color: "#c4b5fd", bg: "rgba(124,58,237,.15)" },
    ANALYST: { color: "#22d3ee", bg: "rgba(6,182,212,.15)" },
    VIEWER: { color: "#94a3b8", bg: "rgba(100,116,139,.15)" },
};

export default function MembersTable({ members: initial, canManage, currentUserId }: Props) {
    const [list, setList] = useState<Member[]>(initial);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function updateRole(memberId: string, role: string) {
        setBusy(memberId);
        setError(null);
        const res = await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ memberId, role }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) setError(data.error ?? "Failed to update role.");
        else setList((prev) => prev.map((m) => m.id === memberId ? { ...m, role } : m));
        setBusy(null);
    }

    async function removeMember(memberId: string) {
        if (!confirm("Remove this member?")) return;
        setBusy(memberId);
        setError(null);
        const res = await fetch(`/api/users?memberId=${memberId}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) setError(data.error ?? "Failed to remove member.");
        else setList((prev) => prev.filter((m) => m.id !== memberId));
        setBusy(null);
    }

    return (
        <div style={{ overflowX: "auto" }}>
            {error && (
                <p style={{ color: "#fca5a5", fontSize: "13px", marginBottom: "12px" }}>⚠️ {error}</p>
            )}
            <table className="mem-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                        {canManage && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {list.map((m) => {
                        const s = ROLE_STYLE[m.role] ?? { color: "#94a3b8", bg: "rgba(100,116,139,.15)" };
                        const isYou = m.userId === currentUserId;
                        return (
                            <tr key={m.id} style={{ opacity: busy === m.id ? 0.5 : 1 }}>
                                <td style={{ fontWeight: 600, color: "#e2e8f0" }}>
                                    {m.name}
                                    {isYou && (
                                        <span style={{ marginLeft: "6px", fontSize: "10px", color: "#22d3ee" }}>(you)</span>
                                    )}
                                </td>
                                <td style={{ color: "#64748b", fontSize: "13px" }}>{m.email}</td>
                                <td>
                                    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: s.bg, color: s.color }}>
                                        {m.role}
                                    </span>
                                </td>
                                <td style={{ color: "#475569", fontSize: "12px" }}>
                                    {new Date(m.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </td>
                                {canManage && (
                                    <td>
                                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                            <select
                                                className="mem-role-select"
                                                value={m.role}
                                                disabled={busy === m.id || isYou}
                                                onChange={(e) => updateRole(m.id, e.target.value)}
                                                aria-label={`Change role for ${m.name}`}
                                            >
                                                <option value="ADMIN">Admin</option>
                                                <option value="ANALYST">Analyst</option>
                                                <option value="VIEWER">Viewer</option>
                                            </select>
                                            {!isYou && (
                                                <button
                                                    type="button"
                                                    className="mem-remove-btn"
                                                    onClick={() => removeMember(m.id)}
                                                    disabled={busy === m.id}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
