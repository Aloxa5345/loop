/**
 * vocReport.ts
 *
 * Builds the structured VoC (Voice of Customer) report JSON from raw
 * feedback data. All computation is done locally — no AI API required,
 * so it works regardless of billing status.
 *
 * When Claude is available, the calling code can optionally augment
 * the executiveSummary and recommendations sections.
 */

import type { ReportData } from "@/app/lib/reportData";

export interface VocThemeRow {
    theme: string;
    count: number;
    trend: "↑" | "↓" | "→";
}

export interface VocSentimentRow {
    label: string;
    count: number;
    pct: number;
    color: string;
}

export interface VocQuote {
    content: string;
    sentiment: string | null;
    channel: string;
    customerLabel: string;
    /** Star rating 1–5 derived from sentiment */
    stars: number;
}

export interface VocRecommendation {
    priority: "High" | "Medium" | "Low";
    action: string;
    count: number;
}

export interface VocSentimentTrendPoint {
    month: string;   // e.g. "Jan", "Feb"
    positive: number;
    neutral: number;
    negative: number;
    positivePct: number;
}

export interface VocSentimentChange {
    label: string;
    currentPct: number;
    prevPct: number;
    delta: number;
    trend: "↑" | "↓" | "→";
    color: string;
}

export interface VocReportJson {
    workspaceName: string;
    periodStart: string;
    periodEnd: string;
    generatedAt: string;

    summary: {
        totalFeedback: number;
        positive: number;
        neutral: number;
        negative: number;
        unanalyzed: number;
        positivePct: number;
        neutralPct: number;
        negativePct: number;
        /** 0–100 composite health score */
        healthScore: number;
        /** "Excellent" | "Good" | "Fair" | "Poor" */
        healthLabel: string;
        keyInsight: string;
        /** 5-bullet AI narrative (or rule-based fallback) */
        aiSummary: string[];
    };

    topThemes: VocThemeRow[];
    sentimentBreakdown: VocSentimentRow[];
    customerQuotes: VocQuote[];
    recommendations: VocRecommendation[];
    topKeywords: string[];
    byChannel: { channel: string; count: number }[];
    sentimentTrend: VocSentimentTrendPoint[];
    sentimentChanges: VocSentimentChange[];
}

function pct(part: number, total: number): number {
    return total === 0 ? 0 : Math.round((part / total) * 100);
}

/**
 * Assign a trend indicator based on position in the ranked list.
 * Top third: ↑, bottom third: ↓, middle: →
 */
function trendFor(index: number, total: number): "↑" | "↓" | "→" {
    const third = Math.ceil(total / 3);
    if (index < third) return "↑";
    if (index >= total - third) return "↓";
    return "→";
}

/**
 * Compute a 0–100 health score from sentiment percentages.
 * Formula: positive contributes positively, negative drags it down.
 */
function computeHealth(posPct: number, negPct: number): { score: number; label: string } {
    const score = Math.round(Math.max(0, Math.min(100, posPct - negPct * 1.5 + 50)));
    const label =
        score >= 80 ? "Excellent" :
            score >= 60 ? "Good" :
                score >= 40 ? "Fair" : "Poor";
    return { score, label };
}

/**
 * Generate a 5-bullet AI narrative summary from the data.
 * Used when Claude is unavailable (rule-based).
 */
function buildAiSummary(data: ReportData, posPct: number, negPct: number): string[] {
    const total = data.total;
    if (total === 0) return ["No feedback was collected during this period."];

    const topTopic = data.topTopics[0]?.topic ?? "general topics";
    const topTopic2 = data.topTopics[1]?.topic;
    const topRec = data.topRecommendations[0]?.rec;
    const topChannel = data.byChannel[0]?.channel;

    const bullets: string[] = [];

    // 1 — overall sentiment
    if (posPct >= 60) {
        bullets.push(`Customers are generally satisfied with the platform — ${posPct}% of feedback is positive.`);
    } else if (negPct >= 30) {
        bullets.push(`Customer satisfaction needs attention — ${negPct}% of feedback is negative this period.`);
    } else {
        bullets.push(`Customer sentiment is mixed: ${posPct}% positive and ${negPct}% negative this period.`);
    }

    // 2 — top topic
    bullets.push(`Most positive feedback highlights "${topTopic}" as a key strength.`);

    // 3 — second topic / growth
    if (topTopic2) {
        bullets.push(`The largest growing request is "${topTopic2}", mentioned in ${data.topTopics[1]?.count ?? 0} feedback items.`);
    } else {
        bullets.push(`Top themes are concentrated — "${topTopic}" dominates ${data.topTopics[0]?.count ?? 0} mentions.`);
    }

    // 4 — top issue / recommendation
    if (topRec) {
        bullets.push(`The biggest usability issue is: ${topRec}.`);
    } else {
        bullets.push(`No specific AI recommendations generated yet — run AI analysis on feedback to get insights.`);
    }

    // 5 — channel or unanalyzed note
    if (data.unanalyzed > 0 && data.unanalyzed / total > 0.3) {
        bullets.push(`${data.unanalyzed} feedback items (${pct(data.unanalyzed, total)}%) are still unanalyzed — run AI analysis for complete insights.`);
    } else if (topChannel) {
        bullets.push(`The most active feedback channel is "${topChannel}" with ${data.byChannel[0]?.count ?? 0} submissions.`);
    } else {
        bullets.push(`Overall sentiment improved based on the most recent feedback trends.`);
    }

    return bullets;
}

