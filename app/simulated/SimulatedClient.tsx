"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Channel {
    id: string;
    icon: string;
    title: string;
    description: string;
    channel: string;
    endpoint: string;
    btnClass: string;
    badgeColor: string;
    badgeBg: string;
    preview: { customer: string; feedback: string }[];
}

const CHANNELS: Channel[] = [
    {
        id: "support",
        icon: "🎫",
        title: "Support Tickets",
        description: "25 realistic support ticket records covering login issues, payment failures, performance problems, and feature requests.",
        channel: "Support Ticket",
        endpoint: "/api/simulated/support",
        btnClass: "sim-btn-support",
        badgeColor: "#a5b4fc",
        badgeBg: "rgba(99,102,241,0.15)",
        preview: [
            { customer: "John", feedback: "Unable to login to my account" },
            { customer: "Sarah", feedback: "Payment failed during checkout" },
            { customer: "David", feedback: "Dashboard is loading very slowly" },
            { customer: "Emma", feedback: "Password reset email not arriving" },
            { customer: "Alex", feedback: "Export button is missing" },
        ],
    },
    {
        id: "appstore",
        icon: "📱",
        title: "App Store Reviews",
        description: "25 simulated app store reviews ranging from 1-star crash reports to 5-star praise for the AI and analytics features.",
        channel: "App Store",
        endpoint: "/api/simulated/appstore",
        btnClass: "sim-btn-appstore",
        badgeColor: "#22d3ee",
        badgeBg: "rgba(6,182,212,0.15)",
        preview: [
            { customer: "⭐⭐⭐⭐⭐ Premium", feedback: "Amazing dashboard! Clean, fast, intuitive." },
            { customer: "⭐⭐⭐⭐ Enterprise", feedback: "Fast and clean UI, loads instantly." },
            { customer: "⭐⭐⭐ Startup", feedback: "Good app but needs improvements." },
            { customer: "⭐⭐ Free User", feedback: "Notification bug is really annoying." },
            { customer: "⭐ Free User", feedback: "App crashes frequently." },
        ],
    },
    {
        id: "survey",
        icon: "📋",
        title: "Survey Responses",
        description: "25 survey responses from Enterprise, Startup, Premium, and Free tier customers on satisfaction, features, and pricing.",
        channel: "Survey",
        endpoint: "/api/simulated/survey",
        btnClass: "sim-btn-survey",
        badgeColor: "#6ee7b7",
        badgeBg: "rgba(16,185,129,0.15)",
        preview: [
            { customer: "Enterprise", feedback: "Excellent support from the team." },
            { customer: "Startup", feedback: "Better reporting features needed." },
            { customer: "Premium", feedback: "Love the AI features." },
            { customer: "Free User", feedback: "Need dark mode ASAP." },
            { customer: "VIP", feedback: "Overall satisfaction is very high." },
        ],
    },
    {
        id: "sales",
        icon: "💼",
        title: "Sales Notes",
        description: "25 sales notes from reps covering API integration requests, enterprise plan interest, pricing discussions, and deal status.",
        channel: "Sales Note",
        endpoint: "/api/simulated/sales",
        btnClass: "sim-btn-sales",
        badgeColor: "#fcd34d",
        badgeBg: "rgba(245,158,11,0.15)",
        preview: [
            { customer: "Alex", feedback: "Customer requested API integration." },
            { customer: "Sarah", feedback: "Interested in Enterprise Plan." },
            { customer: "Mike", feedback: "Wants custom dashboard." },
            { customer: "Kevin", feedback: "Asked about pricing for 50 seats." },
            { customer: "Lisa", feedback: "Requested live AI demo." },
        ],
    },
];

interface ImportState {
    loading: boolean;
    result: { success: boolean; message: string; records?: number } | null;
}

interface Props {
    canImport: boolean;
    canDelete: boolean;
}

