import {
  getPackageByRecommended,
  type PackageId,
} from "@/lib/packages";
import type { RecommendedPackage } from "@/lib/scoring";

export const CLINOVYR_PRODUCTS = {
  "AI Opportunity Audit": {
    stripePriceId: "price_xxx_audit",
    amount: 150_000,
    name: "AI Opportunity Audit",
    description:
      "Your top AI automation opportunities ranked by ROI, with implementation checklist and tool recommendations — delivered in minutes, setup call included",
    deliverables: [
      "opportunity-brief",
      "implementation-checklist",
      "tool-recommendations",
    ],
  },
  "AI Readiness Assessment": {
    stripePriceId: "price_xxx_assessment",
    amount: 500_000,
    name: "AI Readiness Assessment",
    description:
      "Complete AI readiness package: full report, prioritized roadmap, tool stack guide, and executive briefing — delivered in minutes, setup sessions included",
    deliverables: [
      "assessment-report-pdf",
      "opportunity-roadmap",
      "tool-stack-guide",
      "implementation-checklist",
      "executive-presentation",
    ],
  },
  "Workflow Automation Sprint": {
    stripePriceId: "price_xxx_sprint",
    amount: 1_200_000,
    name: "Workflow Automation Sprint",
    description:
      "Build-ready automation package: importable blueprints, CRM setup guide, training guide, and live ROI calculator — with working sessions where we implement your first automations with you",
    deliverables: [
      "assessment-report-pdf",
      "opportunity-roadmap",
      "automation-blueprints",
      "crm-setup-guide",
      "staff-training-guide",
      "roi-calculator",
    ],
  },
} as const;

export type ClinovyrProductKey = keyof typeof CLINOVYR_PRODUCTS;

export type ClinovyrProduct = (typeof CLINOVYR_PRODUCTS)[ClinovyrProductKey];

const STRIPE_PRICE_ENV: Record<ClinovyrProductKey, string> = {
  "AI Opportunity Audit": "STRIPE_PRICE_AUDIT",
  "AI Readiness Assessment": "STRIPE_PRICE_ASSESSMENT",
  "Workflow Automation Sprint": "STRIPE_PRICE_SPRINT",
};

const PACKAGE_KEY_TO_PRODUCT: Record<RecommendedPackage, ClinovyrProductKey> = {
  "AI Opportunity Audit ($1,500)": "AI Opportunity Audit",
  "AI Readiness Assessment ($5,000)": "AI Readiness Assessment",
  "Workflow Automation Sprint ($12,000)": "Workflow Automation Sprint",
};

const PACKAGE_ID_TO_PRODUCT: Record<PackageId, ClinovyrProductKey> = {
  "ai-opportunity-audit": "AI Opportunity Audit",
  "ai-readiness-assessment": "AI Readiness Assessment",
  "workflow-automation-sprint": "Workflow Automation Sprint",
};

export function isPlaceholderStripePriceId(priceId: string): boolean {
  return priceId.startsWith("price_xxx");
}

export function getProductStripePriceId(key: ClinovyrProductKey): string {
  const envName = STRIPE_PRICE_ENV[key];
  const fromEnv = process.env[envName]?.trim();
  if (fromEnv) return fromEnv;
  return CLINOVYR_PRODUCTS[key].stripePriceId;
}

export function resolveProductKey(
  recommendedPkg: string | null | undefined,
): ClinovyrProductKey {
  if (recommendedPkg && recommendedPkg in CLINOVYR_PRODUCTS) {
    return recommendedPkg as ClinovyrProductKey;
  }

  if (recommendedPkg && recommendedPkg in PACKAGE_KEY_TO_PRODUCT) {
    return PACKAGE_KEY_TO_PRODUCT[recommendedPkg as RecommendedPackage];
  }

  const packageDetails = getPackageByRecommended(recommendedPkg);
  return PACKAGE_ID_TO_PRODUCT[packageDetails.id];
}

export function getProduct(key: ClinovyrProductKey): ClinovyrProduct {
  return CLINOVYR_PRODUCTS[key];
}
