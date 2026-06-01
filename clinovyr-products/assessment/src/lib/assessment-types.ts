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

export const BEST_TIME_OPTIONS = [
  "Morning (8am–12pm)",
  "Afternoon (12pm–5pm)",
  "Evening (5pm–8pm)",
  "Flexible",
] as const;

export const HEAR_ABOUT_OPTIONS = [
  "Referral",
  "LinkedIn",
  "Google",
  "Chamber Event",
  "Workshop",
  "Other",
] as const;

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
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bestTimeToConnect: string;
  hearAbout: string;
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
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  bestTimeToConnect: "",
  hearAbout: "",
  additionalNotes: "",
};

export const STORAGE_KEY = "clinovyr-assessment-draft";

export const TOTAL_STEPS = 6;
