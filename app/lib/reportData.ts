import { prisma } from "./prisma";

export interface ReportFilters {
    workspaceId: string;
    from: Date;
    to: Date;
}

export interface ReportData {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    unanalyzed: number;
    byChannel: { channel: string; count: number }[];
    byStatus: { status: string; count: number }[];
    topTopics: { topic: string; count: number }[];
    topKeywords: { keyword: string; count: number }[];
    topRecommendations: { rec: string; count: number }[];
    feedbacks: {
        content: string;
        channel: string;
        customerLabel: string;
        status: string;
        sentiment: string | null;
        topics: string | null;
        aiSummary: string | null;
        createdAt: Date;
    }[];
}

function parseJsonArr(v: string | null | undefined): string[] {
    if (!v) return [];
    try { return JSON.parse(v) as string[]; } catch { return []; }
}

function countMap(items: string[]): Record<string, number> {
    const m: Record<string, number> = {};
    for (const i of items) m[i] = (m[i] ?? 0) + 1;
    return m;
}

export async function getReportData(filters: ReportFilters): Promise<ReportData> {
    const { workspaceId, from, to } = filters;

    const feedbacks = await prisma.feedback.findMany({
        where: {
            workspaceId,
            createdAt: { gte: from, lte: to },
        },
        select: {
            content: true, channel: true, customerLabel: true,
            status: true, sentiment: true, topics: true, keywords: true,
            aiSummary: true, recommendations: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });

    const total = feedbacks.length;
    const positive = feedbacks.filter((f) => f.sentiment === "Positive").length;
    const neutral = feedbacks.filter((f) => f.sentiment === "Neutral").length;
    const negative = feedbacks.filter((f) => f.sentiment === "Negative").length;
    const unanalyzed = feedbacks.filter((f) => !f.sentiment).length;

    // Channel distribution
    const channelMap: Record<string, number> = {};
    for (const f of feedbacks) channelMap[f.channel] = (channelMap[f.channel] ?? 0) + 1;
    const byChannel = Object.entries(channelMap)
        .sort((a, b) => b[1] - a[1])
        .map(([channel, count]) => ({ channel, count }));

    // Status distribution
    const statusMap: Record<string, number> = {};
    for (const f of feedbacks) statusMap[f.status] = (statusMap[f.status] ?? 0) + 1;
    const byStatus = Object.entries(statusMap)
        .map(([status, count]) => ({ status, count }));

    // Topics, keywords, recommendations
    const topicMap: Record<string, number> = {};
    const kwMap: Record<string, number> = {};
    const recMap: Record<string, number> = {};
    for (const f of feedbacks) {
        for (const t of parseJsonArr(f.topics)) topicMap[t] = (topicMap[t] ?? 0) + 1;
        for (const k of parseJsonArr(f.keywords)) kwMap[k] = (kwMap[k] ?? 0) + 1;
        for (const r of parseJsonArr(f.recommendations)) recMap[r] = (recMap[r] ?? 0) + 1;
    }
    const topTopics = Object.entries(topicMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([topic, count]) => ({ topic, count }));
    const topKeywords = Object.entries(kwMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([keyword, count]) => ({ keyword, count }));
    const topRecommendations = Object.entries(recMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([rec, count]) => ({ rec, count }));

    return {
        total, positive, neutral, negative, unanalyzed,
        byChannel, byStatus, topTopics, topKeywords, topRecommendations,
        feedbacks,
    };
}

export function getDateRange(preset: string): { from: Date; to: Date } {
    const now = new Date();
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);

    switch (preset) {
        case "today": {
            const from = new Date(now); from.setHours(0, 0, 0, 0);
            return { from, to };
        }
        case "yesterday": {
            const from = new Date(now); from.setDate(from.getDate() - 1); from.setHours(0, 0, 0, 0);
            const t = new Date(from); t.setHours(23, 59, 59, 999);
            return { from, to: t };
        }
        case "7d": {
            const from = new Date(now); from.setDate(from.getDate() - 6); from.setHours(0, 0, 0, 0);
            return { from, to };
        }
        case "90d": {
            const from = new Date(now); from.setDate(from.getDate() - 89); from.setHours(0, 0, 0, 0);
            return { from, to };
        }
        case "year": {
            const from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            return { from, to };
        }
        default: { // "30d"
            const from = new Date(now); from.setDate(from.getDate() - 29); from.setHours(0, 0, 0, 0);
            return { from, to };
        }
    }
}
