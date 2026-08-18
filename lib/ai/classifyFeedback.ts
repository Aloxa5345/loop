/**
 * classifyFeedback — auto-classifies a single feedback item using Claude.
 *
 * Workflow:
 *  1. Mark the record aiStatus = "Processing"
 *  2. Call Claude with retry (up to MAX_RETRIES attempts)
 *  3. Validate the JSON response
 *  4. On success → update the record with all AI fields, aiStatus = "Completed"
 *  5. On failure → mark aiStatus = "Failed", log error
 *
 * This function is designed to be called fire-and-forget after a feedback
 * record is created (no awaiting needed at the call site, errors are handled
 * internally and written to the DB).
 */

import { prisma } from "@/app/lib/prisma";
import { callClaude } from "./claude";
import { validateClassifyResult } from "./validator";
import { notifyAdmins } from "@/lib/notifications";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 800; // base delay between retries

function sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function classifyFeedback(feedbackId: string): Promise<void> {
    // ── 1. Mark as Processing ─────────────────────────────────
    let feedback: { id: string; content: string } | null = null;
    try {
        feedback = await prisma.feedback.update({
            where: { id: feedbackId },
            data: { aiStatus: "Processing" },
            select: { id: true, content: true },
        });
    } catch (err) {
        console.error(`[AI] Failed to mark feedback ${feedbackId} as Processing:`, err);
        return;
    }

    // ── 2. Call Claude with retries ───────────────────────────
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const raw = await callClaude(feedback.content);
            const result = validateClassifyResult(raw);

            // ── 3. Persist the validated result ──────────────
            await prisma.feedback.update({
                where: { id: feedbackId },
                data: {
                    sentiment: result.sentiment,
                    sentimentScore: result.sentimentScore,
                    topics: JSON.stringify([result.theme]),
                    keywords: JSON.stringify(result.keywords),
                    aiSummary: result.summary,
                    recommendations: JSON.stringify([result.recommendation]),
                    featureArea: result.featureArea,
                    aiStatus: "Completed",
                    status: "ANALYZED",
                    analyzedAt: new Date(),
                },
            });

            // ── Notify admins: AI complete ────────────────────
            const fb = await prisma.feedback.findUnique({
                where: { id: feedbackId },
                select: { workspaceId: true, customerLabel: true },
            });
            if (fb) {
                notifyAdmins({
                    workspaceId: fb.workspaceId,
                    type: "ai_complete",
                    title: "AI Analysis Complete",
                    message: `Feedback from ${fb.customerLabel} was analyzed — sentiment: ${result.sentiment}.`,
                    link: `/feedback/${feedbackId}`,
                }).catch(() => { });
            }

            return; // success
        } catch (err) {
            lastError = err;

            // ── Billing / credits error — don't retry, mark Pending ──
            // HTTP 400 from Anthropic means "credit balance too low".
            // Mark as Pending so items can be re-analyzed once credits
            // are added, without showing a scary ❌ Failed badge.
            const errMsg = String((err as { message?: string })?.message ?? "");
            const isBillingError =
                errMsg.includes("credit balance") ||
                errMsg.includes("Your credit") ||
                errMsg.includes("400");

            if (isBillingError) {
                console.warn(`[AI] Anthropic billing error for ${feedbackId} — marking Pending (retry when credits added)`);
                try {
                    await prisma.feedback.update({
                        where: { id: feedbackId },
                        data: { aiStatus: "Pending" },
                    });
                } catch { /* swallow */ }
                return;
            }

            console.warn(`[AI] Attempt ${attempt}/${MAX_RETRIES} failed for ${feedbackId}:`, err);
            if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY_MS * attempt); // exponential-ish back-off
            }
        }
    }

    // ── 4. All attempts exhausted → mark Failed ───────────────
    console.error(`[AI] Classification failed for ${feedbackId} after ${MAX_RETRIES} attempts:`, lastError);
    try {
        const fb = await prisma.feedback.update({
            where: { id: feedbackId },
            data: { aiStatus: "Failed" },
            select: { workspaceId: true, customerLabel: true },
        });
        // Notify admins of AI failure
        notifyAdmins({
            workspaceId: fb.workspaceId,
            type: "ai_failed",
            title: "AI Analysis Failed",
            message: `Failed to analyze feedback from ${fb.customerLabel} after ${MAX_RETRIES} attempts.`,
            link: `/feedback/${feedbackId}`,
        }).catch(() => { });
    } catch (updateErr) {
        console.error(`[AI] Could not mark ${feedbackId} as Failed:`, updateErr);
    }
}
