import type { Company, Survey } from "@prisma/client";
import { parseSurveyFormData } from "@/lib/deliverables/artifacts";
import { renderWellnessAIReportPdf } from "@/lib/deliverables/generators/industries/wellness-ai-report";
import { createWellnessBlueprintZip } from "@/lib/deliverables/generators/industries/wellness-blueprints";
import { renderWellnessRetentionPlaybookPdf } from "@/lib/deliverables/generators/industries/wellness-retention-playbook";
import { buildWellnessRoiFileResult } from "@/lib/deliverables/generators/industries/wellness-roi";
import { renderWellnessSocialContentPackPdf } from "@/lib/deliverables/generators/industries/wellness-social-content-pack";
import { companySlug } from "@/lib/deliverables/generators/industries/wellness-shared";
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

export type WellnessGeneratorInput = {
  company: Company;
  survey: Survey;
  formData?: AssessmentFormData | null;
};

function resolveWellnessContext(
  input: WellnessGeneratorInput | GeneratorContext,
): GeneratorContext {
  if ("formData" in input && "company" in input && "survey" in input) {
    const ctx = input as GeneratorContext;
    return {
      company: ctx.company,
      survey: ctx.survey,
      formData: ctx.formData ?? parseSurveyFormData(ctx.survey),
    };
  }
  const { company, survey, formData } = input as WellnessGeneratorInput;
  return {
    company,
    survey,
    formData: formData ?? parseSurveyFormData(survey),
  };
}

/** Comprehensive wellness/med spa AI readiness report (PDF, ~12–14 pages). */
export async function generateWellnessAIReport(
  input: WellnessGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveWellnessContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderWellnessAIReportPdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("assessment-report-pdf", buffer, {
    filename: `${slug}-wellness-ai-readiness-report.pdf`,
    displayName: "Wellness AI Readiness Report",
  });
}

/** 30-day social content starter pack (PDF, 28 posts). */
export async function generateWellnessSocialContentPack(
  input: WellnessGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveWellnessContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderWellnessSocialContentPackPdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("tool-recommendations", buffer, {
    filename: `${slug}-social-content-starter-pack.pdf`,
    displayName: "Social Content Starter Pack",
  });
}

/** ZIP of three Make.com wellness automation blueprints + README. */
export async function generateWellnessAutomationBlueprints(
  input: WellnessGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveWellnessContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await createWellnessBlueprintZip(ctx.company, ctx.survey);
  return zipOutput("automation-blueprints", buffer, {
    filename: `${slug}-wellness-automation-blueprints.zip`,
    displayName: "Wellness Automation Blueprint Pack",
  });
}

/** Client retention playbook with lifecycle stages and win-back templates (PDF, ~20–25 pages). */
export async function generateWellnessRetentionPlaybook(
  input: WellnessGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveWellnessContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderWellnessRetentionPlaybookPdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("staff-training-guide", buffer, {
    filename: `${slug}-client-retention-playbook.pdf`,
    displayName: "Wellness Client Retention Playbook",
  });
}

/** Retention economics ROI calculator (XLSX). */
export async function generateWellnessROICalculator(
  input: WellnessGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveWellnessContext(input);
  const result = buildWellnessRoiFileResult(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return spreadsheetOutput("roi-calculator", result.buffer, {
    filename: result.filename,
    displayName: result.displayName,
  });
}

/** Maps standard deliverable keys to wellness generators for Wellness / Med Spa industry. */
export const WELLNESS_DELIVERABLE_GENERATORS: Partial<
  Record<string, DeliverableGenerator>
> = {
  "assessment-report-pdf": generateWellnessAIReport,
  "tool-recommendations": generateWellnessSocialContentPack,
  "executive-presentation": generateWellnessSocialContentPack,
  "automation-blueprints": generateWellnessAutomationBlueprints,
  "staff-training-guide": generateWellnessRetentionPlaybook,
  "roi-calculator": generateWellnessROICalculator,
};
