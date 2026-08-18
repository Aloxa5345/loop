"use client";

import { useState, useEffect, useCallback } from "react";
import DateFilter, { type DatePreset } from "@/components/DateFilter";
import ExportButtons from "@/components/ExportButtons";
import ReportsChart from "@/components/ReportsChart";

interface ByItem { label: string; count: number }
interface TopItem { topic: string; count: number }
interface KwItem { keyword: string; count: number }
interface RecItem { rec: string; count: number }

interface ReportData {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    unanalyzed: number;
    byChannel: { channel: string; count: number }[];
    byStatus: { status: string; count: number }[];
    topTopics: TopItem[];
    topKeywords: KwItem[];
    topRecommendations: RecItem[];
}

interface Schedule {
    id: string;
    email: string;
    frequency: string;
    format: string;
    hour: number;
    dayOfWeek: number | null;
    nextRun: string;
    active: boolean;
    createdBy?: { name: string };
}

interface Props {
    canExport: boolean;
    canSchedule: boolean;
    workspaceName: string;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ReportsClient({ canExport, canSchedule, workspaceName }: Props) {
    // ── Date filter state ──
    const [preset, setPreset] = useState<DatePreset>("30d");
    const [customFrom, setFrom] = useState("");
    const [customTo, setTo] = useState("");
    const [activeFrom, setActiveFrom] = useState("");
    const [activeTo, setActiveTo] = useState("");

    // ── Report data ──
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);

