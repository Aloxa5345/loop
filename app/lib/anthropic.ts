/**
 * AI helpers.
 * Uses Google Gemini (free, GEMINI_API_KEY) when available,
 * otherwise falls back to Anthropic Claude (ANTHROPIC_API_KEY).
 */

export interface AiAnalysis {
    sentiment: string;          // "Positive" | "Neutral" | "Negative"
    topics: string[];           // major discussion topics  (max 6)
    keywords: string[];         // short extracted keywords (max 8)
    summary: string;            // 1-2 sentence summary
    recommendations: string[];  // actionable items        (max 5)
}

const CLASSIFY_PROMPT = (content: string) => `Analyze the following customer feedback. Return ONLY valid JSON — no markdown, no explanation, no code fences.

{
  "sentiment": "",
  "topics": [],
  "keywords": [],
  "summary": "",
  "recommendations": []
}

Rules:
- sentiment: exactly one of "Positive", "Neutral", "Negative"
- topics: up to 6 short strings covering the main discussion areas
- keywords: up to 8 single-word or short-phrase extractions from the text
- summary: 1-2 sentences describing the core feedback
- recommendations: up to 5 specific, actionable improvement items

Feedback:
"${content.replace(/"/g, "'")}"`;

// ── analyzeFeedback — used by /api/ai/analyze ─────────────────────────────

export async function analyzeFeedback(content: string): Promise<AiAnalysis> {
    const text = await callAI(CLASSIFY_PROMPT(content));
    const parsed = JSON.parse(text) as Partial<AiAnalysis>;
    return {
        sentiment: typeof parsed.sentiment === "string" ? parsed.sentiment : "Neutral",
        topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 6) : [],
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 8) : [],
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 5) : [],
    };
}

// ── generateAnswer — used by chat.ts (Ask LOOP) ───────────────────────────

export async function generateAnswer(prompt: string, systemPrompt?: string): Promise<string> {
    const full = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
    return callAI(full, 1024);
}

// ── Stub anthropic export so old imports don't crash ─────────────────────
// chat.ts previously did: anthropic.messages.create(...)
// We keep this object so the import resolves, but route it through callAI.
export const anthropic = {
    messages: {
        create: async (opts: {
            model: string;
            max_tokens: number;
            system?: string;
            messages: { role: string; content: string }[];
        }): Promise<{ content: { type: string; text: string }[] }> => {
            const userMsg = opts.messages.find((m) => m.role === "user")?.content ?? "";
            const full = opts.system ? `${opts.system}\n\n${userMsg}` : userMsg;
            const text = await callAI(full, opts.max_tokens);
            return { content: [{ type: "text", text }] };
        },
    },
};

// ── Internal: route to Gemini or Anthropic ────────────────────────────────

async function callAI(prompt: string, maxTokens = 1024): Promise<string> {
    const geminiKey = process.env.GEMINI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (geminiKey) {
        return callGemini(prompt, geminiKey, maxTokens);
    } else if (anthropicKey) {
        return callAnthropicDirect(prompt, anthropicKey, maxTokens);
    }
    throw new Error("No AI API key — set GEMINI_API_KEY or ANTHROPIC_API_KEY in .env");
}

async function callGemini(prompt: string, apiKey: string, maxTokens: number): Promise<string> {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { maxOutputTokens: maxTokens, temperature: 0.2 },
    });
    return (response.text ?? "").replace(/```(?:json)?|```/g, "").trim();
}

async function callAnthropicDirect(prompt: string, apiKey: string, maxTokens: number): Promise<string> {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
    });
    const block = message.content[0];
    if (!block || block.type !== "text") throw new Error("Unexpected Claude response");
    return block.text.replace(/```(?:json)?|```/g, "").trim();
}
