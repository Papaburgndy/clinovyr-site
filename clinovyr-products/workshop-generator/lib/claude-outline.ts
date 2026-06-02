import Anthropic from "@anthropic-ai/sdk";
import type { WorkshopInput, WorkshopOutline } from "./types";

const CLAUDE_MODEL = "claude-sonnet-4-6";
const MAX_PARSE_ATTEMPTS = 3;
const JSON_RETRY_SUFFIX =
  "\n\nReturn ONLY a valid JSON object, no markdown, no preamble.";

function buildPrompt(input: WorkshopInput): string {
  const { industry, company, audience, durationMinutes } = input;

  return `You are a senior facilitator at Clinovyr, an AI consulting firm serving small and mid-size businesses in Placer County, California (Granite Bay / Roseville). Design a customized in-person AI workshop deck outline.

## Workshop parameters
- Industry: ${industry}
- Host company (use in examples): ${company}
- Audience: ${audience}
- Total duration: ${durationMinutes} minutes

## Content requirements
- Customize every section for the ${industry} industry and ${audience}
- Include real or realistic local/regional statistics where possible (Placer County, Sacramento region, California SMB trends)
- Reference "${company}" by name in examples and scenarios
- Demo slides: ONLY free tools — ChatGPT (free tier), Claude.ai, Make.com free tier, Google Gemini. Put tool name and URL in demoDescription for each demo slide
- Agenda timeMinutes must sum to exactly ${durationMinutes}
- Include a mix of intro, education, demo, exercise, and q&a segments
- Slides should support the agenda; slideNumber starts at 1 and increments
- speakerNotes: full facilitator script (2–4 sentences minimum per slide). Refer to the facilitator as "your Clinovyr facilitator" — never use placeholder names like [Facilitator Name], TBD, or [INSERT]
- Contact email is always clinovyr@gmail.com (never hello@clinovyr.com); website is clinovyr.com
- stat slides: one compelling statistic with context in bullets
- exercise slides: clear hands-on instructions for the audience
- Final slide must be type "cta" for Clinovyr follow-up

Return ONLY valid JSON matching this exact schema (no markdown, no preamble):
{
  "title": "string",
  "agenda": [
    { "timeMinutes": number, "title": "string", "type": "intro" | "education" | "demo" | "exercise" | "q&a" }
  ],
  "slides": [
    {
      "slideNumber": number,
      "title": "string",
      "type": "title" | "agenda" | "education" | "stat" | "demo" | "exercise" | "cta",
      "bullets": ["string"],
      "speakerNotes": "string",
      "demoDescription": "optional string for demo slides only"
    }
  ]
}`;
}

function parseOutlineJson(raw: string): WorkshopOutline {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    console.error("[claude-outline] Claude response did not contain JSON. Raw:", raw);
    throw new Error("Claude response did not contain JSON.");
  }

  try {
    return JSON.parse(jsonMatch[0]) as WorkshopOutline;
  } catch (error) {
    console.error("[claude-outline] JSON.parse failed. Raw:", raw);
    throw error;
  }
}

