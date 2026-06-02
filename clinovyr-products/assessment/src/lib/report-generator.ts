/**
 * Server-side only — do not import this module from client components.
 * Requires ANTHROPIC_API_KEY in the server environment.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { AssessmentFormData } from "./assessment-types";
import type { AIReadinessScore } from "./scoring";

const CLAUDE_MODEL = "claude-sonnet-4-6";
const MAX_PARSE_ATTEMPTS = 3;
const JSON_RETRY_SUFFIX =
  "\n\nReturn ONLY a valid JSON object, no markdown, no preamble.";

export type AssessmentReport = {
  executiveSummary: string;
  currentStateAnalysis: string;
  topOpportunities: Array<{
    title: string;
    description: string;
    estimatedROI: string;
    timeToImplement: string;
    difficulty: "Low" | "Medium" | "High";
  }>;
  quickWins: Array<{
    title: string;
    howTo: string;
    toolsNeeded: string[];
  }>;
  recommendedNextStep: string;
  closingMessage: string;
};

function buildPrompt(formData: AssessmentFormData, score: AIReadinessScore): string {
  return `You are a senior AI consultant at Clinovyr, an AI consulting firm serving small and mid-size businesses in Placer County, California. Write a personalized AI Readiness Assessment report.

Use the assessment responses and computed score below. Be specific to this business — reference their industry, tools, time drains, goals, and concerns by name. Tone: sophisticated, practical, and results-focused — not hypey or generic.

Target length: 800–1200 words total across all text fields combined.

## Business profile
- Company: ${formData.companyName}
- Industry: ${formData.industry}
- Employees: ${formData.employees}
- Revenue: ${formData.revenue}
- Years in business: ${formData.yearsInBusiness}

## Tech stack
- CRM: ${formData.crm.join(", ")}
- Email: ${formData.emailTools.join(", ")}
- Scheduling: ${formData.scheduling.join(", ")}
- Project management: ${formData.pm.join(", ")}
- Accounting: ${formData.accounting.join(", ")}

## Time drains (ranked, biggest first)
${formData.timeDrainsRanked.map((drain, index) => `${index + 1}. ${drain}`).join("\n")}

## AI experience
- AI tool usage: ${formData.aiTools}
- Comfort level (1–5): ${formData.comfortLevel}
- Biggest concern: ${formData.biggestConcern}

## Goals
${formData.goals.map((goal) => `- ${goal}`).join("\n")}

## Contact context
- Name: ${formData.firstName} ${formData.lastName}
- Best time to connect: ${formData.bestTimeToConnect}
- How they heard about Clinovyr: ${formData.hearAbout}
- Additional notes: ${formData.additionalNotes || "None provided"}

## Computed readiness score
- Overall score: ${score.overallScore}/100
- Tier: ${score.tier}
- Category scores: tech stack ${score.categoryScores.techStack}, process maturity ${score.categoryScores.processMaturity}, data readiness ${score.categoryScores.dataReadiness}, adoption readiness ${score.categoryScores.adoptionReadiness}, ROI potential ${score.categoryScores.roi_potential}
- Estimated annual ROI range: ${score.estimatedAnnualROI}
- Recommended Clinovyr package: ${score.recommendedPackage}
- Scoring-derived top opportunities: ${score.topOpportunities.join("; ")}
- Scoring-derived quick wins: ${score.quickWins.join("; ")}

Return ONLY valid JSON matching this exact schema (no markdown, no preamble):
{
  "executiveSummary": "string",
  "currentStateAnalysis": "string",
  "topOpportunities": [
    {
      "title": "string",
      "description": "string",
      "estimatedROI": "string",
      "timeToImplement": "string",
      "difficulty": "Low" | "Medium" | "High"
    }
  ],
  "quickWins": [
    {
      "title": "string",
      "howTo": "string",
      "toolsNeeded": ["string"]
    }
  ],
  "recommendedNextStep": "string",
  "closingMessage": "string"
}

Requirements:
- topOpportunities: exactly 3 items, aligned with their industry and top time drains
- quickWins: 2–3 items achievable within 30 days using their existing stack where possible
- recommendedNextStep: reference the recommended package (${score.recommendedPackage})
- closingMessage: warm, professional sign-off from Clinovyr`;
}

function titleFromActionText(text: string, maxLength = 72): string {
  const firstClause = text.split(/[.·]/)[0]?.trim() ?? text.trim();
  if (firstClause.length <= maxLength) {
    return firstClause;
  }
  return `${firstClause.slice(0, maxLength - 1).trim()}…`;
}

function buildDevelopmentFallbackReport(
  formData: AssessmentFormData,
  score: AIReadinessScore,
): AssessmentReport {
  const opportunities = score.topOpportunities.slice(0, 3).map((title, index) => ({
    title,
    description: title,
    estimatedROI: score.estimatedAnnualROI,
    timeToImplement: index === 0 ? "4–8 weeks" : "6–12 weeks",
    difficulty: (index === 0 ? "Medium" : "Low") as "Low" | "Medium" | "High",
  }));

  const quickWins = score.quickWins.slice(0, 3).map((howTo) => ({
    title: titleFromActionText(howTo),
    howTo,
    toolsNeeded: [
      formData.crm.includes("None") ? "Lightweight CRM or spreadsheet" : formData.crm[0],
      formData.emailTools[0] ?? "Email platform",
    ],
  }));

  return {
    executiveSummary: `${formData.companyName} completed the Clinovyr AI Readiness Assessment with an overall score of ${score.overallScore}/100 (${score.tier} tier). This summary reflects scoring and intake responses for ${formData.industry} businesses of ${formData.employees} employees.`,
    currentStateAnalysis: `Your team relies on ${formData.crm.join(", ")} for CRM, ${formData.scheduling.join(", ")} for scheduling, and ${formData.pm.join(", ")} for project coordination. Top time drains are ${formData.timeDrainsRanked.slice(0, 3).join(", ")}, with AI comfort at ${formData.comfortLevel}/5 and primary concern: ${formData.biggestConcern}.`,
    topOpportunities: opportunities,
    quickWins,
    recommendedNextStep: `Schedule a discovery call to scope ${score.recommendedPackage} and validate ROI in the ${score.estimatedAnnualROI} range.`,
    closingMessage: `Thank you, ${formData.firstName} — Clinovyr looks forward to helping ${formData.companyName} put intelligence to work in Placer County.`,
  };
}

function parseReportJson(raw: string): AssessmentReport {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    console.error("[report-generator] Claude response did not contain JSON. Raw response:", raw);
    throw new Error("Claude response did not contain JSON.");
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as AssessmentReport;
    return parsed;
  } catch (error) {
    console.error("[report-generator] JSON.parse failed. Raw response:", raw);
    throw error;
  }
}

async function requestReportFromClaude(
  client: Anthropic,
  formData: AssessmentFormData,
  score: AIReadinessScore,
): Promise<AssessmentReport> {
  const basePrompt = buildPrompt(formData, score);
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_PARSE_ATTEMPTS; attempt++) {
    const prompt =
      attempt === 1 ? basePrompt : `${basePrompt}${JSON_RETRY_SUFFIX}`;

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");

    if (!textBlock || textBlock.type !== "text") {
      lastError = new Error("Claude returned an empty response.");
      console.warn(
        `[report-generator] Attempt ${attempt}/${MAX_PARSE_ATTEMPTS}: empty Claude response`,
      );
      continue;
    }

    try {
      return parseReportJson(textBlock.text);
    } catch (error) {
      lastError = error;
      console.warn(
        `[report-generator] Attempt ${attempt}/${MAX_PARSE_ATTEMPTS}: invalid JSON from Claude`,
      );
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to parse Claude report after retries.");
}

export async function generateAssessmentReport(
  formData: AssessmentFormData,
  score: AIReadinessScore,
): Promise<AssessmentReport> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ANTHROPIC_API_KEY is not configured. Report generation is unavailable.",
      );
    }
    console.warn(
      "[report-generator] ANTHROPIC_API_KEY missing — using development fallback report.",
    );
    return buildDevelopmentFallbackReport(formData, score);
  }

  const client = new Anthropic({ apiKey });
  return requestReportFromClaude(client, formData, score);
}
