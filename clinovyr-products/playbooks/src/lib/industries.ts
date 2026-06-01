import type { IndustryConfig } from "./types";

export const INDUSTRIES: IndustryConfig[] = [
  {
    key: "Medical",
    label: "Medical & Dental",
    slug: "medical",
    titleSuffix: "Medical & Dental Practices",
    audience: "practice owners, office managers, and clinical administrators",
  },
  {
    key: "Real Estate",
    label: "Real Estate",
    slug: "real-estate",
    titleSuffix: "Real Estate Brokerages & Teams",
    audience: "brokers, team leads, and transaction coordinators",
  },
  {
    key: "Legal",
    label: "Legal",
    slug: "legal",
    titleSuffix: "Law Firms & Legal Practices",
    audience: "managing partners, office administrators, and paralegals",
  },
  {
    key: "Construction",
    label: "Construction",
    slug: "construction",
    titleSuffix: "Construction & Trades Businesses",
    audience: "general contractors, project managers, and operations leads",
  },
  {
    key: "Wellness",
    label: "Wellness & Med Spa",
    slug: "wellness",
    titleSuffix: "Wellness, Med Spa & Specialty Retail",
    audience: "owners, spa directors, and front-desk managers",
  },
];

export function getIndustryByKey(key: string): IndustryConfig | undefined {
  return INDUSTRIES.find(
    (industry) =>
      industry.key.toLowerCase() === key.toLowerCase() ||
      industry.slug === key.toLowerCase(),
  );
}

export function getIndustryBySlug(slug: string): IndustryConfig | undefined {
  return INDUSTRIES.find((industry) => industry.slug === slug.toLowerCase());
}

export function buildPlaybookTitle(industry: IndustryConfig): string {
  return `The AI Implementation Playbook for ${industry.titleSuffix}`;
}

export function chapterTitleForIndustry(
  baseTitle: string,
  industry: IndustryConfig,
): string {
  if (baseTitle === "The 7 Highest-ROI AI Use Cases") {
    return `The 7 Highest-ROI AI Use Cases for ${industry.label}`;
  }
  return baseTitle;
}
