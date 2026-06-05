import type { Company } from "@prisma/client";
import { GENERATORS } from "@/lib/deliverables/generators/index";
import {
  generateConstructionAIReport,
  generateConstructionAutomationBlueprints,
  generateConstructionBidAssistantGuide,
  generateConstructionROICalculator,
  generateConstructionSubcontractorCommunicationKit,
} from "@/lib/deliverables/generators/industries/construction";
import {
  generateLegalAIReport,
  generateLegalClientIntakeSystem,
  generateLegalComplianceChecklist,
  generateLegalPromptLibrary,
  generateLegalROICalculator,
} from "@/lib/deliverables/generators/industries/legal";
import {
  generateMedicalAIReport,
  generateMedicalBlueprintPack,
  generateMedicalHIPAAGuide,
  generateMedicalROICalculator,
  generateMedicalRoadmap,
} from "@/lib/deliverables/generators/industries/medical";
import {
  generateRealEstateAIReport,
  generateRealEstateAutomationBlueprints,
  generateRealEstateCRMSetupGuide,
  generateRealEstateLeadQualifierPromptPack,
  generateRealEstateROICalculator,
} from "@/lib/deliverables/generators/industries/real-estate";
import {
  generateRetailAIReport,
  generateRetailCustomerWinBackKit,
  generateRetailReviewManagementKit,
  generateRetailROICalculator,
  generateRetailSocialContentPack,
} from "@/lib/deliverables/generators/industries/retail";
import {
  generateWellnessAIReport,
  generateWellnessAutomationBlueprints,
  generateWellnessRetentionPlaybook,
  generateWellnessROICalculator,
  generateWellnessSocialContentPack,
} from "@/lib/deliverables/generators/industries/wellness";
import { OTHER_DELIVERABLE_GENERATORS } from "@/lib/deliverables/generators/industries/generic";
import type { DeliverableGenerator } from "@/lib/deliverables/generators/types";

type GeneratorFn = DeliverableGenerator;

const INDUSTRY_GENERATOR_MAP: Record<string, Record<string, GeneratorFn>> = {
  "Medical & Dental": {
    "assessment-report-pdf": generateMedicalAIReport,
    "automation-blueprints": generateMedicalBlueprintPack,
    "tool-stack-guide": generateMedicalHIPAAGuide,
    "hipaa-tool-guide": generateMedicalHIPAAGuide,
    "medical-hipaa-guide": generateMedicalHIPAAGuide,
    "roi-calculator": generateMedicalROICalculator,
    "opportunity-roadmap": generateMedicalRoadmap,
    "implementation-checklist": generateMedicalRoadmap,
  },
  "Real Estate & Property": {
    "assessment-report-pdf": generateRealEstateAIReport,
    "opportunity-roadmap": generateRealEstateLeadQualifierPromptPack,
    "tool-recommendations": generateRealEstateLeadQualifierPromptPack,
    "automation-blueprints": generateRealEstateAutomationBlueprints,
    "roi-calculator": generateRealEstateROICalculator,
    "crm-setup-guide": generateRealEstateCRMSetupGuide,
  },
  "Legal & Financial": {
    "assessment-report-pdf": generateLegalAIReport,
    "opportunity-roadmap": generateLegalPromptLibrary,
    "tool-recommendations": generateLegalPromptLibrary,
    "automation-blueprints": generateLegalClientIntakeSystem,
    "crm-setup-guide": generateLegalClientIntakeSystem,
    "opportunity-brief": generateLegalClientIntakeSystem,
    "roi-calculator": generateLegalROICalculator,
    "implementation-checklist": generateLegalComplianceChecklist,
  },
  "Construction & Contracting": {
    "assessment-report-pdf": generateConstructionAIReport,
    "opportunity-roadmap": generateConstructionBidAssistantGuide,
    "opportunity-brief": generateConstructionBidAssistantGuide,
    "automation-blueprints": generateConstructionAutomationBlueprints,
    "staff-training-guide": generateConstructionSubcontractorCommunicationKit,
    "tool-recommendations": generateConstructionSubcontractorCommunicationKit,
    "roi-calculator": generateConstructionROICalculator,
  },
  "Wellness & Med Spa": {
    "assessment-report-pdf": generateWellnessAIReport,
    "opportunity-roadmap": generateWellnessSocialContentPack,
    "tool-recommendations": generateWellnessSocialContentPack,
    "executive-presentation": generateWellnessSocialContentPack,
    "automation-blueprints": generateWellnessAutomationBlueprints,
    "staff-training-guide": generateWellnessRetentionPlaybook,
    "roi-calculator": generateWellnessROICalculator,
  },
  "Retail & Hospitality": {
    "assessment-report-pdf": generateRetailAIReport,
    "opportunity-roadmap": generateRetailCustomerWinBackKit,
    "opportunity-brief": generateRetailCustomerWinBackKit,
    "automation-blueprints": generateRetailReviewManagementKit,
    "implementation-checklist": generateRetailReviewManagementKit,
    "crm-setup-guide": generateRetailReviewManagementKit,
    "tool-stack-guide": generateRetailReviewManagementKit,
    "staff-training-guide": generateRetailSocialContentPack,
    "tool-recommendations": generateRetailSocialContentPack,
    "executive-presentation": generateRetailSocialContentPack,
    "roi-calculator": generateRetailROICalculator,
  },
  Other: OTHER_DELIVERABLE_GENERATORS,
};

