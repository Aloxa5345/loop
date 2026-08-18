"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import InviteModal from "@/components/InviteModal";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Member { id: string; userId: string; name: string; email: string; role: string; joinedAt: string }

interface Props {
    workspaceId: string;
    initialName: string;
    initialDescription: string;
    initialLogo: string;
    initialIndustry: string;
    initialTimezone: string;
    memberCount: number;
    feedbackCount: number;
    reportCount: number;
    createdAt: string;
    isOwner: boolean;
    canManageSettings: boolean;
    currentUserName: string;
    currentUserEmail: string;
    currentUserRole: string;
    members: Member[];
}

// ── Constants ─────────────────────────────────────────────────────────────────
const INDUSTRIES = [
    "SaaS / Software", "E-commerce", "Healthcare", "Finance", "Education",
    "Media / Entertainment", "Retail", "Logistics", "Real Estate",
    "Travel / Hospitality", "Non-profit", "Agency / Consulting", "Other",
];

const TIMEZONES = [
    "UTC", "America/New_York", "America/Chicago", "America/Denver",
    "America/Los_Angeles", "America/Toronto", "America/Sao_Paulo",
    "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
    "Asia/Dubai", "Asia/Kolkata", "Asia/Colombo", "Asia/Dhaka",
    "Asia/Bangkok", "Asia/Singapore", "Asia/Shanghai", "Asia/Tokyo",
    "Asia/Seoul", "Australia/Sydney", "Pacific/Auckland", "Africa/Cairo",
    "Africa/Lagos", "Africa/Nairobi",
];

const ROLE_STYLE: Record<string, { color: string; bg: string }> = {
    ADMIN: { color: "#c4b5fd", bg: "rgba(124,58,237,.15)" },
    ANALYST: { color: "#22d3ee", bg: "rgba(6,182,212,.15)" },
    VIEWER: { color: "#94a3b8", bg: "rgba(100,116,139,.15)" },
};

type Tab = "general" | "members" | "roles" | "security";

