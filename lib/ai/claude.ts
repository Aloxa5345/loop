/**
 * AI call for feedback classification.
 * Uses Google Gemini (free tier) if GEMINI_API_KEY is set,
 * otherwise falls back to Anthropic Claude.
 */
import { buildClassifyPrompt } from "./prompts";

export async function callClaude(content: string): Promise<unknown> {
    const geminiKey = process.env.GEMINI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (geminiKey) {
        return callGemini(content, geminiKey);
    } else if (anthropicKey) {
        return callAnthropic(content, anthropicKey);
    } else {
        throw new Error("No AI API key configured. Set GEMINI_API_KEY or ANTHROPIC_API_KEY in .env");
    }
}

// ── Gemini (free tier) ───────────────────────────────────────────────────────
async function callGemini(content: string, apiKey: string): Promise<unknown> {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = buildClassifyPrompt(content);

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            maxOutputTokens: 1024,
            temperature: 0.2,
        },
    });

    const text = (response.text ?? "").replace(/```(?:json)?|```/g, "").trim();
    return JSON.parse(text);
}

// ── Anthropic Claude (paid) ──────────────────────────────────────────────────
async function callAnthropic(content: string, apiKey: string): Promise<unknown> {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    const prompt = buildClassifyPrompt(content);

    const message = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
    });

    const block = message.content[0];
    if (!block || block.type !== "text") {
        throw new Error("Unexpected response type from Claude API");
    }
    const clean = block.text.replace(/```(?:json)?|```/g, "").trim();
    return JSON.parse(clean);
}
