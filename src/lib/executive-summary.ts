import type { AssessmentFormData } from "@/types/assessment";
import type { AIReadinessScore } from "@/lib/scoring";

const CLAUDE_MODEL = "claude-sonnet-4-6";

export type SurveyNarrative = {
  executiveSummary: string;
  biggestOpportunity: string;
  readinessStatement: string;
  nextStep: string;
};

type CompanyContext = {
  name: string;
  industry: string;
  size: string;
  revenue: string;
};

const NARRATIVE_SYSTEM_PROMPT = `You are writing a personalized AI readiness summary for a Clinovyr client. 
Be warm, specific, and encouraging. Use the client's actual data. 
Do NOT be generic. Reference their specific industry, size, and pain points.
Output ONLY a JSON object with these fields:
{
  "executiveSummary": "2 paragraphs, warm and personalized",
  "biggestOpportunity": "1 sentence — their single highest-impact AI win",
  "readinessStatement": "1 sentence — honest assessment of where they are",
  "nextStep": "1 sentence — what we recommend they do immediately"
}`;

const JSON_RETRY_SUFFIX =
  "\n\nReturn ONLY a valid JSON object with all four fields. No markdown, no preamble.";

function estimateHoursSavedPerWeek(employees: string): string {
  const ranges: Record<string, string> = {
    "1–5": "5–12",
    "6–20": "10–20",
    "21–50": "15–30",
    "51–200": "25–45",
    "200+": "40–70",
  };
  return ranges[employees] ?? "10–20";
}

function tierReadinessStatement(tier: string, score: number): string {
  const statements: Record<string, string> = {
    Foundation: `At ${score}/100, you're building from a solid foundation — the right systems and workflows will unlock meaningful gains.`,
    Developing: `Your ${score}/100 score puts you in a strong position to adopt targeted AI wins without a major overhaul.`,
    Advanced: `With a ${score}/100 score, your organization is well-positioned to scale AI across multiple workflows.`,
    Leader: `Your ${score}/100 score reflects AI-ready operations — you're positioned to lead in your market.`,
  };
  return statements[tier] ?? `Your ${score}/100 readiness score shows clear potential for practical AI adoption.`;
}

export function buildFallbackNarrative(
  formData: AssessmentFormData,
  score: AIReadinessScore,
): SurveyNarrative {
  const hoursSaved = estimateHoursSavedPerWeek(formData.employees);
  const topOpportunity = score.topOpportunities[0] ?? "workflow automation";
  const topDrain = formData.timeDrainsRanked[0] ?? "administrative tasks";

  const executiveSummary = `${formData.companyName} scored ${score.overallScore}/100 on the Clinovyr AI Readiness Assessment, placing you in the ${score.tier} tier. As a ${formData.industry} business with ${formData.employees} employees, your team is spending significant time on ${topDrain.toLowerCase()} — exactly the kind of work AI handles well.

Your highest-impact opportunity is ${topOpportunity.toLowerCase()}, which could save an estimated ${hoursSaved} hours per week across your team. With a projected annual ROI of ${score.estimatedAnnualROI}, you're well-positioned to turn these insights into deployed automations that free your team for higher-value work.`;

  return {
    executiveSummary,
    biggestOpportunity: `Automating ${topOpportunity.toLowerCase()} is your single highest-impact win — it directly addresses ${topDrain.toLowerCase()}, your team's top time drain.`,
    readinessStatement: tierReadinessStatement(score.tier, score.overallScore),
    nextStep: `We recommend starting with ${score.recommendedPackage} — a focused engagement designed to deploy your top automation within 30 days.`,
  };
}

