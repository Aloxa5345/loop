/**
 * classifyBatch — after a bulk import, look up the newly-inserted records
 * and fire AI classification for each one, staggered to avoid rate-limits.
 *
 * @param workspaceId  Workspace the records belong to
 * @param count        Expected number of records just inserted
 * @param since        Timestamp just before the createMany call
 * @param staggerMs    Milliseconds between each classification kick-off (default 300ms)
 */
import { prisma } from "@/app/lib/prisma";
import { classifyFeedback } from "./classifyFeedback";

export async function classifyBatch(
    workspaceId: string,
    count: number,
    since: Date,
    staggerMs = 300
): Promise<void> {
    if (count <= 0) return;

    const records = await prisma.feedback.findMany({
        where: {
            workspaceId,
            aiStatus: "Pending",
            createdAt: { gte: new Date(since.getTime() - 5000) },
        },
        select: { id: true },
        orderBy: { createdAt: "desc" },
        take: count,
    });

    records.forEach((rec, i) => {
        setTimeout(() => {
            classifyFeedback(rec.id).catch((err) =>
                console.error(`[AI] Batch classification error for ${rec.id}:`, err)
            );
        }, i * staggerMs);
    });
}
