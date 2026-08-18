/**
 * Claude prompt factory for feedback auto-classification.
 */
export function buildClassifyPrompt(content: string): string {
  // Escape embedded quotes so they don't break the JSON template Claude sees
  const safe = content.replace(/"/g, "'").replace(/`/g, "'");

  return `You are a customer feedback analyst. Classify the feedback below and return ONLY valid JSON — no markdown, no explanation, no code fences.

Required JSON shape (fill every field):
{
  "sentiment": "",
  "sentimentScore": 0,
  "theme": "",
  "featureArea": "",
  "summary": "",
  "recommendation": "",
  "keywords": []
}

Rules:
- sentiment: exactly one of "Positive", "Neutral", "Negative"
- sentimentScore: float 0.0 – 1.0 (confidence in the sentiment label)
- theme: short label for the main topic discussed (e.g. "Dark Mode", "Performance", "Billing")
- featureArea: product area the feedback targets (e.g. "Dashboard", "Analytics", "Onboarding")
- summary: 1–2 sentence plain-English summary of the core feedback
- recommendation: one specific, actionable improvement the team should consider
- keywords: array of up to 8 short strings extracted from the feedback

Feedback:
"${safe}"`;
}

/**
 * Builds the system + user prompt for the Ask LOOP RAG chat.
 *
 * @param question   The user's question
 * @param contexts   Retrieved feedback snippets to ground the answer
 */
export function buildAskLoopPrompt(
  question: string,
  contexts: Array<{ id: string; content: string; sentiment: string | null }>
): string {
  const contextBlock = contexts
    .map((c, i) =>
      `[Feedback ${i + 1}] (id: ${c.id}, sentiment: ${c.sentiment ?? "unknown"})\n${c.content}`
    )
    .join("\n\n---\n\n");

  return `You are LOOP AI, an assistant that answers questions ONLY based on the customer feedback provided below.

STRICT RULES:
- Answer ONLY using the feedback excerpts provided. Never use general knowledge.
- If the provided feedback does not contain enough information to answer, respond EXACTLY:
  "I couldn't find enough relevant feedback to answer that question."
- Give a concise, structured answer (2–5 sentences or a short bullet list).
- Do not mention that you are using retrieved data or that you are an AI model.
- After your answer, list the IDs of the feedback items you used as: "Sources: fb_<id1>, fb_<id2>, ..."

Retrieved feedback:
---
${contextBlock}
---

Question: ${question.replace(/"/g, "'")}`;
}
