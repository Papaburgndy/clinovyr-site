import type { Company, Survey } from "@prisma/client";
import { parseSurveyFormData } from "@/lib/deliverables/artifacts";
import { renderRetailAIReportPdf } from "@/lib/deliverables/generators/industries/retail-ai-report";
import { renderRetailReviewManagementKitPdf } from "@/lib/deliverables/generators/industries/retail-review-management-kit";
import { buildRetailRoiFileResult } from "@/lib/deliverables/generators/industries/retail-roi";
import { companySlug } from "@/lib/deliverables/generators/industries/retail-shared";
import { renderRetailSocialContentPackPdf } from "@/lib/deliverables/generators/industries/retail-social-content-pack";
import { renderRetailWinBackKitPdf } from "@/lib/deliverables/generators/industries/retail-win-back-kit";
import {
  pdfOutput,
  spreadsheetOutput,
} from "@/lib/deliverables/generators/shared";
import type {
  DeliverableGenerator,
  GeneratorContext,
  GeneratorOutput,
} from "@/lib/deliverables/generators/types";
import type { AssessmentFormData } from "@/types/assessment";

export type RetailGeneratorInput = {
  company: Company;
  survey: Survey;
  formData?: AssessmentFormData | null;
};

function resolveRetailContext(
  input: RetailGeneratorInput | GeneratorContext,
): GeneratorContext {
  if ("formData" in input && "company" in input && "survey" in input) {
    const ctx = input as GeneratorContext;
    return {
      company: ctx.company,
      survey: ctx.survey,
      formData: ctx.formData ?? parseSurveyFormData(ctx.survey),
    };
  }
  const { company, survey, formData } = input as RetailGeneratorInput;
  return {
    company,
    survey,
    formData: formData ?? parseSurveyFormData(survey),
  };
}

/** Comprehensive retail/hospitality AI readiness report (PDF, ~10–12 pages). */
export async function generateRetailAIReport(
  input: RetailGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveRetailContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderRetailAIReportPdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("assessment-report-pdf", buffer, {
    filename: `${slug}-retail-ai-readiness-report.pdf`,
    displayName: "Retail AI Readiness Report",
  });
}

/** Customer win-back campaign kit with emails, SMS, and Klaviyo guide (PDF). */
export async function generateRetailCustomerWinBackKit(
  input: RetailGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveRetailContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderRetailWinBackKitPdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("opportunity-brief", buffer, {
    filename: `${slug}-customer-win-back-kit.pdf`,
    displayName: "Customer Win-Back Campaign Kit",
  });
}

/** Review automation guide, response library, and Make.com blueprint (PDF). */
export async function generateRetailReviewManagementKit(
  input: RetailGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveRetailContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderRetailReviewManagementKitPdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("implementation-checklist", buffer, {
    filename: `${slug}-review-management-kit.pdf`,
    displayName: "Review Management Kit",
  });
}

/** 30-day social content pack with 28 captions and story templates (PDF). */
export async function generateRetailSocialContentPack(
  input: RetailGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveRetailContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderRetailSocialContentPackPdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("tool-recommendations", buffer, {
    filename: `${slug}-social-content-pack.pdf`,
    displayName: "30-Day Social Content Pack",
  });
}

/** Retail ROI calculator with win-back, review, email, staffing modules (XLSX). */
export async function generateRetailROICalculator(
  input: RetailGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveRetailContext(input);
  const result = buildRetailRoiFileResult(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return spreadsheetOutput("roi-calculator", result.buffer, {
    filename: result.filename,
    displayName: result.displayName,
  });
}

/** Maps standard deliverable keys to retail generators for Retail & Hospitality industry. */
export const RETAIL_DELIVERABLE_GENERATORS: Partial<
  Record<string, DeliverableGenerator>
> = {
  "assessment-report-pdf": generateRetailAIReport,
  "opportunity-brief": generateRetailCustomerWinBackKit,
  "opportunity-roadmap": generateRetailCustomerWinBackKit,
  "implementation-checklist": generateRetailReviewManagementKit,
  "crm-setup-guide": generateRetailReviewManagementKit,
  "staff-training-guide": generateRetailReviewManagementKit,
  "tool-stack-guide": generateRetailReviewManagementKit,
  "automation-blueprints": generateRetailReviewManagementKit,
  "tool-recommendations": generateRetailSocialContentPack,
  "executive-presentation": generateRetailSocialContentPack,
  "roi-calculator": generateRetailROICalculator,
};
