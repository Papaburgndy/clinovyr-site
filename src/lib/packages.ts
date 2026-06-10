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
      "Your top automation opportunities ranked by ROI, specific to your industry",
      "30-day implementation checklist you can execute immediately",
      "Tool and integration recommendations for your existing stack",
      "Setup call with Clinovyr plus email support while you implement",
    ],
    deliverables: [
      "AI Opportunity Brief (PDF)",
      "Implementation Checklist (PDF)",
      "Tool Recommendations Guide (PDF)",
    ],
  },
  "AI Readiness Assessment ($5,000)": {
    id: "ai-readiness-assessment",
    name: "AI Readiness Assessment",
    priceCents: 500_000,
    bullets: [
      "Full AI readiness score breakdown across 5 categories",
      "Prioritized opportunity roadmap with phased implementation timeline",
      "Tool stack guide and implementation checklist for your workflows",
      "Executive briefing deck plus setup sessions and 30-day email support",
    ],
    deliverables: [
      "AI Readiness Assessment Report (PDF)",
      "Opportunity Roadmap (PDF)",
      "Tool Stack Guide (PDF)",
      "Implementation Checklist (PDF)",
      "Executive Briefing (PDF)",
    ],
  },
  "Workflow Automation Sprint ($12,000)": {
    id: "workflow-automation-sprint",
    name: "Workflow Automation Sprint",
    priceCents: 1_200_000,
    bullets: [
      "Importable automation blueprints built for your industry's workflows",
      "CRM setup guide and staff training guide for smooth adoption",
      "ROI calculator with live, editable formulas to track your numbers",
      "Working sessions where we implement your first automations with you, plus 30-day support",
    ],
    deliverables: [
      "AI Readiness Report + Opportunity Roadmap (PDF)",
      "Automation Blueprint Pack (importable)",
      "CRM Setup Guide (PDF)",
      "Staff Training Guide (PDF)",
      "ROI Calculator (Excel, live formulas)",
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
