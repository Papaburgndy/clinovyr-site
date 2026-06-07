export const INDUSTRIES = [
  "Medical/Dental",
  "Real Estate",
  "Legal/Financial",
  "Construction",
  "Wellness/Med Spa",
  "Retail",
  "Other",
] as const;

export const EMPLOYEE_RANGES = ["1–5", "6–20", "21–50", "51–200", "200+"] as const;

export const REVENUE_RANGES = [
  "Under $500K",
  "$500K–$2M",
  "$2M–$10M",
  "$10M+",
] as const;

export const CRM_OPTIONS = [
  "HubSpot",
  "Salesforce",
  "GoHighLevel",
  "None",
  "Other",
] as const;

export const EMAIL_OPTIONS = [
  "Mailchimp",
  "Constant Contact",
  "Gmail/Outlook only",
  "Other",
] as const;

export const SCHEDULING_OPTIONS = [
  "Calendly",
  "Acuity",
  "Practice software",
  "None",
] as const;

export const PM_OPTIONS = [
  "Asana",
  "Monday",
  "Notion",
  "Spreadsheets",
  "None",
] as const;

export const ACCOUNTING_OPTIONS = [
  "QuickBooks",
  "Xero",
  "FreshBooks",
  "Other",
] as const;

export const TIME_DRAINS = [
  "Customer follow-up",
  "Appointment scheduling",
  "Report generation",
  "Data entry",
  "Email management",
  "Invoicing/billing",
  "Social media",
  "Staff communication",
] as const;

export const AI_TOOLS_OPTIONS = [
  "Yes, regularly",
  "Tried a few",
  "Never",
] as const;

export const CONCERN_OPTIONS = [
  "Cost",
  "Security/Privacy",
  "Team adoption",
  "Don't know where to start",
  "Don't trust it yet",
] as const;

export const GOAL_OPTIONS = [
  "Save staff time",
  "Increase revenue",
  "Improve customer experience",
  "Reduce errors",
  "Work fewer hours",
  "Scale without hiring",
  "Better reporting/visibility",
  "Competitive advantage",
] as const;

/**
 * Industry-specific numeric inputs. All optional — when blank, the deliverable
 * generators fall back to size-based estimates. Percentages are stored as the
 * whole number the user types (e.g. 8 = 8%); generators divide by 100.
 */
export type IndustryMetrics = {
  // Medical / Dental
  med_weeklyAppointments?: number;
  med_noShowRatePct?: number;
  med_adminHoursWeek?: number;
  med_blendedWage?: number;
  med_revenuePerVisit?: number;
  // Real Estate
  re_agents?: number;
  re_leadsPerMonth?: number;
  re_closeRatePct?: number;
  re_medianSalePrice?: number;
  re_commissionPct?: number;
  re_responseHours?: number;
  // Legal / Financial
  legal_attorneys?: number;
  legal_billableRate?: number;
  legal_nonBillableHoursWeek?: number;
  // Construction
  con_ownerAdminHoursWeek?: number;
  con_ownerHourlyRate?: number;
  con_activeJobs?: number;
  con_avgProjectValue?: number;
  con_bidsPerMonth?: number;
  // Wellness / Med Spa
  well_activeClients?: number;
  well_avgTreatmentValue?: number;
  well_rebookingRatePct?: number;
  well_visitsPerYear?: number;
  // Retail / Hospitality
  ret_monthlyRevenue?: number;
  ret_customerCount?: number;
  ret_avgTransaction?: number;
  ret_emailListSize?: number;
  ret_emailOpenRatePct?: number;
  ret_googleRating?: number;
};

export type IndustryMetricField = {
  key: keyof IndustryMetrics;
  label: string;
  unit: "$" | "%" | "#";
  help?: string;
  placeholder?: string;
};