/**
 * Pick representative quotes — one per sentiment type,
 * preferring longer, more descriptive feedback.
 */
function pickQuotes(feedbacks: ReportData["feedbacks"], max = 6): VocQuote[] {
    const STARS: Record<string, number> = { Positive: 5, Neutral: 3, Negative: 2 };

    const byBucket: Record<string, typeof feedbacks> = {
        Positive: [], Neutral: [], Negative: [], Unknown: [],
    };
    for (const f of feedbacks) {
        const key = f.sentiment ?? "Unknown";
        (byBucket[key] ?? byBucket.Unknown).push(f);
    }

    const quotes: VocQuote[] = [];
    for (const bucket of ["Negative", "Positive", "Neutral", "Unknown"]) {
        const pick = (byBucket[bucket] ?? [])
            .filter((f) => f.content.trim().length > 20)
            .sort((a, b) => b.content.length - a.content.length)[0];

        if (pick) {
            quotes.push({
                content: pick.content.length > 200 ? pick.content.slice(0, 200) + "…" : pick.content,
                sentiment: pick.sentiment,
                channel: pick.channel,
                customerLabel: pick.customerLabel,
                stars: STARS[pick.sentiment ?? ""] ?? 3,
            });
        }
        if (quotes.length >= max) break;
    }
    return quotes;
}

/**
 * Convert top recommendations into prioritised action items.
 * Top 2 → High, next 2 → Medium, rest → Low.
 */
function buildRecommendations(topRecs: ReportData["topRecommendations"]): VocRecommendation[] {
    return topRecs.map((r, i): VocRecommendation => ({
        priority: i < 2 ? "High" : i < 4 ? "Medium" : "Low",
        action: r.rec,
        count: r.count,
    }));
}

/**
 * Generate a plain-English key insight sentence.
 */
function keyInsight(data: ReportData): string {
    const total = data.total;
    if (total === 0) return "No feedback found for this period.";
    const posPct = pct(data.positive, total);
    const negPct = pct(data.negative, total);
    const topTopic = data.topTopics[0]?.topic;
    const topRec = data.topRecommendations[0]?.rec;

    const parts = [`${total.toLocaleString()} feedback items collected.`];
    if (posPct >= 60) parts.push(`Customer sentiment is predominantly positive at ${posPct}%.`);
    else if (negPct >= 30) parts.push(`Negative sentiment is elevated at ${negPct}% — action recommended.`);
    else parts.push(`Sentiment is mixed: ${posPct}% positive, ${negPct}% negative.`);
    if (topTopic) parts.push(`The most discussed topic is "${topTopic}".`);
    if (topRec) parts.push(`Top recommendation: ${topRec}.`);
    return parts.join(" ");
}

// ── Main builder ──────────────────────────────────────────────────────────

/**
 * Build monthly sentiment trend from raw feedbacks.
 * Groups into up to 7 monthly buckets within the report period.
 */
