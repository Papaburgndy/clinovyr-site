const CLAUDE_MODEL = "claude-sonnet-4-6";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export type ClaudeResult = {
  text: string;
  usedFallback: boolean;
};

type CallClaudeOptions = {
  system: string;
  prompt: string;
  maxTokens?: number;
  fallback: string;
};

async function requestClaude(
  system: string,
  prompt: string,
  maxTokens: number,
  apiKey: string,
): Promise<string> {
  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const textBlock = data.content?.find((block) => block.type === "text");
  if (!textBlock?.text?.trim()) {
    throw new Error("Claude returned an empty response.");
  }

  return textBlock.text.trim();
}

/**
 * Calls Claude with graceful fallback — never throws blocking errors.
 */
export async function callClaudeText(
  options: CallClaudeOptions,
): Promise<ClaudeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    console.warn(
      "[deliverables/claude-helper] ANTHROPIC_API_KEY missing — using fallback.",
    );
    return { text: options.fallback, usedFallback: true };
  }

  try {
    const text = await requestClaude(
      options.system,
      options.prompt,
      options.maxTokens ?? 1200,
      apiKey,
    );
    return { text, usedFallback: false };
  } catch (error) {
    console.error("[deliverables/claude-helper] Claude call failed:", error);
    return { text: options.fallback, usedFallback: true };
  }
}

export function extractJsonBlock<T>(text: string): T | null {
  try {
    const jsonMatch = text.trim().match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}

export async function callClaudeJson<T>(options: {
  system: string;
  prompt: string;
  maxTokens?: number;
  fallback: T;
  validate?: (value: T) => boolean;
}): Promise<{ data: T; usedFallback: boolean }> {
  const result = await callClaudeText({
    system: options.system,
    prompt: options.prompt,
    maxTokens: options.maxTokens,
    fallback: JSON.stringify(options.fallback),
  });

  if (result.usedFallback) {
    return { data: options.fallback, usedFallback: true };
  }

  const parsed = extractJsonBlock<T>(result.text);
  if (!parsed || (options.validate && !options.validate(parsed))) {
    console.warn(
      "[deliverables/claude-helper] JSON parse/validation failed — using fallback.",
    );
    return { data: options.fallback, usedFallback: true };
  }

  return { data: parsed, usedFallback: false };
}
