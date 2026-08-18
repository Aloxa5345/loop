import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "view-analytics")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const workspaceId = session.user.workspaceId;

    // Date boundaries
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);

    // Range filter
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") ?? "30d";
    const rangeStart = (() => {
        const d = new Date(now);
        switch (range) {
            case "7d": d.setDate(d.getDate() - 7); break;
            case "90d": d.setDate(d.getDate() - 90); break;
            case "year": return new Date(now.getFullYear(), 0, 1);
            case "all": return new Date(2020, 0, 1);
            default: d.setDate(d.getDate() - 30); break;
        }
        d.setHours(0, 0, 0, 0);
        return d;
    })();

    // ── Summary counts (scoped to selected date range) ────────
    const rangeFilter = { workspaceId, createdAt: { gte: rangeStart } };
    const [totalFeedback, positive, negative, neutral, newThisWeek, analyzed, members] = await Promise.all([
        prisma.feedback.count({ where: rangeFilter }),
        prisma.feedback.count({ where: { ...rangeFilter, sentiment: "Positive" } }),
        prisma.feedback.count({ where: { ...rangeFilter, sentiment: "Negative" } }),
        prisma.feedback.count({ where: { ...rangeFilter, sentiment: "Neutral" } }),
        prisma.feedback.count({ where: { workspaceId, createdAt: { gte: weekAgo } } }),
        prisma.feedback.count({ where: { ...rangeFilter, status: "ANALYZED" } }),
        prisma.workspaceMember.count({ where: { workspaceId } }),
    ]);

    const negativePercentage = totalFeedback > 0 ? Math.round((negative / totalFeedback) * 100) : 0;

    // ── Monthly volume (within selected range) ────────────────
    const allFeedback = await prisma.feedback.findMany({
        where: { workspaceId, createdAt: { gte: rangeStart } },
        select: { createdAt: true, sentiment: true, topics: true, keywords: true, aiSummary: true, recommendations: true },
        orderBy: { createdAt: "asc" },
    });

    // Build monthly buckets spanning from rangeStart → now
    const monthMap: Record<string, number> = {};
    const startMonth = new Date(rangeStart);
    startMonth.setDate(1); startMonth.setHours(0, 0, 0, 0);
    const endMonth = new Date(now);
    for (const d = new Date(startMonth); d <= endMonth; d.setMonth(d.getMonth() + 1)) {
        const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
        monthMap[key] = 0;
    }
    for (const f of allFeedback) {
        const key = new Date(f.createdAt).toLocaleString("default", { month: "short", year: "2-digit" });
        if (key in monthMap) monthMap[key]++;
    }
    const feedbackVolume = Object.entries(monthMap).map(([month, count]) => ({ month, count }));

    // ── Sentiment distribution ────────────────────────────────
    const sentimentDistribution = [
        { name: "Positive", value: positive, color: "#4ade80" },
        { name: "Neutral", value: neutral, color: "#fbbf24" },
        { name: "Negative", value: negative, color: "#f87171" },
    ];

    // ── Top topics ─────────────────────────────────────────────
    const topicMap: Record<string, number> = {};
    for (const f of allFeedback) {
        if (!f.topics) continue;
        try {
            const arr: string[] = JSON.parse(f.topics);
            for (const t of arr) topicMap[t] = (topicMap[t] ?? 0) + 1;
        } catch { /* skip */ }
    }
    const topThemes = Object.entries(topicMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([theme, count]) => ({ theme, count }));

    // ── Top keywords ──────────────────────────────────────────
    const kwMap: Record<string, number> = {};
    for (const f of allFeedback) {
        if (!f.keywords) continue;
        try {
            const arr: string[] = JSON.parse(f.keywords);
            for (const k of arr) kwMap[k] = (kwMap[k] ?? 0) + 1;
        } catch { /* skip */ }
    }
    const topKeyword = Object.entries(kwMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    // ── Top recommendations ────────────────────────────────────
    const recMap: Record<string, number> = {};
    for (const f of allFeedback) {
        if (!f.recommendations) continue;
        try {
            const arr: string[] = JSON.parse(f.recommendations);
            for (const r of arr) recMap[r] = (recMap[r] ?? 0) + 1;
        } catch { /* skip */ }
    }
    const topRec = Object.entries(recMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const topTheme = topThemes[0]?.theme ?? "—";

    // ── AI insights ────────────────────────────────────────────
    const aiInsights = {
        topTheme,
        mostRequestedFeature: topRec.length > 40 ? topRec.slice(0, 40) + "…" : topRec,
        highestSentiment: positive > negative ? "Positive" : negative > positive ? "Negative" : "Neutral",
        trendingIssue: topThemes[1]?.theme ?? topThemes[0]?.theme ?? "—",
        topKeyword,
        recommendation: topRec.length > 0 ? (topRec.length > 35 ? topRec.slice(0, 35) + "…" : topRec) : "Run AI analysis to generate recommendations",
    };

    // ── Recent feedback ────────────────────────────────────────
    const recentFeedback = await prisma.feedback.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
            id: true, customerLabel: true, sentiment: true,
            channel: true, content: true, createdAt: true, status: true,
        },
    });

    return NextResponse.json({
        summary: { totalFeedback, positive, negative, neutral, negativePercentage, newThisWeek, analyzed, unanalyzed: totalFeedback - analyzed, members },
        feedbackVolume,
        sentimentDistribution,
        topThemes,
        aiInsights,
        recentFeedback,
    });
}
