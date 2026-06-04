export const INDUSTRIES = [
  "Medical & Dental",
  "Real Estate & Property",
  "Legal & Financial",
  "Construction & Contracting",
  "Wellness & Med Spa",
  "Retail & Hospitality",
  "Other",
] as const;

export const COMPANY_SIZES = [
  "1–5 employees",
  "6–20",
  "21–50",
  "51–200",
  "200+",
] as const;

export const REVENUE_RANGES = [
  "Under $500K",
  "$500K–$2M",
  "$2M–$10M",
  "$10M+",
  "Prefer not to say",
] as const;

export const ONBOARDING_GOALS = [
  {
    id: "understand-ai",
    label: "I want to understand where AI can help my business",
  },
  {
    id: "automate-workflows",
    label: "I'm ready to automate specific workflows",
  },
  {
    id: "strategy-roadmap",
    label: "I need AI strategy and a roadmap",
  },
  {
    id: "run-ai-ongoing",
    label: "I want someone to run AI for me ongoing",
  },
  {
    id: "exploring",
    label: "I'm exploring before committing",
  },
] as const;

export const URGENCY_OPTIONS = [
  {
    id: "exploring-1-3",
    label: "Just exploring (1–3 months)",
  },
  {
    id: "planning-30-days",
    label: "Planning to start soon (next 30 days)",
  },
  {
    id: "ready-now",
    label: "Ready to move now",
  },
] as const;

export type OnboardingGoalId = (typeof ONBOARDING_GOALS)[number]["id"];
export type UrgencyId = (typeof URGENCY_OPTIONS)[number]["id"];

export type Industry = (typeof INDUSTRIES)[number];
export type CompanySize = (typeof COMPANY_SIZES)[number];
export type RevenueRange = (typeof REVENUE_RANGES)[number];
