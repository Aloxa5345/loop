/**
 * embeddings.ts
 *
 * Generates dense vector embeddings using the Voyage AI API (voyage-3-lite).
 * Falls back to a local TF-IDF hash vector when VOYAGE_API_KEY is not set,
 * so the feature works in development without a key.
 *
 * Embedding dimension:
 *   Voyage voyage-3-lite  → 512 dims
 *   Local fallback        → 512 dims  (same size, seamless swap)
 *
 * Vector format: JSON-serialised number[] stored in the `vector` String field.
 */

import { VoyageAIClient } from "voyageai";
import { prisma } from "@/app/lib/prisma";

// ── Voyage client (lazy — only created when a key is present) ──────────────
let _voyage: VoyageAIClient | null = null;
function getVoyageClient(): VoyageAIClient | null {
    const key = process.env.VOYAGE_API_KEY;
    if (!key) return null;
    if (!_voyage) _voyage = new VoyageAIClient({ apiKey: key });
    return _voyage;
}

// ── Local TF-IDF fallback ─────────────────────────────────────────────────
const VOCAB_SIZE = 512;

function hashToken(token: string): number {
    let h = 2166136261;
    for (let i = 0; i < token.length; i++) {
        h ^= token.charCodeAt(i);
        h = (h * 16777619) >>> 0;
    }
    return h % VOCAB_SIZE;
}

function tokenise(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 1);
}

function localEmbedding(text: string): number[] {
    const tokens = tokenise(text.slice(0, 8000));
    const vec = new Array<number>(VOCAB_SIZE).fill(0);
    for (const token of tokens) vec[hashToken(token)] += 1;
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    if (norm > 0) for (let i = 0; i < VOCAB_SIZE; i++) vec[i] /= norm;
    return vec;
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Generate an embedding for a piece of text.
 * Uses Voyage AI voyage-3-lite when VOYAGE_API_KEY is set,
 * otherwise falls back to the local TF-IDF hash vector.
 */
export async function getEmbedding(
    text: string,
    inputType: "document" | "query" = "document"
): Promise<number[]> {
    const client = getVoyageClient();

    if (client) {
        const response = await client.embed({
            input: text.slice(0, 8000),
            model: "voyage-3-lite",
            inputType,
        });

        const embedding = response.data?.[0]?.embedding;
        if (!Array.isArray(embedding) || embedding.length === 0) {
            throw new Error("Voyage AI returned an empty embedding");
        }
        return embedding as number[];
    }

    // No API key — use local fallback
    return localEmbedding(text);
}

/**
 * Ensure an embedding exists for the given feedback item.
 * Returns the cached vector if present; otherwise generates, stores, and returns it.
 */
export async function ensureEmbedding(
    feedbackId: string,
    content: string
): Promise<number[]> {
    const existing = await prisma.embedding.findUnique({
        where: { feedbackId },
        select: { vector: true },
    });

    if (existing) {
        return JSON.parse(existing.vector) as number[];
    }

    const vector = await getEmbedding(content, "document");

    await prisma.embedding.upsert({
        where: { feedbackId },
        create: { feedbackId, vector: JSON.stringify(vector) },
        update: { vector: JSON.stringify(vector) },
    });

    return vector;
}