// ── Sub-components ────────────────────────────────────────────────────────────
function RolePill({ role }: { role: string }) {
    const s = ROLE_STYLE[role] ?? ROLE_STYLE.VIEWER;
    return (
        <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: s.bg, color: s.color, letterSpacing: ".04em", textTransform: "uppercase" as const }}>
            {role}
        </span>
    );
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
    const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return (
        <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
            {initials}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function WorkspaceSettingsClient(props: Props) {
    const {
        workspaceId, initialName, initialDescription, initialLogo,
        initialIndustry, initialTimezone,
        memberCount, feedbackCount, reportCount, createdAt,
        isOwner, canManageSettings, currentUserName, currentUserEmail, currentUserRole,
        members: initialMembers,
    } = props;

    const router = useRouter();
    const [tab, setTab] = useState<Tab>("general");

    // ── General state ─────────────────────────────────────────
    const [wsName, setWsName] = useState(initialName);
    const [savedName, setSavedName] = useState(initialName); // tracks the last-saved name for display
    const [wsDesc, setWsDesc] = useState(initialDescription ?? "");
    const [wsIndustry, setWsIndustry] = useState(initialIndustry ?? "");
    const [wsTz, setWsTz] = useState(initialTimezone ?? "UTC");
    const [wsLogo, setWsLogo] = useState(initialLogo ?? "");
    const [wsSaving, setWsSaving] = useState(false);
    const [wsMsg, setWsMsg] = useState("");
    const [wsErr, setWsErr] = useState("");
    const logoInputRef = useRef<HTMLInputElement>(null);

    function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 500 * 1024) { setWsErr("Logo must be under 500 KB."); return; }
        const reader = new FileReader();
        reader.onload = (ev) => setWsLogo(ev.target?.result as string ?? "");
        reader.readAsDataURL(file);
    }

    async function handleGeneralSave(e: React.FormEvent) {
        e.preventDefault();
        setWsMsg(""); setWsErr("");
        if (wsName.trim().length < 2) { setWsErr("Name must be at least 2 characters."); return; }
        setWsSaving(true);
        const res = await fetch("/api/workspace", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: wsName.trim(), description: wsDesc.trim(), logo: wsLogo, industry: wsIndustry, timezone: wsTz }),
        });
        const data = await res.json().catch(() => ({}));
        setWsSaving(false);
        if (!res.ok) { setWsErr(data.error ?? "Failed to save."); return; }
        // Update the display name to the saved value immediately
        setSavedName(wsName.trim());
        setWsMsg("✓ Workspace settings saved.");
        router.refresh();
        setTimeout(() => setWsMsg(""), 3000);
    }

    // ── Members state ─────────────────────────────────────────
    const [members, setMembers] = useState<Member[]>(initialMembers);
    const [memberBusy, setMemberBusy] = useState<string | null>(null);
    const [memberErr, setMemberErr] = useState("");

    function handleInviteSuccess(m: Member) { setMembers((prev) => [...prev, m]); router.refresh(); }

    async function updateRole(memberId: string, role: string) {
        setMemberBusy(memberId); setMemberErr("");
        const res = await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId, role }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) setMemberErr(data.error ?? "Failed to update role.");
        else setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role } : m));
        setMemberBusy(null);
    }

    async function removeMember(memberId: string, name: string) {
        if (!confirm(`Remove ${name} from the workspace?`)) return;
        setMemberBusy(memberId); setMemberErr("");
        const res = await fetch(`/api/users?memberId=${memberId}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) setMemberErr(data.error ?? "Failed to remove.");
        else setMembers((prev) => prev.filter((m) => m.id !== memberId));
        setMemberBusy(null);
    }

    // ── Profile state ─────────────────────────────────────────
    const [pName, setPName] = useState(currentUserName);
    const [curPwd, setCurPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [cfmPwd, setCfmPwd] = useState("");
    const [pSaving, setPSaving] = useState(false);
    const [pMsg, setPMsg] = useState("");
    const [pErr, setPErr] = useState("");

    async function handleProfileSave(e: React.FormEvent) {
        e.preventDefault();
        setPMsg(""); setPErr("");
        const payload: Record<string, string> = {};
        if (pName.trim() !== currentUserName) payload.name = pName.trim();
        if (newPwd) {
            if (newPwd.length < 8) { setPErr("New password must be at least 8 characters."); return; }
            if (newPwd !== cfmPwd) { setPErr("Passwords don't match."); return; }
            if (!curPwd) { setPErr("Enter your current password."); return; }
            payload.currentPassword = curPwd;
            payload.newPassword = newPwd;
        }
        if (!Object.keys(payload).length) { setPErr("Nothing changed."); return; }
        setPSaving(true);
        const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await res.json().catch(() => ({}));
        setPSaving(false);
        if (!res.ok) { setPErr(data.error ?? "Failed to save."); return; }
        setPMsg("✓ Profile updated.");
        setCurPwd(""); setNewPwd(""); setCfmPwd("");
        router.refresh();
        setTimeout(() => setPMsg(""), 4000);
    }

    // ── Delete state ──────────────────────────────────────────
    const [delPhase, setDelPhase] = useState<"idle" | "confirm" | "deleting">("idle");
    const [delInput, setDelInput] = useState("");
    const [delErr, setDelErr] = useState("");
    const [copied, setCopied] = useState(false);

    async function copyId() {
        await navigator.clipboard.writeText(workspaceId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    async function handleDelete() {
        if (delInput !== initialName) { setDelErr("Workspace name doesn't match."); return; }
        setDelPhase("deleting");
        const res = await fetch("/api/workspace", { method: "DELETE" });
        if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            setDelErr(d.error ?? "Failed to delete."); setDelPhase("confirm"); return;
        }
        await signOut({ redirect: false });
        router.push("/login");
    }

    const TABS: { key: Tab; label: string }[] = [
        { key: "general", label: "⚙️ General" },
        { key: "members", label: "👥 Members" },
        { key: "roles", label: "🔑 Roles" },
        { key: "security", label: "🔒 Security" },
    ];

    return (
        <div>
            {/* Stats strip */}
            <div className="ws-stats-strip">
                {[
                    { icon: "👥", val: memberCount, lbl: "Members" },
                    { icon: "💬", val: feedbackCount, lbl: "Feedback" },
                    { icon: "📄", val: reportCount, lbl: "Reports" },
                    { icon: "📅", val: new Date(createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }), lbl: "Created" },
                ].map(({ icon, val, lbl }) => (
                    <div key={lbl} className="ws-stat-item">
                        <div className="ws-stat-icon">{icon}</div>
                        <div className="ws-stat-val">{val}</div>
                        <div className="ws-stat-lbl">{lbl}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="ws-settings-tabs">
                {TABS.map((t) => (
                    <button key={t.key} type="button" className={`ws-tab-btn${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── TAB: GENERAL ─────────────────────────────────── */}
            {tab === "general" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "680px" }}>

                    {/* Workspace settings */}
                    {canManageSettings && (
                        <div className="ws-section">
                            <h2>🏢 Workspace Settings</h2>
                            <form onSubmit={handleGeneralSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                                {/* Logo */}
                                <div className="ws-field">
                                    <span className="ws-label">Workspace Logo</span>
                                    <div className="ws-logo-wrap">
                                        <div className="ws-logo-preview">
                                            {wsLogo
                                                ? <img src={wsLogo} alt="Logo" />
                                                : <span>🏢</span>
                                            }
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            <button type="button" className="ws-logo-upload-btn" onClick={() => logoInputRef.current?.click()}>
                                                📁 Upload Logo
                                            </button>
                                            {wsLogo && (
                                                <button type="button" onClick={() => setWsLogo("")} style={{ padding: "7px 14px", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", background: "transparent", color: "#f87171", fontSize: "12px", cursor: "pointer" }}>
                                                    ✕ Remove
                                                </button>
                                            )}
                                            <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>PNG, JPG — max 500 KB</p>
                                        </div>
                                        <input ref={logoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoFile} />
                                    </div>
                                </div>

                                {/* Name + Description */}
                                <div className="ws-field">
                                    <label className="ws-label" htmlFor="ws-name">Workspace Name *</label>
                                    <input id="ws-name" className="ws-input" value={wsName} onChange={(e) => setWsName(e.target.value)} maxLength={80} required />
                                </div>
                                <div className="ws-field">
                                    <label className="ws-label" htmlFor="ws-desc">Description</label>
                                    <textarea id="ws-desc" className="ws-input ws-textarea" value={wsDesc} onChange={(e) => setWsDesc(e.target.value)} maxLength={300} rows={3} placeholder="Brief description of your workspace…" />
                                </div>

                                {/* Industry + Timezone */}
                                <div className="ws-grid2">
                                    <div className="ws-field">
                                        <label className="ws-label" htmlFor="ws-industry">Industry</label>
                                        <select id="ws-industry" className="ws-input ws-select" value={wsIndustry} onChange={(e) => setWsIndustry(e.target.value)}>
                                            <option value="">— Select Industry —</option>
                                            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                                        </select>
                                    </div>
                                    <div className="ws-field">
                                        <label className="ws-label" htmlFor="ws-tz">Timezone</label>
                                        <select id="ws-tz" className="ws-input ws-select" value={wsTz} onChange={(e) => setWsTz(e.target.value)}>
                                            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {wsErr && <div className="ws-error">⚠️ {wsErr}</div>}
                                {wsMsg && <div className="ws-success">{wsMsg}</div>}

                                <button type="submit" className="ws-save-btn" disabled={wsSaving}>
                                    {wsSaving ? "⏳ Saving…" : "💾 Save Settings"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* My Profile */}
                    <div className="ws-section">
                        <h2>👤 My Profile</h2>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", paddingBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <Avatar name={currentUserName} size={48} />
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "15px", margin: "0 0 3px" }}>{currentUserName}</p>
                                <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>{currentUserEmail}</p>
                            </div>
                            <RolePill role={currentUserRole} />
                        </div>
                        <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div className="ws-field">
                                <label className="ws-label" htmlFor="p-name">Display Name</label>
                                <input id="p-name" className="ws-input" value={pName} onChange={(e) => setPName(e.target.value)} maxLength={60} required />
                            </div>
                            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px" }}>
                                <p style={{ fontSize: "12px", color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "12px" }}>Change Password</p>
                                <div className="ws-grid2" style={{ gap: "10px" }}>
                                    <div className="ws-field">
                                        <label className="ws-label" htmlFor="p-cur">Current Password</label>
                                        <input id="p-cur" className="ws-input" type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} placeholder="Current password" />
                                    </div>
                                    <div className="ws-field">
                                        <label className="ws-label" htmlFor="p-new">New Password</label>
                                        <input id="p-new" className="ws-input" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Min 8 chars" />
                                    </div>
                                </div>
                                <div className="ws-field" style={{ marginTop: "10px" }}>
                                    <label className="ws-label" htmlFor="p-cfm">Confirm New Password</label>
                                    <input id="p-cfm" className="ws-input" type="password" value={cfmPwd} onChange={(e) => setCfmPwd(e.target.value)} placeholder="Repeat new password" />
                                </div>
                            </div>
                            {pErr && <div className="ws-error">⚠️ {pErr}</div>}
                            {pMsg && <div className="ws-success">{pMsg}</div>}
                            <button type="submit" className="ws-save-btn" disabled={pSaving}>
                                {pSaving ? "⏳ Saving…" : "💾 Save Profile"}
                            </button>
                        </form>
                    </div>

                    {/* Workspace Info */}
                    <div className="ws-section">
                        <h2>🔑 Workspace Info</h2>
                        {[
                            { label: "Workspace ID", value: workspaceId, mono: true, copyable: true },
                            { label: "Workspace Name", value: savedName || "—", mono: false, copyable: false },
                            { label: "Industry", value: initialIndustry || "—", mono: false, copyable: false },
                            { label: "Timezone", value: initialTimezone || "UTC", mono: false, copyable: false },
                            { label: "Your Role", value: currentUserRole, mono: false, copyable: false },
                        ].map(({ label, value, mono, copyable }) => (
                            <div key={label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 16px", background: "rgba(255,255,255,.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,.06)" }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: "10px", color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 3px" }}>{label}</p>
                                    <p style={{ fontSize: "13px", color: "#94a3b8", fontFamily: mono ? "monospace" : "inherit", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
                                </div>
                                {copyable && (
                                    <button type="button" onClick={copyId} style={{ padding: "5px 12px", borderRadius: "7px", border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: copied ? "#4ade80" : "#64748b", fontSize: "12px", cursor: "pointer", flexShrink: 0 }}>
                                        {copied ? "✓ Copied" : "Copy"}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── TAB: MEMBERS ─────────────────────────────────── */}
            {tab === "members" && (
                <div style={{ maxWidth: "800px" }}>
                    <div className="ws-section">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                            <div>
                                <h2>👥 Members</h2>
                                <p className="ws-section-sub">{members.length} member{members.length !== 1 ? "s" : ""} in this workspace</p>
                            </div>
                            {canManageSettings && <InviteModal onSuccess={handleInviteSuccess} />}
                        </div>

                        {memberErr && <div className="ws-error">⚠️ {memberErr}</div>}

                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
                                <thead>
                                    <tr>
                                        {["Member", "Email", "Role", "Joined", ...(canManageSettings ? ["Actions"] : [])].map((h) => (
                                            <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid rgba(255,255,255,.07)" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map((m) => {
                                        const isBusy = memberBusy === m.id;
                                        return (
                                            <tr key={m.id} style={{ opacity: isBusy ? 0.5 : 1 }}>
                                                <td style={{ padding: "12px 14px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                        <Avatar name={m.name} size={32} />
                                                        <span style={{ fontWeight: 600, color: "#e2e8f0", fontSize: "13px" }}>{m.name}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "12px 14px", color: "#64748b", fontSize: "13px" }}>{m.email}</td>
                                                <td style={{ padding: "12px 14px" }}><RolePill role={m.role} /></td>
                                                <td style={{ padding: "12px 14px", color: "#475569", fontSize: "12px" }}>
                                                    {new Date(m.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                </td>
                                                {canManageSettings && (
                                                    <td style={{ padding: "12px 14px" }}>
                                                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                            <select
                                                                value={m.role}
                                                                disabled={isBusy}
                                                                onChange={(e) => updateRole(m.id, e.target.value)}
                                                                style={{ padding: "5px 10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.05)", color: "#94a3b8", fontSize: "12px", outline: "none", cursor: "pointer" }}
                                                            >
                                                                <option value="ADMIN">Admin</option>
                                                                <option value="ANALYST">Analyst</option>
                                                                <option value="VIEWER">Viewer</option>
                                                            </select>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeMember(m.id, m.name)}
                                                                disabled={isBusy}
                                                                style={{ padding: "5px 12px", borderRadius: "8px", border: "1px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.08)", color: "#f87171", fontSize: "12px", cursor: "pointer" }}
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB: ROLES ───────────────────────────────────── */}
            {tab === "roles" && (
                <div style={{ maxWidth: "800px" }}>
                    <div className="ws-section">
                        <h2>🔑 Role Permissions</h2>
                        <p className="ws-section-sub">Overview of what each role can do in this workspace.</p>
                        <div className="ws-role-grid">
                            {([
                                {
                                    role: "ADMIN", color: "#c4b5fd", bg: "rgba(124,58,237,.15)",
                                    desc: "Full control — manages workspace, members, and all features.",
                                    perms: [
                                        ["Manage Members & Roles", true],
                                        ["Workspace Settings", true],
                                        ["Delete Workspace", true],
                                        ["Upload & Edit Feedback", true],
                                        ["Run AI Analysis", true],
                                        ["Generate & Export Reports", true],
                                        ["Import Sample Channels", true],
                                        ["View Analytics", true],
                                    ] as [string, boolean][],
                                },
                                {
                                    role: "ANALYST", color: "#22d3ee", bg: "rgba(6,182,212,.15)",
                                    desc: "Works with feedback and AI — no workspace management.",
                                    perms: [
                                        ["Manage Members & Roles", false],
                                        ["Workspace Settings", false],
                                        ["Delete Workspace", false],
                                        ["Upload & Edit Feedback", true],
                                        ["Run AI Analysis", true],
                                        ["Generate & Export Reports", true],
                                        ["Import Sample Channels", true],
                                        ["View Analytics", true],
                                    ] as [string, boolean][],
                                },
                                {
                                    role: "VIEWER", color: "#94a3b8", bg: "rgba(100,116,139,.15)",
                                    desc: "Read-only access to feedback, analytics, and reports.",
                                    perms: [
                                        ["Manage Members & Roles", false],
                                        ["Workspace Settings", false],
                                        ["Delete Workspace", false],
                                        ["Upload & Edit Feedback", false],
                                        ["Run AI Analysis", false],
                                        ["Generate & Export Reports", false],
                                        ["Import Sample Channels", false],
                                        ["View Analytics", true],
                                    ] as [string, boolean][],
                                },
                            ]).map(({ role, color, bg, desc, perms }) => (
                                <div key={role} className="ws-role-card" style={{ borderColor: bg }}>
                                    <h3 style={{ color }}>
                                        {role === "ADMIN" ? "👑" : role === "ANALYST" ? "📊" : "👀"} {role}
                                    </h3>
                                    <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "14px", lineHeight: 1.5 }}>{desc}</p>
                                    {perms.map(([perm, allowed]) => (
                                        <div key={perm} className="ws-role-perm">
                                            <span className={allowed ? "ws-role-perm-yes" : "ws-role-perm-no"}>{allowed ? "✓" : "✗"}</span>
                                            <span style={{ color: allowed ? "#94a3b8" : "#334155" }}>{perm}</span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Member-role quick list */}
                    <div className="ws-section">
                        <h2>👥 Current Role Assignments</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {members.map((m) => (
                                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", background: "rgba(255,255,255,.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,.06)" }}>
                                    <Avatar name={m.name} size={32} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 600, color: "#e2e8f0", fontSize: "13px", margin: 0 }}>{m.name}</p>
                                        <p style={{ color: "#475569", fontSize: "11px", margin: 0 }}>{m.email}</p>
                                    </div>
                                    <RolePill role={m.role} />
                                </div>
                            ))}
                        </div>
                        {canManageSettings && (
                            <p style={{ fontSize: "12px", color: "#475569" }}>
                                To change roles, go to the{" "}
                                <button type="button" onClick={() => setTab("members")} style={{ background: "none", border: "none", color: "#06b6d4", cursor: "pointer", fontSize: "12px", padding: 0, textDecoration: "underline" }}>
                                    Members tab
                                </button>.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB: SECURITY ────────────────────────────────── */}
            {tab === "security" && (
                <div style={{ maxWidth: "680px", display: "flex", flexDirection: "column", gap: "20px" }}>

                    {/* Security overview */}
                    <div className="ws-section">
                        <h2>🔒 Workspace Security</h2>
                        <p className="ws-section-sub">Security settings and access control for your workspace.</p>

                        {[
                            {
                                icon: "🔑", title: "Password Authentication",
                                desc: "All members authenticate with email + password.",
                                status: "Active", statusColor: "#4ade80", statusBg: "rgba(34,197,94,0.12)",
                            },
                            {
                                icon: "👥", title: "Role-Based Access Control",
                                desc: "Three-tier RBAC: Admin, Analyst, Viewer — each with scoped permissions.",
                                status: "Active", statusColor: "#4ade80", statusBg: "rgba(34,197,94,0.12)",
                            },
                            {
                                icon: "🏢", title: "Workspace Isolation",
                                desc: "All data is scoped to this workspace. Other workspaces cannot access your feedback.",
                                status: "Active", statusColor: "#4ade80", statusBg: "rgba(34,197,94,0.12)",
                            },
                            {
                                icon: "🔐", title: "Secure API Routes",
                                desc: "Every API endpoint validates session and workspace membership before responding.",
                                status: "Active", statusColor: "#4ade80", statusBg: "rgba(34,197,94,0.12)",
                            },
                            {
                                icon: "📋", title: "Activity Logging",
                                desc: "Admin actions (invites, role changes, deletions) are recorded in the activity log.",
                                status: "Active", statusColor: "#4ade80", statusBg: "rgba(34,197,94,0.12)",
                            },
                        ].map(({ icon, title, desc, status, statusColor, statusBg }) => (
                            <div key={title} className="ws-security-item">
                                <div style={{ fontSize: "24px", flexShrink: 0 }}>{icon}</div>
                                <div className="ws-security-info" style={{ flex: 1 }}>
                                    <h4>{title}</h4>
                                    <p>{desc}</p>
                                </div>
                                <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: statusBg, color: statusColor, flexShrink: 0 }}>
                                    {status}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Change password */}
                    <div className="ws-section">
                        <h2>🔑 Change Password</h2>
                        <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div className="ws-field">
                                <label className="ws-label" htmlFor="sec-cur">Current Password</label>
                                <input id="sec-cur" className="ws-input" type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} placeholder="Enter current password" autoComplete="current-password" />
                            </div>
                            <div className="ws-grid2">
                                <div className="ws-field">
                                    <label className="ws-label" htmlFor="sec-new">New Password</label>
                                    <input id="sec-new" className="ws-input" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Min 8 characters" autoComplete="new-password" />
                                </div>
                                <div className="ws-field">
                                    <label className="ws-label" htmlFor="sec-cfm">Confirm Password</label>
                                    <input id="sec-cfm" className="ws-input" type="password" value={cfmPwd} onChange={(e) => setCfmPwd(e.target.value)} placeholder="Repeat password" autoComplete="new-password" />
                                </div>
                            </div>
                            {pErr && <div className="ws-error">⚠️ {pErr}</div>}
                            {pMsg && <div className="ws-success">{pMsg}</div>}
                            <button type="submit" className="ws-save-btn" disabled={pSaving}>
                                {pSaving ? "⏳ Updating…" : "🔑 Update Password"}
                            </button>
                        </form>
                    </div>

                    {/* Danger zone */}
                    {canManageSettings && (
                        <div className="ws-danger">
                            <h2>⚠️ Danger Zone</h2>
                            <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
                                Permanently deletes ALL feedback, themes, reports, embeddings, and members. This{" "}
                                <strong style={{ color: "#f87171" }}>cannot be undone</strong>.
                            </p>

                            {!isOwner && (
                                <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)", color: "#fbbf24", fontSize: "13px" }}>
                                    🔒 Only the workspace owner can delete it.
                                </div>
                            )}

                            {isOwner && delPhase === "idle" && (
                                <button type="button" onClick={() => setDelPhase("confirm")} style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.08)", color: "#fca5a5", fontSize: "13px", fontWeight: 600, cursor: "pointer", width: "fit-content" }}>
                                    🗑️ Delete Workspace
                                </button>
                            )}

                            {isOwner && delPhase === "confirm" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", color: "#fca5a5", fontSize: "13px", lineHeight: 1.6 }}>
                                        Type <strong style={{ color: "#f87171" }}>"{initialName}"</strong> to confirm deletion:
                                    </div>
                                    <input className="ws-input" style={{ borderColor: "rgba(239,68,68,.3)" }} value={delInput} onChange={(e) => { setDelInput(e.target.value); setDelErr(""); }} placeholder={initialName} />
                                    {delErr && <div className="ws-error">⚠️ {delErr}</div>}
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button type="button" onClick={handleDelete} disabled={delInput !== initialName} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: delInput === initialName ? "#dc2626" : "rgba(239,68,68,.2)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: delInput === initialName ? "pointer" : "not-allowed", opacity: delInput === initialName ? 1 : .5 }}>
                                            🗑️ Yes, delete permanently
                                        </button>
                                        <button type="button" onClick={() => { setDelPhase("idle"); setDelInput(""); setDelErr(""); }} style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "#64748b", fontSize: "13px", cursor: "pointer" }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                            {delPhase === "deleting" && <p style={{ color: "#f87171", fontSize: "13px" }}>⏳ Deleting workspace…</p>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
