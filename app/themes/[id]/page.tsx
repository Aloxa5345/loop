"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ThemeDetails from "@/components/ThemeDetails";
import Link from "next/link";
import "../themes.css";

// ── Types ──────────────────────────────────────────────────────────────────
interface FeedbackItem {
    id: string;
    content: string;
    sentiment: string | null;
    channel: string;
    customerLabel: string;
    createdAt: string;
}

interface MonthPoint { month: string; count: number }

interface ThemeData {
    name: string;
    count: number;
    positive: number;
    neutral: number;
    negative: number;
    trendPct: number;
    trendLabel: string;
    status: string;
    aiSummary: string;
    recommendation: string;
    featureArea: string;
    monthlyVolume: MonthPoint[];
    channels: string[];
    relatedFeedback: FeedbackItem[];
    totalFeedback: number;
    pages: number;
    page: number;
}

function SkeletonBlock({ h = 120 }: { h?: number }) {
    return <div className="th-skeleton" style={{ height: h, borderRadius: 16, marginBottom: 4 }} />;
}

export default function ThemeDetailPage() {
    const params = useParams<{ id: string }>();
    const themeName = decodeURIComponent(params.id);

    const [data, setData] = useState<ThemeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [range, setRange] = useState("30d");
    const [sentiment, setSentiment] = useState("");
    const [channel, setChannel] = useState("");
    const [page, setPage] = useState(1);

    const fetchData = useCallback(async (r: string, s: string, ch: string, p: number) => {
        setLoading(true);
        const params = new URLSearchParams({ range: r, page: String(p), limit: "20" });
        if (s) params.set("sentiment", s);
        if (ch) params.set("channel", ch);
        const res = await fetch(`/api/themes/${encodeURIComponent(themeName)}?${params.toString()}`);
        if (res.status === 404) { setNotFound(true); setLoading(false); return; }
        if (res.ok) { setData(await res.json()); setNotFound(false); }
        setLoading(false);
    }, [themeName]);

    useEffect(() => { fetchData(range, sentiment, channel, page); }, [fetchData, range, sentiment, channel, page]);

    function handleRangeChange(r: string) { setRange(r); setPage(1); }
    function handleFilterChange(s: string, ch: string) {
        setSentiment(s);
        setChannel(ch);
        setPage(1);
    }

    // ── Not found ─────────────────────────────────────────────
    if (notFound) {
        return (
            <div className="dashboard">
                <Sidebar role="VIEWER" />
                <div className="main">
                    <div className="th-empty">
                        <div className="th-empty-icon">🏷️</div>
                        <h3>Theme not found</h3>
                        <p>No AI-classified feedback has been assigned to <strong style={{ color: "#e2e8f0" }}>{themeName}</strong> yet.</p>
                        <Link href="/themes" style={{ color: "#06b6d4", fontSize: "13px", marginTop: "12px", display: "inline-block", textDecoration: "none" }}>
                            ← Back to Themes
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            {/* Sidebar — role comes from session; use VIEWER as default since this is a client component.
                The server-side auth is handled by /app/themes/page.tsx's session check.
                For a full-page route the role isn't critical here — the API enforces RBAC. */}
            <Sidebar role="VIEWER" />
            <div className="main">

                {/* Breadcrumb */}
                <div style={{ marginBottom: "20px" }}>
                    <Link href="/themes" style={{ color: "#06b6d4", textDecoration: "none", fontSize: "13px" }}>
                        ← Theme Clustering
                    </Link>
                    <span style={{ color: "#475569", fontSize: "13px", margin: "0 8px" }}>/</span>
                    <span style={{ color: "#94a3b8", fontSize: "13px" }}>{themeName}</span>
                </div>

                {loading || !data ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <SkeletonBlock h={160} />
                        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px" }}>
                            <SkeletonBlock h={220} />
                            <SkeletonBlock h={220} />
                        </div>
                        <SkeletonBlock h={300} />
                    </div>
                ) : (
                    <ThemeDetails
                        {...data}
                        canRunAI={true}   /* API enforces the permission — safe to show buttons */
                        range={range}
                        onRangeChange={handleRangeChange}
                        onFilterChange={handleFilterChange}
                        onPageChange={setPage}
                        currentPage={page}
                    />
                )}
            </div>
        </div>
    );
}
