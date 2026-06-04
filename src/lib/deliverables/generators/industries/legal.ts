import type { Company, Survey } from "@prisma/client";
import { parseSurveyFormData } from "@/lib/deliverables/artifacts";
import { renderLegalAIReportPdf } from "@/lib/deliverables/generators/industries/legal-ai-report";
import { renderLegalClientIntakeGuidePdf } from "@/lib/deliverables/generators/industries/legal-client-intake-guide";
import { renderLegalComplianceChecklistPdf } from "@/lib/deliverables/generators/industries/legal-compliance-checklist";
import { renderLegalPromptLibraryPdf } from "@/lib/deliverables/generators/industries/legal-prompt-library";
import { buildLegalRoiFileResult } from "@/lib/deliverables/generators/industries/legal-roi";
import { companySlug } from "@/lib/deliverables/generators/industries/legal-shared";
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

export type LegalGeneratorInput = {
  company: Company;
  survey: Survey;
  formData?: AssessmentFormData | null;
};

function resolveLegalContext(
  input: LegalGeneratorInput | GeneratorContext,
): GeneratorContext {
  if ("formData" in input && "company" in input && "survey" in input) {
    const ctx = input as GeneratorContext;
    return {
      company: ctx.company,
      survey: ctx.survey,
      formData: ctx.formData ?? parseSurveyFormData(ctx.survey),
    };
  }
  const { company, survey, formData } = input as LegalGeneratorInput;
  return {
    company,
    survey,
    formData: formData ?? parseSurveyFormData(survey),
  };
}

/** Comprehensive ethics-aware AI readiness report (PDF, ~14–18 pages). */
export async function generateLegalAIReport(
  input: LegalGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveLegalContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderLegalAIReportPdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("assessment-report-pdf", buffer, {
    filename: `${slug}-legal-ai-readiness-report.pdf`,
    displayName: "Legal AI Readiness Report",
  });
}

/** Attorney-tested prompt library with ethics notes (PDF, 20 prompts). */
export async function generateLegalPromptLibrary(
  input: LegalGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveLegalContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderLegalPromptLibraryPdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("tool-recommendations", buffer, {
    filename: `${slug}-legal-prompt-library.pdf`,
    displayName: "Legal AI Prompt Library",
  });
}

/** Clio client intake system setup guide (PDF). */
export async function generateLegalClientIntakeSystem(
  input: LegalGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveLegalContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderLegalClientIntakeGuidePdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("crm-setup-guide", buffer, {
    filename: `${slug}-client-intake-setup-guide.pdf`,
    displayName: "Legal Client Intake System Guide",
  });
}

/** Billable-hours-focused ROI calculator (XLSX). */
export async function generateLegalROICalculator(
  input: LegalGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveLegalContext(input);
  const result = buildLegalRoiFileResult(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return spreadsheetOutput("roi-calculator", result.buffer, {
    filename: result.filename,
    displayName: result.displayName,
  });
}

/** Pre-deployment AI compliance checklist (PDF, 12 yes/no items). */
export async function generateLegalComplianceChecklist(
  input: LegalGeneratorInput | GeneratorContext,
): Promise<GeneratorOutput> {
  const ctx = resolveLegalContext(input);
  const slug = companySlug(ctx.company.name);
  const buffer = await renderLegalComplianceChecklistPdf(
    ctx.company,
    ctx.survey,
    ctx.formData,
  );
  return pdfOutput("implementation-checklist", buffer, {
    filename: `${slug}-ai-compliance-checklist.pdf`,
    displayName: "Legal AI Compliance Checklist",
  });
}

/** Maps standard deliverable keys to legal generators for Legal / Law / RIA industry. */
export const LEGAL_DELIVERABLE_GENERATORS: Partial<
  Record<string, DeliverableGenerator>
> = {
  "assessment-report-pdf": generateLegalAIReport,
  "tool-recommendations": generateLegalPromptLibrary,
  "crm-setup-guide": generateLegalClientIntakeSystem,
  "opportunity-brief": generateLegalClientIntakeSystem,
  "roi-calculator": generateLegalROICalculator,
  "implementation-checklist": generateLegalComplianceChecklist,
};
