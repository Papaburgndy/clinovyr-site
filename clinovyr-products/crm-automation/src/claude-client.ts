import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const MAX_JSON_RETRIES = 3;

export function createClaudeClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  const firstBracket = text.indexOf("[");
  const lastBracket = text.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    return text.slice(firstBracket, lastBracket + 1);
  }

  return text.trim();
}

export async function callClaudeWithJsonRetry<T>(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  let lastError = "Unknown Claude parsing error";

  for (let attempt = 1; attempt <= MAX_JSON_RETRIES; attempt += 1) {
    const response = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content:
            attempt === 1
              ? userPrompt
              : `${userPrompt}\n\nYour previous response was not valid JSON. Return ONLY valid JSON with no markdown fences.`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      lastError = "Claude returned no text content";
      continue;
    }

    try {
      return JSON.parse(extractJson(textBlock.text)) as T;
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Failed to parse Claude JSON";
    }
  }

  throw new Error(
    `Claude JSON parsing failed after ${MAX_JSON_RETRIES} attempts: ${lastError}`,
  );
}

export async function callClaudeText(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  return textBlock.text.trim();
}
