"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InviteModal from "@/components/InviteModal";

interface Member {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: string;
    joinedAt: string;
}

interface Props {
    initialMembers: Member[];
    canManage: boolean;
    currentUserId: string;
}

const ROLE_STYLE: Record<string, { color: string; bg: string }> = {
    ADMIN: { color: "#c4b5fd", bg: "rgba(124,58,237,.15)" },
    ANALYST: { color: "#22d3ee", bg: "rgba(6,182,212,.15)" },
    VIEWER: { color: "#94a3b8", bg: "rgba(100,116,139,.15)" },
};

function RolePill({ role }: { role: string }) {
    const s = ROLE_STYLE[role] ?? { color: "#94a3b8", bg: "rgba(100,116,139,.15)" };
    return (
        <span style={{
            padding: "3px 10px", borderRadius: "20px",
            fontSize: "11px", fontWeight: 700,
            background: s.bg, color: s.color,
            letterSpacing: ".04em", textTransform: "uppercase",
        }}>
            {role}
        </span>
    );
}

function Avatar({ name }: { name: string }) {
    const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return (
        <div className="mem-avatar" aria-hidden="true">{initials}</div>
    );
}

export default function MembersClient({ initialMembers, canManage, currentUserId }: Props) {
    const router = useRouter();
    const [members, setMembers] = useState<Member[]>(initialMembers);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    function handleInviteSuccess(newMember: Member) {
        setMembers((prev) => [...prev, newMember]);
        router.refresh();
    }

    async function updateRole(memberId: string, role: string) {
        setBusy(memberId);
        setError(null);
        const res = await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ memberId, role }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            setError(data.error ?? "Failed to update role.");
        } else {
            setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role } : m));
        }
        setBusy(null);
    }

    async function removeMember(memberId: string, name: string) {
        if (!confirm(`Remove ${name} from the workspace?`)) return;
        setBusy(memberId);
        setError(null);
        const res = await fetch(`/api/users?memberId=${memberId}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            setError(data.error ?? "Failed to remove member.");
        } else {
            setMembers((prev) => prev.filter((m) => m.id !== memberId));
        }
        setBusy(null);
    }

    return (
        <div>
            {/* Toolbar */}
            <div className="mem-toolbar">
                <p className="mem-count">
                    {members.length} member{members.length !== 1 ? "s" : ""}
                </p>
                {canManage && <InviteModal onSuccess={handleInviteSuccess} />}
            </div>

            {/* Error */}
            {error && (
                <div className="mem-error">⚠️ {error}</div>
            )}

            {/* Table */}
            <div className="mem-table-wrap">
                <table className="mem-table">
                    <thead>
                        <tr>
                            <th>Member</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            {canManage && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {members.map((m) => {
                            const isYou = m.userId === currentUserId;
                            const isBusy = busy === m.id;
                            return (
                                <tr key={m.id} className={isBusy ? "mem-row-busy" : ""}>
                                    {/* Member */}
                                    <td>
                                        <div className="mem-name-cell">
                                            <Avatar name={m.name} />
                                            <div>
                                                <p className="mem-name">
                                                    {m.name}
                                                    {isYou && <span className="mem-you">you</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Email */}
                                    <td className="mem-email">{m.email}</td>

                                    {/* Role */}
                                    <td><RolePill role={m.role} /></td>

                                    {/* Joined */}
                                    <td className="mem-date">
                                        {new Date(m.joinedAt).toLocaleDateString("en-US", {
                                            month: "short", day: "numeric", year: "numeric",
                                        })}
                                    </td>

                                    {/* Actions */}
                                    {canManage && (
                                        <td>
                                            <div className="mem-actions">
                                                <select
                                                    className="mem-role-select"
                                                    value={m.role}
                                                    disabled={isBusy || isYou}
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
                                                        onClick={() => removeMember(m.id, m.name)}
                                                        disabled={isBusy}
                                                        aria-label={`Remove ${m.name}`}
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

                {members.length === 0 && (
                    <div className="mem-empty">
                        <div style={{ fontSize: "36px", marginBottom: "12px" }}>👥</div>
                        <p>No members yet. Invite someone to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
