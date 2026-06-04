import {
  EMPLOYEE_RANGES,
  INITIAL_FORM_DATA,
  REVENUE_RANGES,
  TIME_DRAINS,
  type AssessmentFormData,
  type CompanyProfileForAssessment,
  type SurveyResponsesPayload,
} from "@/types/assessment";

const ONBOARDING_INDUSTRY_MAP: Record<string, string> = {
  "Medical & Dental": "Medical/Dental",
  "Real Estate & Property": "Real Estate",
  "Legal & Financial": "Legal/Financial",
  "Construction & Contracting": "Construction",
  "Wellness & Med Spa": "Wellness/Med Spa",
  "Retail & Hospitality": "Retail",
  Other: "Other",
};

const COMPANY_SIZE_MAP: Record<string, string> = {
  "1–5 employees": "1–5",
  "6–20": "6–20",
  "21–50": "21–50",
  "51–200": "51–200",
  "200+": "200+",
};

export function mapIndustryForScoring(industry: string): string {
  return ONBOARDING_INDUSTRY_MAP[industry] ?? industry;
}

export function mapCompanySizeToEmployees(size: string): string {
  return COMPANY_SIZE_MAP[size] ?? size;
}

export function isValidEmployeeRange(value: string): boolean {
  return (EMPLOYEE_RANGES as readonly string[]).includes(value);
}

export function isValidRevenueRange(value: string): boolean {
  return (REVENUE_RANGES as readonly string[]).includes(value);
}

export function buildInitialFormData(
  company: CompanyProfileForAssessment,
): AssessmentFormData {
  const employees = mapCompanySizeToEmployees(company.size);
  const revenue = isValidRevenueRange(company.revenue) ? company.revenue : "";

  return {
    ...INITIAL_FORM_DATA,
    companyName: company.name,
    industry: mapIndustryForScoring(company.industry),
    employees: isValidEmployeeRange(employees) ? employees : "",
    revenue,
  };
}

export function mergeSurveyResponses(
  company: CompanyProfileForAssessment,
  responses: unknown,
): { formData: AssessmentFormData; step: number; completedSteps: number[] } {
  const base = buildInitialFormData(company);

  if (!responses || typeof responses !== "object") {
    return { formData: base, step: 1, completedSteps: [] };
  }

  const payload = responses as Partial<SurveyResponsesPayload>;
  const saved = payload.formData;

  if (!saved || typeof saved !== "object") {
    return {
      formData: base,
      step: payload.step && payload.step >= 1 ? payload.step : 1,
      completedSteps: Array.isArray(payload.completedSteps)
        ? payload.completedSteps
        : [],
    };
  }

  return {
    formData: {
      ...base,
      ...saved,
      companyName: company.name,
      industry: mapIndustryForScoring(company.industry),
      timeDrainsRanked:
        Array.isArray(saved.timeDrainsRanked) &&
        saved.timeDrainsRanked.length === TIME_DRAINS.length
          ? saved.timeDrainsRanked
          : [...TIME_DRAINS],
      crm: Array.isArray(saved.crm) ? saved.crm : [],
      emailTools: Array.isArray(saved.emailTools) ? saved.emailTools : [],
      scheduling: Array.isArray(saved.scheduling) ? saved.scheduling : [],
      pm: Array.isArray(saved.pm) ? saved.pm : [],
      accounting: Array.isArray(saved.accounting) ? saved.accounting : [],
      goals: Array.isArray(saved.goals) ? saved.goals : [],
    },
    step:
      payload.step && payload.step >= 1 && payload.step <= 6 ? payload.step : 1,
    completedSteps: Array.isArray(payload.completedSteps)
      ? payload.completedSteps.filter((n) => n >= 1 && n <= 6)
      : [],
  };
}
