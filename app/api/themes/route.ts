/**
 * GET /api/themes
 *
 * Returns theme clusters derived from AI-classified feedback `topics`.
 * Each cluster includes:
 *   - name          : theme label
 *   - count         : total feedback mentioning this theme
 *   - positive/neutral/negative : sentiment breakdown
 *   - trend         : % change vs the prior equal-length period
 *   - trendLabel    : human-readable "↑ +18%" / "↓ -6%" / "→ 0%"
 *   - recentFeedback: up to 5 most recent matching feedback snippets
 *   - aiSummary     : most common summary for this theme
 *   - recommendation: most common recommendation for this theme
 *
 * Query params:
 *   q       - search term (theme name)
 *   range   - "7d" | "30d" | "90d" | "year" | "all"  (default "30d")
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
    const map: Record<string, number> = {};
    for (const s of arr) if (s) map[s] = (map[s] ?? 0) + 1;
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "view-analytics")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const workspaceId = session.user.workspaceId;
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
    const range = searchParams.get("range") ?? "30d";

    const now = new Date();

    // Build current-period start date
    function buildRangeStart(ref: Date, r: string): Date {
        const d = new Date(ref);
        switch (r) {
            case "7d": d.setDate(d.getDate() - 7); break;
            case "90d": d.setDate(d.getDate() - 90); break;
            case "year": return new Date(ref.getFullYear(), 0, 1);
            case "all": return new Date(2020, 0, 1);
            default: d.setDate(d.getDate() - 30); break;  // 30d
        }
        d.setHours(0, 0, 0, 0);
        return d;
    }

    const currentStart = buildRangeStart(now, range);

    // Prior period: same length immediately before currentStart
    const spanMs = now.getTime() - currentStart.getTime();
    const priorEnd = new Date(currentStart.getTime() - 1);
    const priorStart = new Date(currentStart.getTime() - spanMs);

    // Fetch all analyzed feedback for current + prior periods
    const [currentRows, priorRows] = await Promise.all([
        prisma.feedback.findMany({
            where: {
                workspaceId,
                status: "ANALYZED",
                createdAt: { gte: currentStart },
            },
            select: {
                id: true,
                content: true,
                sentiment: true,
                topics: true,
                aiSummary: true,
                recommendations: true,
                createdAt: true,
                customerLabel: true,
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.feedback.findMany({
            where: {
                workspaceId,
                status: "ANALYZED",
                createdAt: { gte: priorStart, lte: priorEnd },
            },
            select: { topics: true },
        }),
    ]);

    // ── Build current-period topic map ─────────────────────────
    type FeedbackRow = typeof currentRows[number];

    const themeMap = new Map<string, {
        count: number;
        positive: number;
        neutral: number;
        negative: number;
        rows: FeedbackRow[];
        summaries: string[];
        recs: string[];
    }>();

    for (const row of currentRows) {
        const topics = parseJsonArr(row.topics);
        for (const topic of topics) {
            if (!topic.trim()) continue;
            const key = topic.trim();
            if (!themeMap.has(key)) {
                themeMap.set(key, { count: 0, positive: 0, neutral: 0, negative: 0, rows: [], summaries: [], recs: [] });
            }
            const entry = themeMap.get(key)!;
            entry.count++;
            if (row.sentiment === "Positive") entry.positive++;
            else if (row.sentiment === "Negative") entry.negative++;
            else entry.neutral++;
            entry.rows.push(row);
            if (row.aiSummary) entry.summaries.push(row.aiSummary);
            for (const r of parseJsonArr(row.recommendations)) if (r) entry.recs.push(r);
        }
    }

    // ── Build prior-period count map ──────────────────────────
    const priorMap = new Map<string, number>();
    for (const row of priorRows) {
        for (const topic of parseJsonArr(row.topics)) {
            if (topic.trim()) priorMap.set(topic.trim(), (priorMap.get(topic.trim()) ?? 0) + 1);
        }
    }

    // ── Assemble theme list ───────────────────────────────────
    const themes = Array.from(themeMap.entries())
        .map(([name, data]) => {
            const prior = priorMap.get(name) ?? 0;
            let trendPct = 0;
            if (prior > 0) {
                trendPct = Math.round(((data.count - prior) / prior) * 100);
            } else if (data.count > 0) {
                trendPct = 100; // brand new theme this period
            }
            const trendLabel =
                trendPct > 0 ? `↑ +${trendPct}%`
                    : trendPct < 0 ? `↓ ${trendPct}%`
                        : "→ 0%";

            // Status label based on trend
            const status =
                trendPct >= 20 ? "Trending"
                    : trendPct <= -10 ? "Declining"
                        : "Active";

            // Up to 5 most-recent feedback snippets
            const recentFeedback = data.rows
                .slice(0, 5)
                .map((r) => ({
                    id: r.id,
                    content: r.content.length > 80 ? r.content.slice(0, 80) + "…" : r.content,
                    sentiment: r.sentiment ?? null,
                    customerLabel: r.customerLabel,
                    createdAt: r.createdAt.toISOString(),
                }));

            return {
                name,
                count: data.count,
                positive: data.positive,
                neutral: data.neutral,
                negative: data.negative,
                trendPct,
                trendLabel,
                status,
                aiSummary: mostCommon(data.summaries),
                recommendation: mostCommon(data.recs),
                recentFeedback,
            };
        })
        .sort((a, b) => b.count - a.count);

    // Apply search filter
    const filtered = q
        ? themes.filter((t) => t.name.toLowerCase().includes(q))
        : themes;

    return NextResponse.json({ themes: filtered, total: filtered.length });
}
