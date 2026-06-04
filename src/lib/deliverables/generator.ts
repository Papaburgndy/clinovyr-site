import type { Company } from "@prisma/client";
import {
  CLINOVYR_PRODUCTS,
  getProduct,
  type ClinovyrProductKey,
} from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { parseSurveyFormData } from "@/lib/deliverables/artifacts";
import { sendDeliveryEmail } from "@/lib/emails/delivery-email";
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
import type {
  DeliverableGenerator,
  GeneratorContext,
} from "@/lib/deliverables/generators/types";
import { uploadDeliverable } from "@/lib/deliverables/storage";
import type {
  DeliverableRecord,
  TriggerDeliverableGenerationParams,
} from "@/lib/deliverables/types";

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

/**
 * Resolves the generator for a deliverable key.
 * Industry companies receive industry-specific PDFs, ZIP blueprints, and ROI sheets;
 * unmapped keys fall back to generic generators.
 */
export function resolveDeliverableGenerator(
  key: string,
  company: Company,
): DeliverableGenerator | undefined {
  const normalized = normalizeIndustry(company.industry);
  const industryGenerators =
    INDUSTRY_GENERATOR_MAP[company.industry] ??
    (normalized ? INDUSTRY_GENERATOR_MAP[normalized] : undefined) ??
    INDUSTRY_GENERATOR_MAP["Medical & Dental"];

  return industryGenerators[key] ?? GENERATORS[key];
}

function normalizeDeliverableKeys(
  keys: string[],
  product: string,
): string[] {
  if (keys.length > 0 && typeof keys[0] === "string") {
    return keys;
  }

  if (product in CLINOVYR_PRODUCTS) {
    return [...getProduct(product as ClinovyrProductKey).deliverables];
  }

  return keys;
}

/**
 * Fire-and-forget from the Stripe webhook — do not await in the request handler.
 */
export function triggerDeliverableGeneration(
  params: TriggerDeliverableGenerationParams,
): void {
  void runDeliverableGeneration(params).catch((error) => {
    console.error("[deliverables/generator] unhandled error:", error);
  });
}

export async function runDeliverableGeneration(
  params: TriggerDeliverableGenerationParams,
): Promise<void> {
  const { companyId, product, orderId } = params;
  const deliverableKeys = normalizeDeliverableKeys(
    params.deliverableKeys,
    product,
  );

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    console.error("[deliverables/generator] order not found:", orderId);
    return;
  }

  if (order.status === "delivered") {
    console.info("[deliverables/generator] already delivered:", orderId);
    return;
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { survey: true, user: true },
  });

  if (!company) {
    console.error("[deliverables/generator] company not found:", companyId);
    return;
  }

  if (!company.survey) {
    console.warn(
      "[deliverables/generator] no survey — skipping generation:",
      companyId,
    );
    return;
  }

  const ctx: GeneratorContext = {
    company,
    survey: company.survey,
    formData: parseSurveyFormData(company.survey),
  };

  const normalized = normalizeIndustry(company.industry);
  const industryGenerators =
    INDUSTRY_GENERATOR_MAP[company.industry] ??
    (normalized ? INDUSTRY_GENERATOR_MAP[normalized] : undefined) ??
    INDUSTRY_GENERATOR_MAP["Medical & Dental"];

  const records: DeliverableRecord[] = [];

  for (const key of deliverableKeys) {
    const generator = industryGenerators[key] ?? GENERATORS[key];

    if (!generator) {
      console.warn("[deliverables/generator] unknown deliverable key:", key);
      continue;
    }

    try {
      const output = await generator(ctx);

      if (!output) {
        console.warn(
          `[deliverables/generator] generator returned nothing for ${key}`,
        );
        continue;
      }

      const upload = await uploadDeliverable(
        companyId,
        output.filename,
        output.buffer,
        output.mimeType,
      );

      if (!upload.ok) {
        console.error(
          `[deliverables/generator] upload failed for ${key}:`,
          upload.error,
        );
        continue;
      }

      records.push({
        key,
        name: output.displayName,
        url: upload.url,
        type: output.type,
        size: upload.size,
      });

      console.info(
        `[deliverables/generator] uploaded ${key} via ${upload.storage} (${upload.size} bytes)`,
      );
    } catch (error) {
      console.error(`[deliverables/generator] failed to generate ${key}:`, error);
    }
  }

  if (records.length === 0) {
    console.error("[deliverables/generator] no deliverables produced:", orderId);
    return;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "delivered",
      deliverables: records,
      deliveredAt: new Date(),
    },
  });

  await sendDeliveryEmail({ companyId, product, deliverables: records });

  console.info(
    `[deliverables/generator] delivered ${records.length} files for order ${orderId}`,
  );
}
