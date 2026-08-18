/**
 * Validates and normalises the raw JSON object returned by Claude.
 * Uses the Zod ClassifyResultSchema as the single source of truth.
 * Throws a descriptive error if any required field is missing or malformed.
 */

import { ClassifyResultSchema } from "./schema";

// Re-export the type so callers can import from validator as before
export type { ClassifyResult } from "./schema";

export function validateClassifyResult(raw: unknown): import("./schema").ClassifyResult {
    if (!raw || typeof raw !== "object") {
        throw new Error("Claude response is not a JSON object");
    }

    const result = ClassifyResultSchema.safeParse(raw);

    if (!result.success) {
        const messages = result.error.issues
            .map((i) => `"${i.path.join(".")}": ${i.message}`)
            .join("; ");
        throw new Error(`AI response validation failed — ${messages}`);
    }

    // Normalise: trim strings, cap sentimentScore precision, cap keyword list
    return {
        ...result.data,
        sentimentScore: Math.round(result.data.sentimentScore * 100) / 100,
        theme: result.data.theme.trim(),
        featureArea: result.data.featureArea.trim(),
        summary: result.data.summary.trim(),
        recommendation: result.data.recommendation.trim(),
        keywords: result.data.keywords
            .map((k) => k.trim())
            .filter(Boolean)
            .slice(0, 8),
    };
}