function buildSentimentTrend(
    feedbacks: ReportData["feedbacks"],
    from: Date,
    to: Date,
): VocSentimentTrendPoint[] {
    // Build month buckets from→to
    const buckets: Map<string, { pos: number; neu: number; neg: number; total: number }> = new Map();
    const cursor = new Date(from);
    cursor.setDate(1);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(to);

    while (cursor <= end) {
        const key = cursor.toLocaleString("en-US", { month: "short" });
        if (!buckets.has(key)) buckets.set(key, { pos: 0, neu: 0, neg: 0, total: 0 });
        cursor.setMonth(cursor.getMonth() + 1);
    }

    for (const f of feedbacks) {
        const key = new Date(f.createdAt).toLocaleString("en-US", { month: "short" });
        const b = buckets.get(key);
        if (!b) continue;
        b.total++;
        if (f.sentiment === "Positive") b.pos++;
        else if (f.sentiment === "Neutral") b.neu++;
        else if (f.sentiment === "Negative") b.neg++;
    }

    return Array.from(buckets.entries()).map(([month, b]) => ({
        month,
        positive: b.pos,
        neutral: b.neu,
        negative: b.neg,
        positivePct: b.total === 0 ? 0 : Math.round((b.pos / b.total) * 100),
    }));
}

/**
 * Compute period-over-period sentiment changes.
 * Compares first half vs second half of the feedbacks array as a proxy.
 */
function buildSentimentChanges(
    feedbacks: ReportData["feedbacks"],
    posPct: number,
    neuPct: number,
    negPct: number,
): VocSentimentChange[] {
    // Split feedbacks into two halves (older = "prev", newer = "current")
    const mid = Math.floor(feedbacks.length / 2);
    const prev = feedbacks.slice(mid);   // older half (sorted desc, so higher index = older)
    const curr = feedbacks.slice(0, mid);

    function sentPct(arr: typeof feedbacks, s: string) {
        if (arr.length === 0) return 0;
        return Math.round((arr.filter((f) => f.sentiment === s).length / arr.length) * 100);
    }

    const prevPos = sentPct(prev, "Positive");
    const prevNeu = sentPct(prev, "Neutral");
    const prevNeg = sentPct(prev, "Negative");

    const mkChange = (
        label: string, cur: number, pre: number, color: string,
        goodDirection: "up" | "down",
    ): VocSentimentChange => {
        const delta = cur - pre;
        const trend: "↑" | "↓" | "→" =
            Math.abs(delta) < 2 ? "→" : delta > 0 ? "↑" : "↓";
        return { label, currentPct: cur, prevPct: pre, delta, trend, color };
    };

    return [
        mkChange("Positive", posPct, prevPos, "#4ade80", "up"),
        mkChange("Neutral", neuPct, prevNeu, "#fbbf24", "up"),
        mkChange("Negative", negPct, prevNeg, "#f87171", "down"),
    ];
}

export function buildVocReport(
    data: ReportData,
    meta: { workspaceName: string; from: Date; to: Date },
): VocReportJson {
    const total = data.total;
    const posPct = pct(data.positive, total);
    const negPct = pct(data.negative, total);
    const { score: healthScore, label: healthLabel } = computeHealth(posPct, negPct);

    return {
        workspaceName: meta.workspaceName,
        periodStart: meta.from.toISOString(),
        periodEnd: meta.to.toISOString(),
        generatedAt: new Date().toISOString(),

        summary: {
            totalFeedback: total,
            positive: data.positive,
            neutral: data.neutral,
            negative: data.negative,
            unanalyzed: data.unanalyzed,
            positivePct: posPct,
            neutralPct: pct(data.neutral, total),
            negativePct: negPct,
            healthScore,
            healthLabel,
            keyInsight: keyInsight(data),
            aiSummary: buildAiSummary(data, posPct, negPct),
        },

        topThemes: data.topTopics.slice(0, 8).map((t, i, arr) => ({
            theme: t.topic,
            count: t.count,
            trend: trendFor(i, arr.length),
        })),

        sentimentBreakdown: [
            { label: "Positive", count: data.positive, pct: posPct, color: "#4ade80" },
            { label: "Neutral", count: data.neutral, pct: pct(data.neutral, total), color: "#fbbf24" },
            { label: "Negative", count: data.negative, pct: negPct, color: "#f87171" },
            { label: "Unanalyzed", count: data.unanalyzed, pct: pct(data.unanalyzed, total), color: "#64748b" },
        ],

        customerQuotes: pickQuotes(data.feedbacks),
        recommendations: buildRecommendations(data.topRecommendations),
        topKeywords: data.topKeywords.slice(0, 12).map((k) => k.keyword),
        byChannel: data.byChannel,
        sentimentTrend: buildSentimentTrend(data.feedbacks, meta.from, meta.to),
        sentimentChanges: buildSentimentChanges(data.feedbacks, posPct, pct(data.neutral, total), negPct),
    };
}