    // ── Schedules ──
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [schedEmail, setSchedEmail] = useState("");
    const [schedFreq, setSchedFreq] = useState("weekly");
    const [schedFormat, setSchedFormat] = useState("CSV");
    const [schedDay, setSchedDay] = useState(1);
    const [schedHour, setSchedHour] = useState(9);
    const [schedLoading, setSchedLoading] = useState(false);
    const [schedError, setSchedError] = useState("");
    const [schedSuccess, setSchedSuccess] = useState("");
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [sendingAll, setSendingAll] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (preset === "custom" && activeFrom && activeTo) {
            params.set("from", activeFrom);
            params.set("to", activeTo);
        } else if (preset !== "custom") {
            params.set("preset", preset);
        }
        const res = await fetch(`/api/reports?${params.toString()}`);
        if (res.ok) {
            const json = await res.json().catch(() => ({}));
            setData(json);
            setActiveFrom(json.from?.slice(0, 10) ?? "");
            setActiveTo(json.to?.slice(0, 10) ?? "");
        }
        setLoading(false);
    }, [preset, activeFrom, activeTo]);

    const fetchSchedules = useCallback(async () => {
        const res = await fetch("/api/reports/schedule");
        if (res.ok) setSchedules(await res.json().catch(() => ({})));
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

    function handlePresetChange(p: DatePreset) {
        setPreset(p);
        if (p !== "custom") setActiveFrom(""); // will be set by API response
    }

    function handleApplyCustom() {
        if (customFrom && customTo) {
            setActiveFrom(customFrom);
            setActiveTo(customTo);
            fetchData();
        }
    }

    async function handleAddSchedule(e: React.FormEvent) {
        e.preventDefault();
        setSchedError(""); setSchedSuccess("");
        if (!schedEmail.includes("@")) { setSchedError("Enter a valid email."); return; }
        setSchedLoading(true);

        // 1. Create the schedule
        const res = await fetch("/api/reports/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: schedEmail, frequency: schedFreq,
                format: schedFormat, dayOfWeek: schedDay, hour: schedHour,
            }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            setSchedLoading(false);
            setSchedError(json.error ?? "Failed to create schedule.");
            return;
        }

        // 2. Send email immediately to the recipient + all workspace members
        const sendRes = await fetch("/api/reports/send-now", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: schedEmail }),
        });
        const sendJson = await sendRes.json().catch(() => ({}));

        setSchedLoading(false);

        if (sendRes.ok) {
            setSchedSuccess(
                `✅ Schedule created & report sent to ${sendJson.sent} recipient${sendJson.sent !== 1 ? "s" : ""}! Next auto-run: ${new Date(json.nextRun).toLocaleDateString()}`
            );
        } else {
            // Schedule created but email failed — show partial success
            setSchedSuccess(
                `✅ Schedule created (next run: ${new Date(json.nextRun).toLocaleDateString()}). ⚠️ Email not sent: ${sendJson.error ?? "Check SMTP_PASS in .env"}`
            );
        }

        setSchedEmail("");
        fetchSchedules();
    }

    // Send report NOW to a specific email + all workspace members
    async function handleSendNow(email: string, schedId: string) {
        setSendingId(schedId);
        const res = await fetch("/api/reports/send-now", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        const json = await res.json().catch(() => ({}));
        setSendingId(null);
        if (res.ok) {
            setSchedSuccess(`✅ Report sent to ${json.sent} recipient${json.sent !== 1 ? "s" : ""}!`);
        } else {
            setSchedError(`❌ Send failed: ${json.error ?? "Check SMTP_PASS in .env"}`);
        }
    }

    // Send report to ALL workspace members immediately (no schedule needed)
    async function handleSendToAllMembers() {
        setSendingAll(true);
        setSchedError(""); setSchedSuccess("");
        const res = await fetch("/api/reports/send-now", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),          // no extra email — just all members
        });
        const json = await res.json().catch(() => ({}));
        setSendingAll(false);
        if (res.ok) {
            setSchedSuccess(`✅ Report sent to all ${json.sent} workspace member${json.sent !== 1 ? "s" : ""}!`);
        } else {
            setSchedError(`❌ Send failed: ${json.error ?? "Check SMTP_PASS in .env"}`);
        }
    }

    async function handleDeleteSchedule(id: string) {
        await fetch(`/api/reports/schedule?id=${id}`, { method: "DELETE" });
        setSchedules((s) => s.filter((x) => x.id !== id));
    }

    const positivePct = data && data.total > 0 ? Math.round((data.positive / data.total) * 100) : 0;
    const neutralPct = data && data.total > 0 ? Math.round((data.neutral / data.total) * 100) : 0;
    const negativePct = data && data.total > 0 ? Math.round((data.negative / data.total) * 100) : 0;

    return (
        <div>
            {/* ── Date filter + export row ── */}
            <div className="rpt-no-print">
                <DateFilter
                    preset={preset}
                    from={customFrom}
                    to={customTo}
                    onPresetChange={handlePresetChange}
                    onFromChange={setFrom}
                    onToChange={setTo}
                    onApply={handleApplyCustom}
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "24px" }}>
                    <p style={{ color: "#64748b", fontSize: "13px" }}>
                        {activeFrom && activeTo
                            ? `${new Date(activeFrom).toLocaleDateString()} – ${new Date(activeTo).toLocaleDateString()}`
                            : ""}
                    </p>
                    <ExportButtons
                        preset={preset}
                        from={activeFrom}
                        to={activeTo}
                        canExport={canExport}
                    />
                </div>
            </div>

            {/* ── Stats cards ── */}
            {loading ? (
                <div className="rpt-stats">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} style={{
                            height: "90px", borderRadius: "18px",
                            background: "rgba(255,255,255,0.06)", animation: "shimmer 1.4s infinite",
                        }} />
                    ))}
                </div>
            ) : data && (
                <div className="rpt-stats">
                    <div className="rpt-stat">
                        <h5>📊 Total</h5>
                        <h2>{data.total.toLocaleString()}</h2>
                    </div>
                    <div className="rpt-stat positive">
                        <h5>😊 Positive</h5>
                        <h2>{data.positive.toLocaleString()}</h2>
                    </div>
                    <div className="rpt-stat neutral">
                        <h5>😐 Neutral</h5>
                        <h2>{data.neutral.toLocaleString()}</h2>
                    </div>
                    <div className="rpt-stat negative">
                        <h5>😞 Negative</h5>
                        <h2>{data.negative.toLocaleString()}</h2>
                    </div>
                    <div className="rpt-stat">
                        <h5>🔍 Unanalyzed</h5>
                        <h2>{data.unanalyzed.toLocaleString()}</h2>
                    </div>
                </div>
            )}

            {/* ── AI Insights summary panel ── */}
            {!loading && data && (
                <div className="rpt-section" style={{
                    background: "linear-gradient(135deg,rgba(37,99,235,0.1),rgba(124,58,237,0.1))",
                    border: "1px solid rgba(124,58,237,0.25)",
                }}>
                    <h2 className="rpt-section-title">🤖 AI Insights — {workspaceName}</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "18px" }}>
                        {[
                            { label: "Positive Feedback", value: `${positivePct}%`, accent: "#4ade80" },
                            { label: "Negative Feedback", value: `${negativePct}%`, accent: "#f87171" },
                            { label: "Neutral Feedback", value: `${neutralPct}%`, accent: "#fbbf24" },
                            { label: "Top Topic", value: data.topTopics[0]?.topic ?? "—", accent: "#22d3ee" },
                            { label: "Top Keyword", value: data.topKeywords[0]?.keyword ?? "—", accent: "#c4b5fd" },
                            { label: "Top Recommendation", value: (data.topRecommendations[0]?.rec ?? "—").slice(0, 28) + ((data.topRecommendations[0]?.rec?.length ?? 0) > 28 ? "…" : ""), accent: "#6ee7b7" },
                        ].map(({ label, value, accent }) => (
                            <div key={label}>
                                <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "5px" }}>{label}</p>
                                <p style={{ fontSize: "18px", fontWeight: 700, color: accent }}>{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Charts ── */}
            {!loading && data && (
                <div className="rpt-section">
                    <h2 className="rpt-section-title">📈 Charts & Analytics</h2>
                    <ReportsChart
                        sentimentCounts={{ positive: data.positive, neutral: data.neutral, negative: data.negative }}
                        byChannel={data.byChannel}
                        topTopics={data.topTopics}
                    />
                </div>
            )}

            {/* ── Top keywords + Recommendations ── */}
            {!loading && data && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>

                    <div className="rpt-section" style={{ marginBottom: 0 }}>
                        <h2 className="rpt-section-title">🔑 Top Keywords</h2>
                        {data.topKeywords.length === 0
                            ? <p style={{ color: "#475569", fontSize: "14px" }}>No keywords yet — run AI analysis on feedback.</p>
                            : <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {data.topKeywords.map(({ keyword, count }) => (
                                    <span key={keyword} style={{
                                        background: "rgba(6,182,212,0.1)", color: "#22d3ee",
                                        border: "1px solid rgba(6,182,212,0.2)", borderRadius: "8px",
                                        padding: "5px 12px", fontSize: "13px", fontFamily: "monospace", fontWeight: 500,
                                    }}>
                                        {keyword} <span style={{ color: "#475569", fontSize: "11px" }}>×{count}</span>
                                    </span>
                                ))}
                            </div>
                        }
                    </div>

                    <div className="rpt-section" style={{ marginBottom: 0 }}>
                        <h2 className="rpt-section-title">💡 AI Recommendations</h2>
                        {data.topRecommendations.length === 0
                            ? <p style={{ color: "#475569", fontSize: "14px" }}>No recommendations yet — run AI analysis on feedback.</p>
                            : <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                                {data.topRecommendations.map(({ rec, count }, i) => (
                                    <li key={rec} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                        <span style={{
                                            minWidth: "22px", height: "22px", borderRadius: "50%",
                                            background: "linear-gradient(135deg,#06b6d4,#10b981)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "11px", fontWeight: 700, color: "#fff", marginTop: "1px", flexShrink: 0,
                                        }}>{i + 1}</span>
                                        <span style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: 1.6 }}>
                                            {rec}
                                            <span style={{ marginLeft: "6px", color: "#475569", fontSize: "11px" }}>({count}×)</span>
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        }
                    </div>
                </div>
            )}

            {/* ── Email Schedule section ── */}
            <div className="rpt-section rpt-no-print">
                <h2 className="rpt-section-title">📧 Email Scheduled Reports</h2>

                {/* Send to all members instantly */}
                {canSchedule && (
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        flexWrap: "wrap", gap: "12px",
                        padding: "14px 18px",
                        background: "linear-gradient(135deg,rgba(6,182,212,0.07),rgba(79,70,229,0.07))",
                        border: "1px solid rgba(6,182,212,0.2)",
                        borderRadius: "12px",
                        marginBottom: "20px",
                    }}>
                        <div>
                            <p style={{ margin: 0, fontWeight: 600, color: "#e2e8f0", fontSize: "14px" }}>
                                📬 Send Report to All Members
                            </p>
                            <p style={{ margin: "3px 0 0", color: "#64748b", fontSize: "12px" }}>
                                Instantly emails the current report to every workspace member.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleSendToAllMembers}
                            disabled={sendingAll}
                            style={{
                                padding: "10px 22px", border: "none", borderRadius: "10px",
                                background: sendingAll
                                    ? "rgba(255,255,255,0.07)"
                                    : "linear-gradient(90deg,#06b6d4,#4f46e5)",
                                color: sendingAll ? "#64748b" : "#fff",
                                fontSize: "13px", fontWeight: 600,
                                cursor: sendingAll ? "not-allowed" : "pointer",
                                whiteSpace: "nowrap" as const,
                                transition: "opacity .2s",
                            }}
                        >
                            {sendingAll ? "⏳ Sending…" : "📤 Send Now to All Members"}
                        </button>
                    </div>
                )}

                {canSchedule ? (
                    <form onSubmit={handleAddSchedule}>
                        <div className="rpt-form-grid">
                            <div className="rpt-field">
                                <label htmlFor="sched-email">Recipient Email</label>
                                <input
                                    id="sched-email"
                                    type="email"
                                    className="rpt-input"
                                    value={schedEmail}
                                    onChange={(e) => setSchedEmail(e.target.value)}
                                    placeholder="admin@company.com"
                                    required
                                />
                            </div>
                            <div className="rpt-field">
                                <label htmlFor="sched-freq">Frequency</label>
                                <select id="sched-freq" className="rpt-select" value={schedFreq} onChange={(e) => setSchedFreq(e.target.value)}>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                            <div className="rpt-field">
                                <label htmlFor="sched-format">Report Format</label>
                                <select id="sched-format" className="rpt-select" value={schedFormat} onChange={(e) => setSchedFormat(e.target.value)}>
                                    <option value="CSV">CSV</option>
                                    <option value="Excel">Excel</option>
                                    <option value="PDF">PDF</option>
                                </select>
                            </div>
                            {schedFreq === "weekly" && (
                                <div className="rpt-field">
                                    <label htmlFor="sched-day">Day of Week</label>
                                    <select id="sched-day" className="rpt-select" value={schedDay} onChange={(e) => setSchedDay(Number(e.target.value))}>
                                        {DAY_NAMES.map((d, i) => <option key={d} value={i}>{d}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="rpt-field">
                                <label htmlFor="sched-hour">Send Time</label>
                                <select id="sched-hour" className="rpt-select" value={schedHour} onChange={(e) => setSchedHour(Number(e.target.value))}>
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>
                                            {String(i).padStart(2, "0")}:00 {i < 12 ? "AM" : "PM"}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {schedError && <p style={{ color: "#fca5a5", fontSize: "13px", marginBottom: "12px" }}>❌ {schedError}</p>}
                        {schedSuccess && <p style={{ color: "#6ee7b7", fontSize: "13px", marginBottom: "12px" }}>{schedSuccess}</p>}

                        <button
                            type="submit"
                            disabled={schedLoading}
                            style={{
                                padding: "12px 28px", border: "none", borderRadius: "12px",
                                background: "linear-gradient(90deg,#06b6d4,#4f46e5,#7c3aed)",
                                color: "#fff", fontSize: "14px", fontWeight: 600,
                                cursor: schedLoading ? "not-allowed" : "pointer",
                                opacity: schedLoading ? .6 : 1,
                            }}
                        >
                            {schedLoading ? "⏳ Saving & Sending…" : "📧 Add Schedule & Send Report"}
                        </button>
                    </form>
                ) : (
                    <div style={{
                        background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
                        borderRadius: "12px", padding: "14px 18px", color: "#fbbf24", fontSize: "14px",
                        display: "flex", gap: "10px", alignItems: "center",
                    }}>
                        <span>🔒</span>
                        <span>Scheduling email reports requires <strong>Admin</strong> role.</span>
                    </div>
                )}

                {/* Existing schedules table */}
                {schedules.length > 0 && (
                    <div style={{ marginTop: "24px" }}>
                        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>
                            Active Schedules ({schedules.length})
                        </p>
                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", overflow: "hidden" }}>
                            <table className="rpt-schedule-table">
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Frequency</th>
                                        <th>Format</th>
                                        <th>Next Run</th>
                                        <th>Created by</th>
                                        {canSchedule && <th></th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedules.map((s) => (
                                        <tr key={s.id}>
                                            <td>{s.email}</td>
                                            <td style={{ textTransform: "capitalize" }}>
                                                {s.frequency}{s.frequency === "weekly" && s.dayOfWeek !== null ? ` (${DAY_NAMES[s.dayOfWeek]})` : ""}
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                                                    background: s.format === "CSV" ? "rgba(16,185,129,0.15)" : s.format === "Excel" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                                                    color: s.format === "CSV" ? "#6ee7b7" : s.format === "Excel" ? "#fcd34d" : "#fca5a5",
                                                }}>
                                                    {s.format}
                                                </span>
                                            </td>
                                            <td>{new Date(s.nextRun).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                                            <td style={{ color: "#64748b" }}>{s.createdBy?.name ?? "—"}</td>
                                            {canSchedule && (
                                                <td>
                                                    <div style={{ display: "flex", gap: "6px" }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSendNow(s.email, s.id)}
                                                            disabled={sendingId === s.id}
                                                            title="Send report now to this email + all workspace members"
                                                            style={{
                                                                padding: "5px 12px", border: "1px solid rgba(6,182,212,0.3)",
                                                                borderRadius: "7px", background: "rgba(6,182,212,0.1)",
                                                                color: "#22d3ee", fontSize: "12px", cursor: "pointer",
                                                                opacity: sendingId === s.id ? .5 : 1,
                                                            }}
                                                        >
                                                            {sendingId === s.id ? "⏳" : "📤 Send Now"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteSchedule(s.id)}
                                                            style={{
                                                                padding: "5px 12px", border: "1px solid rgba(239,68,68,0.3)",
                                                                borderRadius: "7px", background: "rgba(239,68,68,0.1)",
                                                                color: "#fca5a5", fontSize: "12px", cursor: "pointer",
                                                            }}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Empty state ── */}
            {!loading && data && data.total === 0 && (
                <div style={{
                    textAlign: "center", padding: "48px 24px",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "18px", color: "#475569", marginBottom: "24px",
                }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
                    <h3 style={{ color: "#94a3b8", marginBottom: "8px" }}>No data for this period</h3>
                    <p style={{ fontSize: "14px" }}>Try a wider date range or import some feedback first.</p>
                </div>
            )}
        </div>
    );
}
