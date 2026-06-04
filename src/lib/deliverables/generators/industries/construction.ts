import type { Company, Survey } from "@prisma/client";
import { parseSurveyFormData } from "@/lib/deliverables/artifacts";
import { renderConstructionAIReportPdf } from "@/lib/deliverables/generators/industries/construction-ai-report";
import { renderConstructionBidGuidePdf } from "@/lib/deliverables/generators/industries/construction-bid-guide";
import { createConstructionBlueprintZip } from "@/lib/deliverables/generators/industries/construction-blueprints";
import { renderConstructionCommunicationKitPdf } from "@/lib/deliverables/generators/industries/construction-communication-kit";
import { buildConstructionRoiFileResult } from "@/lib/deliverables/generators/industries/construction-roi";
import { companySlug } from "@/lib/deliverables/generators/industries/construction-shared";
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

export type ConstructionGeneratorInput = {
  company: Company;
  survey: Survey;
  formData?: AssessmentFormData | null;
};

function resolveConstructionContext(
  input: ConstructionGeneratorInput | GeneratorContext,
): GeneratorContext {
  if ("formData" in input && "company" in input && "survey" in input) {
    const ctx = input as GeneratorContext;
    return {
      company: ctx.company,
      survey: ctx.survey,
      formData: ctx.formData ?? parseSurveyFormData(ctx.survey),
    };
  }
  const { company, survey, formData } = input as ConstructionGeneratorInput;
  return {
    company,
    survey,
    formData: formData ?? parseSurveyFormData(survey),
  };
}

/** Comprehensive AI readiness report for contractors (PDF, ~12–14 pages). */
export async function generateConstructionAIReport(
  input: ConstructionGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveConstructionContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderConstructionAIReportPdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("assessment-report-pdf", buffer, {
    filename: `${slug}-construction-ai-readiness-report.pdf`,
    displayName: "Construction AI Readiness Report",
  });
}

/** Bid assistant guide with 5-step prompts and sample I/O (PDF). */
export async function generateConstructionBidAssistantGuide(
  input: ConstructionGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveConstructionContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderConstructionBidGuidePdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("opportunity-brief", buffer, {
    filename: `${slug}-ai-bid-assistant-guide.pdf`,
    displayName: "AI Bid Assistant Guide",
  });
}

/** ZIP of two n8n construction workflow JSON files + README. */
export async function generateConstructionAutomationBlueprints(
  input: ConstructionGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveConstructionContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await createConstructionBlueprintZip(ctx.company, ctx.survey);
  return zipOutput("automation-blueprints", buffer, {
    filename: `${slug}-construction-automation-blueprints.zip`,
    displayName: "Construction Automation Blueprint Pack (n8n)",
  });
}

/** Subcontractor & client message template kit (PDF, 10 templates). */
export async function generateConstructionSubcontractorCommunicationKit(
  input: ConstructionGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveConstructionContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderConstructionCommunicationKitPdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("staff-training-guide", buffer, {
    filename: `${slug}-subcontractor-communication-kit.pdf`,
    displayName: "Subcontractor Communication Kit",
  });
}

/** Owner-time-focused ROI calculator (XLSX). */
export async function generateConstructionROICalculator(
  input: ConstructionGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveConstructionContext(input);
  const result = buildConstructionRoiFileResult(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return spreadsheetOutput("roi-calculator", result.buffer, {
    filename: result.filename,
    displayName: result.displayName,
  });
}

/** Maps standard deliverable keys to construction generators. */
export const CONSTRUCTION_DELIVERABLE_GENERATORS: Partial<
  Record<string, DeliverableGenerator>
> = {
  "assessment-report-pdf": generateConstructionAIReport,
  "opportunity-brief": generateConstructionBidAssistantGuide,
  "automation-blueprints": generateConstructionAutomationBlueprints,
  "staff-training-guide": generateConstructionSubcontractorCommunicationKit,
  "tool-recommendations": generateConstructionSubcontractorCommunicationKit,
  "roi-calculator": generateConstructionROICalculator,
};
