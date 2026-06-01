import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_MODEL = "claude-sonnet-4-6";
export const MAX_PARSE_ATTEMPTS = 3;
export const JSON_RETRY_SUFFIX =
  "\n\nReturn ONLY a valid JSON object or array as specified, no markdown, no preamble.";

export function createClaudeClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export function parseJsonFromResponse<T>(raw: string): T {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!jsonMatch) {
    throw new Error("Claude response did not contain JSON.");
  }
  return JSON.parse(jsonMatch[0]) as T;
}

export async function callClaudeJson<T>(
  client: Anthropic,
  prompt: string,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_PARSE_ATTEMPTS; attempt++) {
    const userPrompt =
      attempt === 1 ? prompt : `${prompt}${JSON_RETRY_SUFFIX}`;

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      lastError = new Error("Claude returned an empty response.");
      continue;
    }

    try {
      return parseJsonFromResponse<T>(textBlock.text);
    } catch (error) {
      lastError = error;
      console.warn(
        `[claude] Attempt ${attempt}/${MAX_PARSE_ATTEMPTS}: invalid JSON`,
      );
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to parse Claude response after retries.");
}