const INDUSTRY_ALIASES: Record<string, string> = {
  medical: "Medical & Dental",
  "medical/dental": "Medical & Dental",
  dental: "Medical & Dental",
  "real estate": "Real Estate & Property",
  "real estate & property": "Real Estate & Property",
  property: "Real Estate & Property",
  legal: "Legal & Financial",
  "legal/financial": "Legal & Financial",
  "legal & financial": "Legal & Financial",
  financial: "Legal & Financial",
  ria: "Legal & Financial",
  construction: "Construction & Contracting",
  "construction & contracting": "Construction & Contracting",
  contracting: "Construction & Contracting",
  contractor: "Construction & Contracting",
  wellness: "Wellness & Med Spa",
  "wellness/med spa": "Wellness & Med Spa",
  "wellness & med spa": "Wellness & Med Spa",
  "med spa": "Wellness & Med Spa",
  spa: "Wellness & Med Spa",
  retail: "Retail & Hospitality",
  "retail & hospitality": "Retail & Hospitality",
  hospitality: "Retail & Hospitality",
  other: "Other",
};

/** Normalize onboarding/survey industry strings to INDUSTRY_GENERATOR_MAP keys. */
export function normalizeIndustry(industry: string): string | undefined {
  const trimmed = industry.trim();
  if (trimmed in INDUSTRY_GENERATOR_MAP) return trimmed;

  const lower = trimmed.toLowerCase();
  if (lower in INDUSTRY_ALIASES) return INDUSTRY_ALIASES[lower];

  for (const [pattern, canonical] of Object.entries(INDUSTRY_ALIASES)) {
    if (lower.includes(pattern)) return canonical;
  }

  return undefined;
}

export function getIndustryGeneratorMap(
  industry: string,
): Record<string, GeneratorFn> | undefined {
  const trimmed = industry.trim();
  if (trimmed in INDUSTRY_GENERATOR_MAP) {
    return INDUSTRY_GENERATOR_MAP[trimmed];
  }

  const normalized = normalizeIndustry(trimmed);
  if (normalized) {
    return INDUSTRY_GENERATOR_MAP[normalized];
  }

  return undefined;
}

/**
 * Resolves the generator for a deliverable key.
 * Industry companies receive industry-specific PDFs, ZIP blueprints, and ROI sheets;
 * unmapped keys fall back to generic generators.
 */
export function resolveDeliverableGenerator(
  key: string,
  company: Company,
): DeliverableGenerator | undefined {
  const industryGenerators = getIndustryGeneratorMap(company.industry);
  return industryGenerators?.[key] ?? GENERATORS[key];
}
