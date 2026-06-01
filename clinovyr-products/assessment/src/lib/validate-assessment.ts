import type { AssessmentFormData } from "@/lib/assessment-types";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function validateAssessmentPayload(
  body: unknown,
): { valid: true; data: AssessmentFormData } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body." };
  }

  const data = body as Partial<AssessmentFormData>;

  if (!isNonEmptyString(data.companyName)) {
    return { valid: false, error: "Company name is required." };
  }
  if (!isNonEmptyString(data.industry)) {
    return { valid: false, error: "Industry is required." };
  }
  if (!isNonEmptyString(data.employees)) {
    return { valid: false, error: "Employee count is required." };
  }
  if (!isNonEmptyString(data.revenue)) {
    return { valid: false, error: "Revenue range is required." };
  }
  if (!isNonEmptyString(data.yearsInBusiness)) {
    return { valid: false, error: "Years in business is required." };
  }
  if (!isStringArray(data.crm) || data.crm.length === 0) {
    return { valid: false, error: "CRM selection is required." };
  }
  if (!isStringArray(data.emailTools) || data.emailTools.length === 0) {
    return { valid: false, error: "Email tools selection is required." };
  }
  if (!isStringArray(data.scheduling) || data.scheduling.length === 0) {
    return { valid: false, error: "Scheduling selection is required." };
  }
  if (!isStringArray(data.pm) || data.pm.length === 0) {
    return { valid: false, error: "Project management selection is required." };
  }
  if (!isStringArray(data.accounting) || data.accounting.length === 0) {
    return { valid: false, error: "Accounting selection is required." };
  }
  if (!isStringArray(data.timeDrainsRanked) || data.timeDrainsRanked.length === 0) {
    return { valid: false, error: "Time drains ranking is required." };
  }
  if (!isNonEmptyString(data.aiTools)) {
    return { valid: false, error: "AI tools experience is required." };
  }
  if (typeof data.comfortLevel !== "number" || data.comfortLevel < 1 || data.comfortLevel > 5) {
    return { valid: false, error: "Comfort level must be between 1 and 5." };
  }
  if (!isNonEmptyString(data.biggestConcern)) {
    return { valid: false, error: "Biggest concern is required." };
  }
  if (!isStringArray(data.goals) || data.goals.length === 0 || data.goals.length > 3) {
    return { valid: false, error: "Select between 1 and 3 goals." };
  }
  if (!isNonEmptyString(data.firstName)) {
    return { valid: false, error: "First name is required." };
  }
  if (!isNonEmptyString(data.lastName)) {
    return { valid: false, error: "Last name is required." };
  }
  if (!isNonEmptyString(data.email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { valid: false, error: "Valid email is required." };
  }
  if (!isNonEmptyString(data.phone)) {
    return { valid: false, error: "Phone is required." };
  }
  if (!isNonEmptyString(data.bestTimeToConnect)) {
    return { valid: false, error: "Best time to connect is required." };
  }
  if (!isNonEmptyString(data.hearAbout)) {
    return { valid: false, error: "Referral source is required." };
  }

  return { valid: true, data: data as AssessmentFormData };
}
