/**
 * GET /api/themes/[id]
 *
 * Returns full detail for a single theme cluster identified by its name
 * (URL-encoded). Includes:
 *   - all fields from the list endpoint
 *   - monthlyVolume: [{month, count}] — last 7 months for the trend chart
 *   - related feedback (paginated, up to 20 items)
 *
 * Query params:
 *   range      - "7d" | "30d" | "90d" | "year" | "all"  (default "30d")
 *   sentiment  - "Positive" | "Neutral" | "Negative"     (optional)
 *   channel    - channel name                             (optional)
 *   page       - page number (default 1)
 *   limit      - items per page (default 20, max 50)
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";

function parseJsonArr(v: string | null | undefined): string[] {
    if (!v) return [];
    try { return JSON.parse(v) as string[]; } catch { return []; }
}

function mostCommon(arr: string[]): string {
    if (!arr.length) return "";
    const m: Record<string, number> = {};
    for (const s of arr) if (s) m[s] = (m[s] ?? 0) + 1;
    return Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "view-analytics")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const workspaceId = session.user.workspaceId;
    const { id } = await params;
    const themeName = decodeURIComponent(id);

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") ?? "30d";
    const sentiment = searchParams.get("sentiment") ?? "";
    const channel = searchParams.get("channel") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

    const now = new Date();

    function buildRangeStart(ref: Date, r: string): Date {
        const d = new Date(ref);
        switch (r) {
            case "7d": d.setDate(d.getDate() - 7); break;
            case "90d": d.setDate(d.getDate() - 90); break;
            case "year": return new Date(ref.getFullYear(), 0, 1);
            case "all": return new Date(2020, 0, 1);
            default: d.setDate(d.getDate() - 30); break;
        }
        d.setHours(0, 0, 0, 0);
        return d;
    }

    const currentStart = buildRangeStart(now, range);
    const spanMs = now.getTime() - currentStart.getTime();
    const priorEnd = new Date(currentStart.getTime() - 1);
    const priorStart = new Date(currentStart.getTime() - spanMs);

    // ── Fetch all feedback that contains this theme ────────────
    const allRows = await prisma.feedback.findMany({
        where: {
            workspaceId,
            status: "ANALYZED",
            createdAt: { gte: currentStart },
        },
        select: {
            id: true,
            content: true,
            sentiment: true,
            channel: true,
            customerLabel: true,
            topics: true,
            aiSummary: true,
            recommendations: true,
            featureArea: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });

    // Filter to rows that contain this theme in their topics
    const matchingRows = allRows.filter((r) =>
        parseJsonArr(r.topics).some((t) => t.trim() === themeName)
    );

    if (matchingRows.length === 0) {
        return NextResponse.json({ error: "Theme not found." }, { status: 404 });
    }

    // ── Prior period count for trend ──────────────────────────
    const priorRows = await prisma.feedback.findMany({
        where: {
            workspaceId,
            status: "ANALYZED",
            createdAt: { gte: priorStart, lte: priorEnd },
        },
        select: { topics: true },
    });
    const priorCount = priorRows.filter((r) =>
        parseJsonArr(r.topics).some((t) => t.trim() === themeName)
    ).length;

    const currentCount = matchingRows.length;
    let trendPct = 0;
    if (priorCount > 0) {
        trendPct = Math.round(((currentCount - priorCount) / priorCount) * 100);
    } else if (currentCount > 0) {
        trendPct = 100;
    }
    const trendLabel =
        trendPct > 0 ? `↑ +${trendPct}%`
            : trendPct < 0 ? `↓ ${trendPct}%`
                : "→ 0%";
    const status =
        trendPct >= 20 ? "Trending"
            : trendPct <= -10 ? "Declining"
                : "Active";

    // ── Sentiment breakdown ───────────────────────────────────
    const positive = matchingRows.filter((r) => r.sentiment === "Positive").length;
    const neutral = matchingRows.filter((r) => r.sentiment === "Neutral").length;
    const negative = matchingRows.filter((r) => r.sentiment === "Negative").length;

    // ── AI summary & recommendation ───────────────────────────
    const summaries = matchingRows.flatMap((r) => r.aiSummary ? [r.aiSummary] : []);
    const recs = matchingRows.flatMap((r) => parseJsonArr(r.recommendations));
    const aiSummary = mostCommon(summaries);
    const recommendation = mostCommon(recs);
    const featureArea = mostCommon(matchingRows.flatMap((r) => r.featureArea ? [r.featureArea] : []));

    // ── Monthly volume (last 7 months) for trend chart ────────
    const sevenMonthsAgo = new Date(now);
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 6);
    sevenMonthsAgo.setDate(1);
    sevenMonthsAgo.setHours(0, 0, 0, 0);

    const allForChart = await prisma.feedback.findMany({
        where: {
            workspaceId,
            status: "ANALYZED",
            createdAt: { gte: sevenMonthsAgo },
        },
        select: { topics: true, createdAt: true },
    });

    const monthMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        monthMap[d.toLocaleString("default", { month: "short", year: "2-digit" })] = 0;
    }
    for (const r of allForChart) {
        if (parseJsonArr(r.topics).some((t) => t.trim() === themeName)) {
            const key = new Date(r.createdAt).toLocaleString("default", { month: "short", year: "2-digit" });
            if (key in monthMap) monthMap[key]++;
        }
    }
    const monthlyVolume = Object.entries(monthMap).map(([month, count]) => ({ month, count }));

    // ── Paginated related feedback (with optional filters) ────
    let filtered = matchingRows;
    if (sentiment) filtered = filtered.filter((r) => r.sentiment === sentiment);
    if (channel) filtered = filtered.filter((r) => r.channel === channel);

    const totalFiltered = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit).map((r) => ({
        id: r.id,
        content: r.content,
        sentiment: r.sentiment,
        channel: r.channel,
        customerLabel: r.customerLabel,
        createdAt: r.createdAt.toISOString(),
    }));

    // ── Unique channels in this theme ─────────────────────────
    const channels = [...new Set(matchingRows.map((r) => r.channel))].sort();

    return NextResponse.json({
        name: themeName,
        count: currentCount,
        positive,
        neutral,
        negative,
        trendPct,
        trendLabel,
        status,
        aiSummary,
        recommendation,
        featureArea,
        monthlyVolume,
        channels,
        relatedFeedback: paginated,
        totalFeedback: totalFiltered,
        pages: Math.ceil(totalFiltered / limit),
        page,
    });
}
