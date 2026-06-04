import {
  TIME_DRAINS,
  type AssessmentFormData,
} from "@/types/assessment";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function validateAssessmentStep(
  step: number,
  data: AssessmentFormData,
): string | null {
  switch (step) {
    case 1:
      if (!data.companyName.trim()) return "Company name is required.";
      if (!data.industry) return "Industry is required.";
      if (!data.employees) return "Please select employee count.";
      if (!data.revenue) return "Please select revenue range.";
      if (!data.yearsInBusiness.trim()) return "Years in business is required.";
      return null;
    case 2:
      if (data.crm.length === 0) return "Select at least one CRM option.";
      if (data.emailTools.length === 0)
        return "Select at least one email option.";
      if (data.scheduling.length === 0)
        return "Select at least one scheduling option.";
      if (data.pm.length === 0)
        return "Select at least one project management option.";
      if (data.accounting.length === 0)
        return "Select at least one accounting option.";
      return null;
    case 3:
      if (data.timeDrainsRanked.length !== TIME_DRAINS.length) {
        return "Please rank all time drains.";
      }
      return null;
    case 4:
      if (!data.aiTools) return "Please indicate your AI tool experience.";
      if (data.comfortLevel === null) return "Please rate your comfort level.";
      if (!data.biggestConcern) return "Please select your biggest concern.";
      return null;
    case 5:
      if (data.goals.length === 0) return "Select at least one goal.";
      if (data.goals.length > 3) return "Select no more than three goals.";
      return null;
    case 6:
      return null;
    default:
      return null;
  }
}

export function validateCompleteAssessment(
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
  if (
    !isStringArray(data.timeDrainsRanked) ||
    data.timeDrainsRanked.length !== TIME_DRAINS.length
  ) {
    return { valid: false, error: "Time drains ranking is required." };
  }
  if (!isNonEmptyString(data.aiTools)) {
    return { valid: false, error: "AI tools experience is required." };
  }
  if (
    typeof data.comfortLevel !== "number" ||
    data.comfortLevel < 1 ||
    data.comfortLevel > 5
  ) {
    return { valid: false, error: "Comfort level must be between 1 and 5." };
  }
  if (!isNonEmptyString(data.biggestConcern)) {
    return { valid: false, error: "Biggest concern is required." };
  }
  if (
    !isStringArray(data.goals) ||
    data.goals.length === 0 ||
    data.goals.length > 3
  ) {
    return { valid: false, error: "Select between 1 and 3 goals." };
  }

  return {
    valid: true,
    data: {
      ...data,
      additionalNotes: data.additionalNotes ?? "",
    } as AssessmentFormData,
  };
}