/** Per-industry numeric questions, keyed by the survey industry value. */
export const INDUSTRY_QUESTIONS: Record<string, IndustryMetricField[]> = {
  "Medical/Dental": [
    { key: "med_weeklyAppointments", label: "Weekly patient appointments", unit: "#", help: "Across all providers", placeholder: "e.g. 85" },
    { key: "med_noShowRatePct", label: "Current no-show rate", unit: "%", placeholder: "e.g. 8" },
    { key: "med_adminHoursWeek", label: "Front-desk/admin hours per week on manual tasks", unit: "#", placeholder: "e.g. 28" },
    { key: "med_blendedWage", label: "Blended hourly staff wage", unit: "$", placeholder: "e.g. 28" },
    { key: "med_revenuePerVisit", label: "Average revenue per visit", unit: "$", placeholder: "e.g. 185" },
  ],
  "Real Estate": [
    { key: "re_agents", label: "Number of agents producing GCI", unit: "#", placeholder: "e.g. 8" },
    { key: "re_leadsPerMonth", label: "Inbound leads per month (team)", unit: "#", placeholder: "e.g. 120" },
    { key: "re_closeRatePct", label: "Current close rate (leads → closed)", unit: "%", placeholder: "e.g. 6" },
    { key: "re_medianSalePrice", label: "Median sale price", unit: "$", placeholder: "e.g. 875000" },
    { key: "re_commissionPct", label: "Average commission rate", unit: "%", placeholder: "e.g. 2.5" },
    { key: "re_responseHours", label: "Average lead response time (hours)", unit: "#", placeholder: "e.g. 4" },
  ],
  "Legal/Financial": [
    { key: "legal_attorneys", label: "Attorneys/advisors billing time", unit: "#", placeholder: "e.g. 6" },
    { key: "legal_billableRate", label: "Blended billable hourly rate", unit: "$", placeholder: "e.g. 350" },
    { key: "legal_nonBillableHoursWeek", label: "Non-billable admin hours/week per attorney", unit: "#", placeholder: "e.g. 12" },
  ],
  Construction: [
    { key: "con_ownerAdminHoursWeek", label: "Owner admin hours per week", unit: "#", placeholder: "e.g. 18" },
    { key: "con_ownerHourlyRate", label: "Owner effective hourly rate", unit: "$", help: "Opportunity cost of your time", placeholder: "e.g. 150" },
    { key: "con_activeJobs", label: "Active concurrent jobs", unit: "#", placeholder: "e.g. 6" },
    { key: "con_avgProjectValue", label: "Average project value", unit: "$", placeholder: "e.g. 85000" },
    { key: "con_bidsPerMonth", label: "Bids submitted per month", unit: "#", placeholder: "e.g. 12" },
  ],
  "Wellness/Med Spa": [
    { key: "well_activeClients", label: "Active clients (last 12 months)", unit: "#", placeholder: "e.g. 600" },
    { key: "well_avgTreatmentValue", label: "Average treatment value (per visit)", unit: "$", placeholder: "e.g. 250" },
    { key: "well_rebookingRatePct", label: "Rebooking rate (within 90 days)", unit: "%", placeholder: "e.g. 42" },
    { key: "well_visitsPerYear", label: "Average visits per client per year", unit: "#", placeholder: "e.g. 4" },
  ],
  Retail: [
    { key: "ret_monthlyRevenue", label: "Monthly revenue", unit: "$", placeholder: "e.g. 120000" },
    { key: "ret_customerCount", label: "Annual unique customers", unit: "#", placeholder: "e.g. 3000" },
    { key: "ret_avgTransaction", label: "Average transaction value", unit: "$", placeholder: "e.g. 65" },
    { key: "ret_emailListSize", label: "Email list size", unit: "#", placeholder: "e.g. 2500" },
    { key: "ret_emailOpenRatePct", label: "Email open rate", unit: "%", placeholder: "e.g. 22" },
    { key: "ret_googleRating", label: "Current Google rating (1–5)", unit: "#", placeholder: "e.g. 4.1" },
  ],
  Other: [],
};

/** Resolve the question set for any industry label (handles "Medical & Dental" vs "Medical/Dental"). */
export function getIndustryQuestions(industry: string | undefined): IndustryMetricField[] {
  if (!industry) return [];
  if (INDUSTRY_QUESTIONS[industry]) return INDUSTRY_QUESTIONS[industry];
  const lower = industry.toLowerCase();
  if (/medical|dental/.test(lower)) return INDUSTRY_QUESTIONS["Medical/Dental"];
  if (/real estate|property|realt/.test(lower)) return INDUSTRY_QUESTIONS["Real Estate"];
  if (/legal|law|financ|attorney|advisor/.test(lower)) return INDUSTRY_QUESTIONS["Legal/Financial"];
  if (/construct|contract|build/.test(lower)) return INDUSTRY_QUESTIONS["Construction"];
  if (/wellness|spa|salon|aesthet/.test(lower)) return INDUSTRY_QUESTIONS["Wellness/Med Spa"];
  if (/retail|hospitality|restaurant|shop|store|boutique/.test(lower)) return INDUSTRY_QUESTIONS["Retail"];
  return [];
}

export type AssessmentFormData = {
  companyName: string;
  industry: string;
  employees: string;
  revenue: string;
  yearsInBusiness: string;
  crm: string[];
  emailTools: string[];
  scheduling: string[];
  pm: string[];
  accounting: string[];
  timeDrainsRanked: string[];
  aiTools: string;
  comfortLevel: number | null;
  biggestConcern: string;
  goals: string[];
  industryMetrics: IndustryMetrics;
  additionalNotes: string;
};

export const INITIAL_FORM_DATA: AssessmentFormData = {
  companyName: "",
  industry: "",
  employees: "",
  revenue: "",
  yearsInBusiness: "",
  crm: [],
  emailTools: [],
  scheduling: [],
  pm: [],
  accounting: [],
  timeDrainsRanked: [...TIME_DRAINS],
  aiTools: "",
  comfortLevel: null,
  biggestConcern: "",
  goals: [],
  industryMetrics: {},
  additionalNotes: "",
};

export const STORAGE_KEY = "clinovyr-portal-assessment-draft";

export const TOTAL_STEPS = 7;

export const STEP_LABELS = [
  "Overview",
  "Tech Stack",
  "Time Drains",
  "AI Experience",
  "Goals",
  "Your Numbers",
  "Final Notes",
] as const;

export type SurveyResponsesPayload = {
  step: number;
  formData: AssessmentFormData;
  completedSteps?: number[];
};

export type CompanyProfileForAssessment = {
  name: string;
  industry: string;
  size: string;
  revenue: string;
};
