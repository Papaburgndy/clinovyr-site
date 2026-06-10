const CLAUDE_MODEL = "claude-sonnet-4-6";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

/**
 * Per-run telemetry so the deliverable pipeline can flag when a customer
 * received fallback (non-Claude) content. run-generation snapshots this
 * before/after each generator. Module-level is safe because generation runs
 * sequentially within a single Worker invocation.
 */
export const claudeTelemetry = { calls: 0, fallbacks: 0 };

export function resetClaudeTelemetry(): void {
  claudeTelemetry.calls = 0;
  claudeTelemetry.fallbacks = 0;
}

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

/** Statuses worth retrying: rate limits, overloaded, transient server errors. */
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504, 529]);
const MAX_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class AnthropicHttpError extends Error {
  constructor(
    public readonly status: number,
    body: string,
  ) {
    super(`Anthropic API error (${status}): ${body}`);
  }
}

async function requestClaudeOnce(
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
    throw new AnthropicHttpError(response.status, errorText);
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
 * Calls the Anthropic API with up to MAX_ATTEMPTS tries. Retries transient
 * failures (rate limits, overloaded, 5xx, network errors) with exponential
 * backoff so a single hiccup doesn't downgrade a paid deliverable to
 * fallback content. Non-retryable errors (e.g. 401 bad key) throw at once.
 */
async function requestClaude(
  system: string,
  prompt: string,
  maxTokens: number,
  apiKey: string,
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await requestClaudeOnce(system, prompt, maxTokens, apiKey);
    } catch (error) {
      lastError = error;

      const retryable =
        error instanceof AnthropicHttpError
          ? RETRYABLE_STATUSES.has(error.status)
          : // Network/fetch failures (TypeError) and empty responses are
            // transient; anything else HTTP-shaped already threw above.
            true;

      if (!retryable || attempt === MAX_ATTEMPTS) {
        throw error;
      }

      const delay = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `[deliverables/claude-helper] attempt ${attempt}/${MAX_ATTEMPTS} failed, retrying in ${delay}ms:`,
        error instanceof Error ? error.message : error,
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Calls Claude with graceful fallback — never throws blocking errors.
 */
export async function callClaudeText(
  options: CallClaudeOptions,
): Promise<ClaudeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  claudeTelemetry.calls += 1;

  if (!apiKey) {
    console.warn(
      "[deliverables/claude-helper] ANTHROPIC_API_KEY missing — using fallback.",
    );
    claudeTelemetry.fallbacks += 1;
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
    claudeTelemetry.fallbacks += 1;
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
    claudeTelemetry.fallbacks += 1;
    return { data: options.fallback, usedFallback: true };
  }

  return { data: parsed, usedFallback: false };
}
