import type { Company, Survey } from "@prisma/client";
import type { AssessmentFormData } from "@/types/assessment";
import { resolveScore } from "@/lib/deliverables/artifacts";

export const MEDICAL_AI_SYSTEM =
  "You are writing a comprehensive AI readiness report for a medical or dental practice. Be specific, practical, and HIPAA-aware. Reference real tools that are HIPAA-compatible. Always recommend consulting with a HIPAA compliance officer before implementing any AI that touches patient data.";

export const MEDICAL_HIPAA_SYSTEM =
  "You are a Clinovyr healthcare compliance consultant writing a HIPAA-safe AI implementation guide for medical and dental practices. Be practical, cite BAAs where relevant, and never suggest putting PHI into consumer AI tools without a BAA.";

export const MEDICAL_ROADMAP_SYSTEM =
  "You are a Clinovyr implementation lead creating a 90-day AI rollout plan for a medical or dental practice. Assign realistic owners (Office Manager, Practice Administrator, Lead MA, IT vendor, Clinovyr consultant). Include tools and time estimates.";

export function isMedicalDentalIndustry(industry: string): boolean {
  return /medical|dental/i.test(industry);
}

export function getPracticeTypeLabel(
  company: Company,
  formData: AssessmentFormData | null,
): string {
  const industry = formData?.industry || company.industry;
  if (/dental/i.test(industry)) return "Dental Practice";
  if (/medical/i.test(industry)) return "Medical Practice";
  return "Healthcare Practice";
}

export function companySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function buildMedicalContextBlock(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): string {
  const score = resolveScore(formData, survey);
  const topDrains = formData?.timeDrainsRanked?.slice(0, 5).join(", ") ?? "N/A";
  const stack = [
    formData?.crm?.length ? `CRM: ${formData.crm.join(", ")}` : null,
    formData?.scheduling?.length
      ? `Scheduling: ${formData.scheduling.join(", ")}`
      : null,
    formData?.emailTools?.length
      ? `Email: ${formData.emailTools.join(", ")}`
      : null,
    formData?.accounting?.length
      ? `Accounting: ${formData.accounting.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return [
    `Practice: ${company.name}`,
    `Type: ${getPracticeTypeLabel(company, formData)}`,
    `Industry: ${company.industry} · Team size: ${company.size}`,
    `Revenue range: ${formData?.revenue ?? company.revenue ?? "N/A"}`,
    `Readiness score: ${score?.overallScore ?? survey.score ?? "N/A"}/100 (${score?.tier ?? survey.tier ?? "N/A"})`,
    `Top time drains: ${topDrains}`,
    `Tech stack: ${stack || "Not fully documented"}`,
    `AI comfort: ${formData?.comfortLevel ?? "N/A"}/10 · AI tools used: ${formData?.aiTools ?? "N/A"}`,
    `Biggest concern: ${formData?.biggestConcern ?? "N/A"}`,
    `Goals: ${formData?.goals?.join(", ") ?? "N/A"}`,
    `Executive summary: ${survey.executiveSummary ?? "N/A"}`,
    `Top opportunities: ${Array.isArray(survey.topOpportunities) ? (survey.topOpportunities as string[]).join("; ") : "N/A"}`,
    `Estimated ROI: ${survey.estimatedROI ?? score?.estimatedAnnualROI ?? "N/A"}`,
    `Notes: ${formData?.additionalNotes ?? "None"}`,
  ].join("\n");
}

export type MedicalFileResult = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  displayName: string;
};