function buildDevelopmentFallbackOutline(input: WorkshopInput): WorkshopOutline {
  const { industry, company, audience, durationMinutes } = input;
  const intro = 10;
  const education = Math.floor(durationMinutes * 0.35);
  const demo = Math.floor(durationMinutes * 0.25);
  const exercise = Math.floor(durationMinutes * 0.2);
  const qa = durationMinutes - intro - education - demo - exercise;

  return {
    title: `AI for ${industry}: Practical Tools for ${company}`,
    agenda: [
      { timeMinutes: intro, title: "Welcome & goals", type: "intro" },
      {
        timeMinutes: education,
        title: `${industry} AI landscape`,
        type: "education",
      },
      { timeMinutes: demo, title: "Live tool demos", type: "demo" },
      {
        timeMinutes: exercise,
        title: "Hands-on workflow exercise",
        type: "exercise",
      },
      { timeMinutes: qa, title: "Q&A and next steps", type: "q&a" },
    ],
    slides: [
      {
        slideNumber: 1,
        title: `AI Workshop — ${company}`,
        type: "title",
        bullets: [`Prepared for ${audience}`, `${durationMinutes}-minute session`],
        speakerNotes: `Welcome everyone from ${company}. Today we focus on practical AI for ${industry} teams in Placer County.`,
      },
      {
        slideNumber: 2,
        title: "Today's agenda",
        type: "agenda",
        bullets: [
          "Introduction & outcomes",
          `${industry} use cases`,
          "Live demos (free tools)",
          "Guided exercise",
          "Q&A",
        ],
        speakerNotes: "Walk through timing and set expectations for participation.",
      },
      {
        slideNumber: 3,
        title: `Why ${industry} businesses adopt AI now`,
        type: "education",
        bullets: [
          "California SMBs report 15–25% admin time on repeatable tasks",
          `${company} can start with low-risk pilots`,
          "Focus on outcomes, not hype",
        ],
        speakerNotes: `Tie trends to ${audience} daily work. Mention local Roseville/Granite Bay business context.`,
      },
      {
        slideNumber: 4,
        title: "Local impact at a glance",
        type: "stat",
        bullets: [
          "~67% of small businesses in the Sacramento region are exploring AI tools (2025 surveys)",
          "Early adopters in professional services save 5–10 hours/week on documentation",
        ],
        speakerNotes: "Pause for questions. Connect stat to one pain point they raised in intake.",
      },
      {
        slideNumber: 5,
        title: "Live demo: ChatGPT for daily tasks",
        type: "demo",
        bullets: [
          "Draft client communications",
          "Summarize meeting notes",
          "Template repeatable prompts",
        ],
        speakerNotes: "Open chat.openai.com. Use a ${company}-style example live.",
        demoDescription: "ChatGPT — https://chat.openai.com",
      },
      {
        slideNumber: 6,
        title: "Hands-on: Your first AI workflow",
        type: "exercise",
        bullets: [
          "Pick one recurring task at ${company}",
          "Write a 3-step prompt chain",
          "Share one insight with the group",
        ],
        speakerNotes: `Give ${Math.min(15, exercise)} minutes. Circulate and coach ${audience}.`,
      },
      {
        slideNumber: 7,
        title: "Continue with Clinovyr",
        type: "cta",
        bullets: [
          "clinovyr@gmail.com",
          "clinovyr.com",
          "Schedule a follow-up at clinovyr.com",
        ],
        speakerNotes:
          "Thank the group. Offer AI Readiness Assessment and retainer options. Collect interest for follow-up call.",
      },
    ],
  };
}

async function requestOutlineFromClaude(
  client: Anthropic,
  input: WorkshopInput,
): Promise<WorkshopOutline> {
  const basePrompt = buildPrompt(input);
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_PARSE_ATTEMPTS; attempt++) {
    const prompt =
      attempt === 1 ? basePrompt : `${basePrompt}${JSON_RETRY_SUFFIX}`;

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");

    if (!textBlock || textBlock.type !== "text") {
      lastError = new Error("Claude returned an empty response.");
      console.warn(
        `[claude-outline] Attempt ${attempt}/${MAX_PARSE_ATTEMPTS}: empty response`,
      );
      continue;
    }

    try {
      return parseOutlineJson(textBlock.text);
    } catch (error) {
      lastError = error;
      console.warn(
        `[claude-outline] Attempt ${attempt}/${MAX_PARSE_ATTEMPTS}: invalid JSON`,
      );
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to parse workshop outline after retries.");
}

export async function generateWorkshopOutline(
  input: WorkshopInput,
): Promise<WorkshopOutline> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn(
      "[claude-outline] ANTHROPIC_API_KEY missing — using development fallback outline.",
    );
    return buildDevelopmentFallbackOutline(input);
  }

  const client = new Anthropic({ apiKey });
  return requestOutlineFromClaude(client, input);
}