function buildClientDataMessage(
  formData: AssessmentFormData,
  score: AIReadinessScore,
  company: CompanyContext,
): string {
  const techStack = [
    ...formData.crm.map((tool) => `CRM: ${tool}`),
    ...formData.emailTools.map((tool) => `Email: ${tool}`),
    ...formData.scheduling.map((tool) => `Scheduling: ${tool}`),
    ...formData.pm.map((tool) => `PM: ${tool}`),
    ...formData.accounting.map((tool) => `Accounting: ${tool}`),
  ];

  return `Client data:
Company: ${company.name}
Industry: ${company.industry}
Size: ${company.size} (${formData.employees} employees)
Revenue: ${company.revenue} (${formData.revenue})
Years in business: ${formData.yearsInBusiness}

Time drains (ranked): ${formData.timeDrainsRanked.join(", ")}
Tech stack: ${techStack.length > 0 ? techStack.join("; ") : "None specified"}
AI experience: ${formData.aiTools}
Tech comfort (1-5): ${formData.comfortLevel ?? "Not specified"}
Biggest concern: ${formData.biggestConcern || "Not specified"}
Goals: ${formData.goals.join(", ") || "Not specified"}
Additional notes: ${formData.additionalNotes || "None"}

Assessment scores:
Overall: ${score.overallScore}/100 (${score.tier} tier)
Tech stack: ${score.categoryScores.techStack}/100
Process maturity: ${score.categoryScores.processMaturity}/100
Data readiness: ${score.categoryScores.dataReadiness}/100
Adoption readiness: ${score.categoryScores.adoptionReadiness}/100
ROI potential: ${score.categoryScores.roi_potential}/100

Top opportunities: ${score.topOpportunities.join("; ")}
Quick wins: ${score.quickWins.join("; ")}
Estimated annual ROI: ${score.estimatedAnnualROI}
Recommended package: ${score.recommendedPackage}`;
}

function parseNarrativeJson(text: string): SurveyNarrative {
  const jsonMatch = text.trim().match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Claude response did not contain JSON.");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Partial<SurveyNarrative>;

  if (
    typeof parsed.executiveSummary !== "string" ||
    typeof parsed.biggestOpportunity !== "string" ||
    typeof parsed.readinessStatement !== "string" ||
    typeof parsed.nextStep !== "string"
  ) {
    throw new Error("Claude JSON missing required narrative fields.");
  }

  return {
    executiveSummary: parsed.executiveSummary.trim(),
    biggestOpportunity: parsed.biggestOpportunity.trim(),
    readinessStatement: parsed.readinessStatement.trim(),
    nextStep: parsed.nextStep.trim(),
  };
}

async function requestFromClaude(
  formData: AssessmentFormData,
  score: AIReadinessScore,
  company: CompanyContext,
  apiKey: string,
  retrySuffix = "",
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 600,
      system: NARRATIVE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `${buildClientDataMessage(formData, score, company)}${retrySuffix}`,
        },
      ],
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
  if (!textBlock?.text) {
    throw new Error("Claude returned an empty response.");
  }

  return textBlock.text;
}

async function requestAndParseNarrative(
  formData: AssessmentFormData,
  score: AIReadinessScore,
  company: CompanyContext,
  apiKey: string,
): Promise<SurveyNarrative> {
  let text = await requestFromClaude(formData, score, company, apiKey);

  try {
    return parseNarrativeJson(text);
  } catch (firstParseError) {
    console.warn(
      "[executive-summary] JSON parse failed, retrying once:",
      firstParseError,
    );
    text = await requestFromClaude(
      formData,
      score,
      company,
      apiKey,
      JSON_RETRY_SUFFIX,
    );
    return parseNarrativeJson(text);
  }
}

export async function generateSurveyNarrative(
  formData: AssessmentFormData,
  score: AIReadinessScore,
  company: CompanyContext,
): Promise<SurveyNarrative> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    console.warn(
      "[executive-summary] ANTHROPIC_API_KEY missing — using fallback template.",
    );
    return buildFallbackNarrative(formData, score);
  }

  try {
    return await requestAndParseNarrative(formData, score, company, apiKey);
  } catch (error) {
    console.error("[executive-summary] Claude generation failed:", error);
    return buildFallbackNarrative(formData, score);
  }
}
