import type { Company, Survey } from "@prisma/client";
import { parseSurveyFormData } from "@/lib/deliverables/artifacts";
import { createMedicalBlueprintZip } from "@/lib/deliverables/generators/industries/medical-blueprints";
import { renderMedicalAIReportPdf } from "@/lib/deliverables/generators/industries/medical-ai-report";
import { renderMedicalHipaaGuidePdf } from "@/lib/deliverables/generators/industries/medical-hipaa-guide";
import { buildMedicalRoiFileResult } from "@/lib/deliverables/generators/industries/medical-roi";
import { renderMedicalRoadmapPdf } from "@/lib/deliverables/generators/industries/medical-roadmap";
import { companySlug } from "@/lib/deliverables/generators/industries/medical-shared";
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

export type MedicalGeneratorInput = {
  company: Company;
  survey: Survey;
  formData?: AssessmentFormData | null;
};

function resolveMedicalContext(
  input: MedicalGeneratorInput | GeneratorContext,
): GeneratorContext {
  if ("formData" in input && "company" in input && "survey" in input) {
    const ctx = input as GeneratorContext;
    return {
      company: ctx.company,
      survey: ctx.survey,
      formData: ctx.formData ?? parseSurveyFormData(ctx.survey),
    };
  }
  const { company, survey, formData } = input as MedicalGeneratorInput;
  return {
    company,
    survey,
    formData: formData ?? parseSurveyFormData(survey),
  };
}

/** Comprehensive HIPAA-aware AI readiness report (PDF, ~15–20 pages). */
export async function generateMedicalAIReport(
  input: MedicalGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveMedicalContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderMedicalAIReportPdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("assessment-report-pdf", buffer, {
    filename: `${slug}-medical-ai-readiness-report.pdf`,
    displayName: "Medical AI Readiness Report",
  });
}

/** ZIP of three Make.com medical automation blueprints + README. */
export async function generateMedicalBlueprintPack(
  input: MedicalGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveMedicalContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await createMedicalBlueprintZip(ctx.company, ctx.survey);
  return zipOutput("automation-blueprints", buffer, {
    filename: `${slug}-medical-automation-blueprints.zip`,
    displayName: "Medical Automation Blueprint Pack",
  });
}

/** HIPAA-Safe AI Implementation Guide (PDF, ~6 pages). */
export async function generateMedicalHIPAAGuide(
  input: MedicalGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveMedicalContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderMedicalHipaaGuidePdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("tool-stack-guide", buffer, {
    filename: `${slug}-hipaa-safe-ai-guide.pdf`,
    displayName: "HIPAA-Safe AI Implementation Guide",
  });
}

/** Four-sheet medical practice ROI calculator (XLSX). */
export async function generateMedicalROICalculator(
  input: MedicalGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveMedicalContext(input);
  const result = buildMedicalRoiFileResult(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return spreadsheetOutput("roi-calculator", result.buffer, {
    filename: result.filename,
    displayName: result.displayName,
  });
}

/** 90-day week-by-week implementation roadmap with Gantt visual (PDF). */
export async function generateMedicalRoadmap(
  input: MedicalGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveMedicalContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderMedicalRoadmapPdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("opportunity-roadmap", buffer, {
    filename: `${slug}-90-day-medical-roadmap.pdf`,
    displayName: "90-Day Medical AI Roadmap",
  });
}

/** Maps standard deliverable keys to medical generators for Medical/Dental industry. */
export const MEDICAL_DELIVERABLE_GENERATORS: Partial<
  Record<string, DeliverableGenerator>
> = {
  "assessment-report-pdf": generateMedicalAIReport,
  "automation-blueprints": generateMedicalBlueprintPack,
  "tool-stack-guide": generateMedicalHIPAAGuide,
  "roi-calculator": generateMedicalROICalculator,
  "opportunity-roadmap": generateMedicalRoadmap,
};
