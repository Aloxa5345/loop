/**
 * Zod schema for the AI classification result.
 * Used for validation before any data is written to the database.
 * Compatible with Zod v4.
 */
import { z } from "zod";

export const ClassifyResultSchema = z.object({
    sentiment: z.enum(["Positive", "Neutral", "Negative"]),

    sentimentScore: z
        .number()
        .min(0, "sentimentScore must be ≥ 0")
        .max(1, "sentimentScore must be ≤ 1"),

    theme: z
        .string()
        .min(1, "theme must not be empty")
        .max(120, "theme must be 120 characters or less"),

    featureArea: z
        .string()
        .min(1, "featureArea must not be empty")
        .max(120, "featureArea must be 120 characters or less"),

    summary: z
        .string()
        .min(1, "summary must not be empty")
        .max(1000, "summary must be 1000 characters or less"),

    recommendation: z
        .string()
        .min(1, "recommendation must not be empty")
        .max(500, "recommendation must be 500 characters or less"),

    keywords: z
        .array(z.string().min(1))
        .min(1, "keywords must contain at least one entry")
        .max(8, "keywords must have 8 entries or fewer"),
});

export type ClassifyResult = z.infer<typeof ClassifyResultSchema>;
