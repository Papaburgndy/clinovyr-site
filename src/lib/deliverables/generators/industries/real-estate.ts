import type { Company, Survey } from "@prisma/client";
import { parseSurveyFormData } from "@/lib/deliverables/artifacts";
import { renderRealEstateAIReportPdf } from "@/lib/deliverables/generators/industries/real-estate-ai-report";
import { createRealEstateBlueprintZip } from "@/lib/deliverables/generators/industries/real-estate-blueprints";
import { renderRealEstateCrmGuidePdf } from "@/lib/deliverables/generators/industries/real-estate-crm-guide";
import { renderRealEstatePromptPackPdf } from "@/lib/deliverables/generators/industries/real-estate-prompt-pack";
import { buildRealEstateRoiFileResult } from "@/lib/deliverables/generators/industries/real-estate-roi";
import { companySlug } from "@/lib/deliverables/generators/industries/real-estate-shared";
import {
  pdfOutput,
  spreadsheetOutput,
  zipOutput,
} from "@/lib/deliverables/generators/shared";
import type {
  DeliverableGenerator,
  GeneratorContext,
  GeneratorOutput,
} from "@/lib/deliverables/generators/types";
import type { AssessmentFormData } from "@/types/assessment";

export type RealEstateGeneratorInput = {
  company: Company;
  survey: Survey;
  formData?: AssessmentFormData | null;
};

function resolveRealEstateContext(
  input: RealEstateGeneratorInput | GeneratorContext,
): GeneratorContext {
  if ("formData" in input && "company" in input && "survey" in input) {
    const ctx = input as GeneratorContext;
    return {
      company: ctx.company,
      survey: ctx.survey,
      formData: ctx.formData ?? parseSurveyFormData(ctx.survey),
    };
  }
  const { company, survey, formData } = input as RealEstateGeneratorInput;
  return {
    company,
    survey,
    formData: formData ?? parseSurveyFormData(survey),
  };
}

/** Comprehensive AI readiness report for real estate teams (PDF, ~12–16 pages). */
export async function generateRealEstateAIReport(
  input: RealEstateGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveRealEstateContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderRealEstateAIReportPdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("assessment-report-pdf", buffer, {
    filename: `${slug}-real-estate-ai-readiness-report.pdf`,
    displayName: "Real Estate AI Readiness Report",
  });
}

/** Agent prompt library with 15 copy-paste prompts (PDF desk reference). */
export async function generateRealEstateLeadQualifierPromptPack(
  input: RealEstateGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveRealEstateContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderRealEstatePromptPackPdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("tool-recommendations", buffer, {
    filename: `${slug}-agent-prompt-library.pdf`,
    displayName: "Real Estate Agent Prompt Library",
  });
}

/** ZIP of three Make.com real estate automation blueprints + README. */
export async function generateRealEstateAutomationBlueprints(
  input: RealEstateGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveRealEstateContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await createRealEstateBlueprintZip(ctx.company, ctx.survey);
  return zipOutput("automation-blueprints", buffer, {
    filename: `${slug}-real-estate-automation-blueprints.zip`,
    displayName: "Real Estate Automation Blueprint Pack",
  });
}

/** Three-sheet real estate ROI calculator (XLSX). */
export async function generateRealEstateROICalculator(
  input: RealEstateGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveRealEstateContext(input);
  const result = buildRealEstateRoiFileResult(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return spreadsheetOutput("roi-calculator", result.buffer, {
    filename: result.filename,
    displayName: result.displayName,
  });
}

/** Day 1–7 CRM setup guide sized to HubSpot / Follow Up Boss / GoHighLevel (PDF). */
export async function generateRealEstateCRMSetupGuide(
  input: RealEstateGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveRealEstateContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderRealEstateCrmGuidePdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("crm-setup-guide", buffer, {
    filename: `${slug}-crm-setup-guide.pdf`,
    displayName: "Real Estate CRM Setup Guide",
  });
}

/** Maps standard deliverable keys to real estate generators. */
export const REAL_ESTATE_DELIVERABLE_GENERATORS: Partial<
  Record<string, DeliverableGenerator>
> = {
  "assessment-report-pdf": generateRealEstateAIReport,
  "tool-recommendations": generateRealEstateLeadQualifierPromptPack,
  "automation-blueprints": generateRealEstateAutomationBlueprints,
  "roi-calculator": generateRealEstateROICalculator,
  "crm-setup-guide": generateRealEstateCRMSetupGuide,
};
