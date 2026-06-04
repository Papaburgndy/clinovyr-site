import { mapIndustryForScoring } from "@/lib/assessment-utils";
import type { ReadinessTier } from "@/lib/scoring";
import type { Survey } from "@prisma/client";

export type EnrichedOpportunity = {
  name: string;
  description: string;
  timeToImplement: string;
  roiRange: string;
};

export type TierInfo = {
  label: ReadinessTier;
  description: string;
};

export const TIER_INFO: Record<ReadinessTier, TierInfo> = {
  Foundation: {
    label: "Foundation",
    description:
      "Core systems and processes need attention before AI can deliver reliable ROI. Start with quick wins that build team confidence.",
  },
  Developing: {
    label: "Developing",
    description:
      "You have workable foundations with clear automation targets. Focused projects can reclaim meaningful hours within the next quarter.",
  },
  Advanced: {
    label: "Advanced",
    description:
      "Your stack and workflows are ready for deeper automation. Strategic AI investments can compound across departments.",
  },
  Leader: {
    label: "Leader",
    description:
      "You're positioned to lead your market with AI. Scale proven automations and explore advanced use cases for competitive advantage.",
  },
};

const IMPLEMENT_TIMelines = ["4–6 weeks", "6–10 weeks", "8–12 weeks"] as const;

function splitIntoSentences(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/(?<=[.!?])\s+/);
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`;
  }
  return `${trimmed}. This opportunity aligns with your top time drains and existing tools.`;
}

function enrichStringOpportunity(
  title: string,
  index: number,
  industry: string,
  roiRange: string,
): EnrichedOpportunity {
  const industryLabel = mapIndustryForScoring(industry) || industry;
  const description = splitIntoSentences(
    `${title} For ${industryLabel} businesses, this addresses a high-impact workflow with measurable time savings.`,
  );

  return {
    name: title,
    description,
    timeToImplement: IMPLEMENT_TIMelines[index] ?? "6–10 weeks",
    roiRange,
  };
}

function isEnrichedShape(
  value: unknown,
): value is EnrichedOpportunity & Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.name === "string" ||
    typeof obj.title === "string" ||
    typeof obj.description === "string"
  );
}

export function enrichTopOpportunities(
  topOpportunities: Survey["topOpportunities"],
  industry: string,
  estimatedROI: string | null | undefined,
): EnrichedOpportunity[] {
  if (!topOpportunities || !Array.isArray(topOpportunities)) return [];

  const roiRange = estimatedROI ?? "Varies by scope";

  return topOpportunities.slice(0, 3).map((item, index) => {
    if (typeof item === "string") {
      return enrichStringOpportunity(item, index, industry, roiRange);
    }

    if (isEnrichedShape(item)) {
      const name =
        (item.name as string | undefined) ??
        (item.title as string | undefined) ??
        `Opportunity ${index + 1}`;
      const rawDescription =
        (item.description as string | undefined) ?? name;

      return {
        name,
        description: splitIntoSentences(rawDescription),
        timeToImplement:
          (item.timeToImplement as string | undefined) ??
          IMPLEMENT_TIMelines[index] ??
          "6–10 weeks",
        roiRange:
          (item.estimatedROI as string | undefined) ??
          (item.roiRange as string | undefined) ??
          roiRange,
      };
    }

    return enrichStringOpportunity(
      `AI automation opportunity ${index + 1}`,
      index,
      industry,
      roiRange,
    );
  });
}

export function getScoreGaugeColor(score: number): string {
  if (score <= 40) return "#d97706";
  if (score <= 70) return "#2d9e88";
  return "#c49a3c";
}

export function getTierFromScore(score: number): ReadinessTier {
  if (score >= 80) return "Leader";
  if (score >= 60) return "Advanced";
  if (score >= 40) return "Developing";
  return "Foundation";
}
