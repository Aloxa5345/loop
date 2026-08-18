/**
 * vectorSearch.ts
 *
 * Performs cosine-similarity vector search over the workspace's feedback
 * embeddings stored in PostgreSQL (JSON-encoded float arrays).
 *
 * Why not pgvector?
 * The project uses Prisma Accelerate (a connection pooler) which does not
 * support raw SQL or pgvector extension commands. All vector math is done
 * in JavaScript after fetching the stored JSON vectors — this is equivalent
 * semantically and fine for workspaces up to ~5 000 feedback items.
 *
 * Swap path: when pgvector becomes available, replace the JS similarity loop
 * with a single `SELECT ... ORDER BY embedding <=> $1 LIMIT k` raw query.
 */

import { prisma } from "@/app/lib/prisma";
import { getEmbedding, ensureEmbedding } from "./embeddings";

export interface VectorSearchResult {
    id: string;
    content: string;
    sentiment: string | null;
    channel: string;
    customerLabel: string;
    /** Cosine similarity score 0–1 */
    score: number;
}

/** Dot product of two L2-normalised vectors = cosine similarity */
function dotProduct(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
    return dot;
}

/**
 * Find the top-k feedback items most semantically similar to `query`
 * within the given workspace.
 *
 * @param query        Natural-language question from the user
 * @param workspaceId  Scope — only feedback from this workspace is searched
 * @param k            Number of results to return (default 5 per spec)
 * @param minScore     Minimum similarity threshold (default 0 — return best regardless)
 */
export async function vectorSearch(
    query: string,
    workspaceId: string,
    k = 5,
    minScore = 0,
): Promise<VectorSearchResult[]> {
    // Embed the question as a query vector
    const queryVec = await getEmbedding(query, "query");

    // Fetch up to 500 feedback rows with their stored embeddings
    const rows = await prisma.feedback.findMany({
        where: { workspaceId },
        select: {
            id: true,
            content: true,
            sentiment: true,
            channel: true,
            customerLabel: true,
            embedding: { select: { vector: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 500,
    });

    const scored: VectorSearchResult[] = [];

    for (const row of rows) {
        let vec: number[];

        if (row.embedding?.vector) {
            vec = JSON.parse(row.embedding.vector) as number[];
        } else {
            // Generate and persist on-the-fly (cheap for local fallback; Voyage
            // embeddings are batched in ensureEmbedding)
            vec = await ensureEmbedding(row.id, row.content);
        }

        const score = dotProduct(queryVec, vec);
        if (score >= minScore) {
            scored.push({
                id: row.id,
                content: row.content,
                sentiment: row.sentiment,
                channel: row.channel,
                customerLabel: row.customerLabel,
                score,
            });
        }
    }

    // Sort descending by score, deduplicate by content, return top k
    scored.sort((a, b) => b.score - a.score);

    const seenContent = new Set<string>();
    const deduped: VectorSearchResult[] = [];
    for (const item of scored) {
        const key = item.content.trim().toLowerCase().slice(0, 80);
        if (!seenContent.has(key)) {
            seenContent.add(key);
            deduped.push(item);
        }
        if (deduped.length >= k) break;
    }

    return deduped;
}