export default function SimulatedClient({ canImport, canDelete }: Props) {
    const router = useRouter();

    const [states, setStates] = useState<Record<string, ImportState>>(
        Object.fromEntries(CHANNELS.map((c) => [c.id, { loading: false, result: null }]))
    );
    const [deleteState, setDeleteState] = useState<{
        loading: boolean;
        confirm: boolean;
        result: { success: boolean; message: string } | null;
    }>({ loading: false, confirm: false, result: null });

    async function handleImport(ch: Channel) {
        setStates((prev) => ({ ...prev, [ch.id]: { loading: true, result: null } }));
        try {
            const res = await fetch(ch.endpoint, { method: "POST" });
            const data = await res.json().catch(() => ({}));
            setStates((prev) => ({
                ...prev,
                [ch.id]: {
                    loading: false,
                    result: res.ok
                        ? { success: true, message: data.message, records: data.records }
                        : { success: false, message: data.error ?? "Import failed." },
                },
            }));
            if (res.ok) {
                router.refresh();
                // Auto-navigate to feedback page after 1.5 seconds
                setTimeout(() => {
                    router.push("/feedback");
                }, 1500);
            }
        } catch {
            setStates((prev) => ({
                ...prev,
                [ch.id]: { loading: false, result: { success: false, message: "Network error. Please try again." } },
            }));
        }
    }

    async function handleDelete() {
        setDeleteState((s) => ({ ...s, loading: true, result: null }));
        try {
            const res = await fetch("/api/simulated/clear", { method: "DELETE" });
            const data = await res.json().catch(() => ({}));
            setDeleteState({ loading: false, confirm: false, result: { success: res.ok, message: res.ok ? data.message : (data.error ?? "Delete failed.") } });
            if (res.ok) router.refresh();
        } catch {
            setDeleteState({ loading: false, confirm: false, result: { success: false, message: "Network error." } });
        }
    }

    return (
        <div>
            {/* Delete all demo data — Admin only */}
            {canDelete && (
                <div style={{
                    background: "rgba(239,68,68,0.07)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: "16px", padding: "20px 24px",
                    marginBottom: "28px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexWrap: "wrap", gap: "14px",
                }}>
                    <div>
                        <p style={{ fontWeight: 600, color: "#fca5a5", marginBottom: "2px" }}>🗑️ Delete All Demo Data</p>
                        <p style={{ fontSize: "13px", color: "#64748b" }}>
                            Permanently removes all simulated feedback from Support Ticket, App Store, Survey, and Sales Note channels.
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        {deleteState.result && (
                            <span style={{
                                fontSize: "13px",
                                color: deleteState.result.success ? "#6ee7b7" : "#fca5a5",
                            }}>
                                {deleteState.result.success ? "✅" : "❌"} {deleteState.result.message}
                            </span>
                        )}
                        {!deleteState.confirm ? (
                            <button
                                type="button"
                                onClick={() => setDeleteState((s) => ({ ...s, confirm: true }))}
                                style={{
                                    padding: "10px 20px", border: "1px solid rgba(239,68,68,0.4)",
                                    borderRadius: "10px", background: "rgba(239,68,68,0.12)",
                                    color: "#fca5a5", fontSize: "14px", fontWeight: 600,
                                    cursor: "pointer", transition: "0.25s",
                                }}
                            >
                                🗑️ Delete Demo Data
                            </button>
                        ) : (
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => setDeleteState((s) => ({ ...s, confirm: false }))}
                                    style={{
                                        padding: "10px 18px", border: "1px solid rgba(255,255,255,0.12)",
                                        borderRadius: "10px", background: "transparent",
                                        color: "#94a3b8", fontSize: "14px", cursor: "pointer",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleteState.loading}
                                    style={{
                                        padding: "10px 18px", border: "none",
                                        borderRadius: "10px", background: "linear-gradient(90deg,#ef4444,#dc2626)",
                                        color: "#fff", fontSize: "14px", fontWeight: 600,
                                        cursor: "pointer", opacity: deleteState.loading ? 0.55 : 1,
                                    }}
                                >
                                    {deleteState.loading ? "Deleting…" : "Confirm Delete"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Channel grid */}
            <div className="sim-grid">
                {CHANNELS.map((ch) => {
                    const state = states[ch.id];
                    return (
                        <div key={ch.id} className="sim-card">
                            <div className="sim-card-icon">{ch.icon}</div>

                            <div>
                                <h3>{ch.title}</h3>
                                <p>{ch.description}</p>
                            </div>

                            <div className="sim-card-meta">
                                <span className="sim-meta-badge" style={{ background: ch.badgeBg, color: ch.badgeColor }}>
                                    {ch.channel}
                                </span>
                                <span className="sim-meta-badge" style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>
                                    25 records
                                </span>
                                <span className="sim-meta-badge" style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24" }}>
                                    Pending
                                </span>
                            </div>

                            {/* Preview table */}
                            <div className="sim-card-preview">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Customer</th>
                                            <th>Feedback</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ch.preview.map((row, i) => (
                                            <tr key={i}>
                                                <td>{row.customer}</td>
                                                <td>{row.feedback}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Result */}
                            {state.result && (
                                <div className={`sim-result ${state.result.success ? "sim-result-success" : "sim-result-error"}`}>
                                    {state.result.success ? "✅" : "❌"} {state.result.message}
                                </div>
                            )}

                            {/* Import button — hidden for Viewers */}
                            {canImport ? (
                                <button
                                    type="button"
                                    className={`sim-import-btn ${ch.btnClass}`}
                                    onClick={() => handleImport(ch)}
                                    disabled={state.loading}
                                >
                                    {state.loading ? <>⏳ Importing…</> : <>{ch.icon} Import {ch.title}</>}
                                </button>
                            ) : (
                                <div style={{
                                    width: "100%", padding: "13px",
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                    borderRadius: "14px", textAlign: "center",
                                    color: "#475569", fontSize: "13px",
                                }}>
                                    🔒 Import requires Admin or Analyst role
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
