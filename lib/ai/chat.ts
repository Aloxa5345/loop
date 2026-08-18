/**
 * chat.ts
 *
 * Orchestrates the full Ask LOOP RAG pipeline:
 *   question → embed → vector search → answer generation → response
 *
 * Answer generation strategy (in priority order):
 *   1. Claude AI — used when ANTHROPIC_API_KEY has available credits
 *   2. Built-in summariser — used as fallback when Claude is unavailable
 *      (zero credits, rate limit, network error, etc.)
 *
 * The built-in summariser produces a grounded answer directly from the
 * retrieved feedback without any external API call, so the chatbot always
 * works regardless of billing status.
 */

import { generateAnswer } from "@/app/lib/anthropic";
import { vectorSearch, type VectorSearchResult } from "./vectorSearch";
import { buildAskLoopPrompt } from "./prompts";

export interface ChatSource {
    id: string;
    content: string;
    sentiment: string | null;
    channel: string;
    customerLabel: string;
    /** Relevance percentage 0–100 */
    score: number;
}

export interface ChatResponse {
    answer: string;
    sources: ChatSource[];
    /** true when the answer was produced by the built-in summariser, not Claude */
    fallback?: boolean;
}

const NO_FEEDBACK_ANSWER =
    "I couldn't find enough relevant feedback in this workspace to answer that question.";

// ── Built-in summariser ───────────────────────────────────────────────────
/**
 * Produces a grounded, readable answer from the top retrieved feedback items
 * without calling any external API.
 *
 * Strategy:
 *  - Extract the most informative sentence from each feedback snippet.
 *  - Group by sentiment so the answer is structured.
 *  - Emit a short paragraph + bullet list.
 */
function localSummarise(
    question: string,
    items: VectorSearchResult[],
): string {
    if (items.length === 0) return NO_FEEDBACK_ANSWER;

    // Deduplicate by content (same text can match via different IDs)
    const seen = new Set<string>();
    const unique = items.filter((item) => {
        const key = item.content.trim().toLowerCase().slice(0, 80);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // Capitalise first letter helper
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    // Pull the first sentence (or first 140 chars) of each unique item
    const bullets = unique.map((item) => {
        const first = item.content.split(/[.!?\n]/)[0].trim();
        const snippet = first.length > 10 ? first : item.content.slice(0, 140).trim();
        const sentTag = item.sentiment ? ` [${item.sentiment}]` : "";
        return `• ${cap(snippet)}${sentTag}`;
    });

    // Count sentiments for summary line — skip "unknown"
    const sentCounts: Record<string, number> = {};
    for (const item of unique) {
        if (!item.sentiment) continue;
        sentCounts[item.sentiment] = (sentCounts[item.sentiment] ?? 0) + 1;
    }
    const sentEntries = Object.entries(sentCounts).sort((a, b) => b[1] - a[1]);
    const sentSummary = sentEntries.length > 0
        ? sentEntries.map(([s, n]) => `${n} ${s.toLowerCase()}`).join(", ")
        : "sentiment not yet analysed";

    const count = unique.length;
    const intro = `Based on ${count} feedback item${count !== 1 ? "s" : ""} from your workspace (${sentSummary}):`;

    return `${intro}\n\n${bullets.join("\n")}\n\nSources: ${unique.map((i) => i.id).join(", ")}`;
}

// ── Claude call with billing-error detection ──────────────────────────────
async function tryClaudeAnswer(
    question: string,
    retrieved: VectorSearchResult[],
): Promise<string | null> {
    try {
        const prompt = buildAskLoopPrompt(question, retrieved);
        const systemPrompt = [
            "You are LOOP AI.",
            "Answer ONLY from the retrieved customer feedback provided by the user.",
            "Never use outside knowledge.",
            `If the retrieved feedback is insufficient, respond EXACTLY: "${NO_FEEDBACK_ANSWER}"`,
            "Always provide: 1. Short answer  2. Bullet point summary  3. Source feedback IDs",
        ].join("\n");
        const answer = await generateAnswer(prompt, systemPrompt);
        return answer || null;
    } catch (err: unknown) {
        const e = err as { status?: number; message?: string };
        console.warn(`[chat] AI unavailable (${e.status ?? e.message}), using built-in summariser`);
        return null;
    }
}

// ── Main orchestrator ─────────────────────────────────────────────────────

/**
 * Run the full RAG pipeline for a user question.
 *
 * @param question    The user's natural-language question
 * @param workspaceId Scope — only feedback from this workspace is searched
 * @param topK        Number of feedback items to retrieve (default 5)
 */
export async function askLoop(
    question: string,
    workspaceId: string,
    topK = 5,
): Promise<ChatResponse> {
    // ── 1. Vector search ──────────────────────────────────────
    let retrieved: VectorSearchResult[] = [];
    try {
        retrieved = await vectorSearch(question, workspaceId, topK);
    } catch (err) {
        console.error("[chat] Vector search error:", err);
        // Proceed with empty context
    }

    // ── 2. Generate answer ────────────────────────────────────
    const claudeAnswer = await tryClaudeAnswer(question, retrieved);
    const usedFallback = claudeAnswer === null;
    const answer = claudeAnswer ?? localSummarise(question, retrieved);

    // ── 3. Shape sources ──────────────────────────────────────
    const sources: ChatSource[] = retrieved.map((r) => ({
        id: r.id,
        content: r.content.length > 200 ? r.content.slice(0, 200) + "…" : r.content,
        sentiment: r.sentiment,
        channel: r.channel,
        customerLabel: r.customerLabel,
        score: Math.round(r.score * 100),
    }));

    return { answer, sources, fallback: usedFallback };
}
