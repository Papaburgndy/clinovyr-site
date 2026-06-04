import type { RecommendedPackage } from "@/lib/scoring";

export type PackageId =
  | "ai-opportunity-audit"
  | "ai-readiness-assessment"
  | "workflow-automation-sprint";

export type PackageDetails = {
  id: PackageId;
  name: string;
  priceCents: number;
  bullets: string[];
  deliverables: string[];
};

export const PACKAGES: Record<RecommendedPackage, PackageDetails> = {
  "AI Opportunity Audit ($1,500)": {
    id: "ai-opportunity-audit",
    name: "AI Opportunity Audit",
    priceCents: 150_000,
    bullets: [
      "90-minute discovery session with a Clinovyr strategist",
      "Top 5 automation opportunities ranked by ROI",
      "Tool and integration recommendations for your stack",
      "30-day action plan you can execute immediately",
    ],
    deliverables: [
      "AI Opportunity Audit PDF report",
      "ROI projection worksheet",
      "Vendor comparison checklist",
    ],
  },
  "AI Readiness Assessment ($5,000)": {
    id: "ai-readiness-assessment",
    name: "AI Readiness Assessment",
    priceCents: 500_000,
    bullets: [
      "Full AI readiness score breakdown across 5 categories",
      "Custom roadmap with phased implementation timeline",
      "3 prioritized automation blueprints for your workflows",
      "90-day success metrics and KPI tracking framework",
    ],
    deliverables: [
      "Complete AI Readiness Assessment PDF",
      "Custom automation blueprint documents",
      "n8n workflow starter templates",
      "Implementation timeline spreadsheet",
    ],
  },
  "Workflow Automation Sprint ($12,000)": {
    id: "workflow-automation-sprint",
    name: "Workflow Automation Sprint",
    priceCents: 1_200_000,
    bullets: [
      "Two production-ready automations built and deployed",
      "Integration with your existing CRM and tools",
      "Team training session and documentation",
      "30-day post-launch support and optimization",
    ],
    deliverables: [
      "Deployed automation workflows (n8n)",
      "Technical documentation and runbooks",
      "Team training recording",
      "Performance monitoring dashboard setup",
    ],
  },
};

export function getPackageByRecommended(
  recommendedPkg: string | null | undefined,
): PackageDetails {
  if (recommendedPkg && recommendedPkg in PACKAGES) {
    return PACKAGES[recommendedPkg as RecommendedPackage];
  }
  return PACKAGES["AI Readiness Assessment ($5,000)"];
}

export function resolveRecommendedPackageKey(
  recommendedPkg: string | null | undefined,
): RecommendedPackage {
  if (recommendedPkg && recommendedPkg in PACKAGES) {
    return recommendedPkg as RecommendedPackage;
  }
  return "AI Readiness Assessment ($5,000)";
}
