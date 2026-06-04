import {
  COMPANY_SIZES,
  INDUSTRIES,
  ONBOARDING_GOALS,
  REVENUE_RANGES,
  URGENCY_OPTIONS,
  type CompanySize,
  type Industry,
  type OnboardingGoalId,
  type RevenueRange,
  type UrgencyId,
} from "@/lib/onboarding/constants";

const URL_PATTERN =
  /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?$/i;

const GOAL_IDS = new Set(ONBOARDING_GOALS.map((g) => g.id));
const URGENCY_IDS = new Set(URGENCY_OPTIONS.map((u) => u.id));

export type SaveCompanyInput = {
  name: string;
  industry: Industry;
  size: CompanySize;
  revenue: RevenueRange;
  city: string;
  state: string;
  phone?: string;
  website?: string;
};

export function validateWebsite(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  try {
    const withProtocol = trimmed.startsWith("http")
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return URL_PATTERN.test(trimmed);
  }
}

export function validateSaveCompanyBody(
  body: Record<string, unknown>,
): { ok: true; data: SaveCompanyInput } | { ok: false; error: string } {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const industry = typeof body.industry === "string" ? body.industry : "";
  const size = typeof body.size === "string" ? body.size : "";
  const revenue = typeof body.revenue === "string" ? body.revenue : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const state =
    typeof body.state === "string" && body.state.trim()
      ? body.state.trim().toUpperCase()
      : "CA";
  const phone =
    typeof body.phone === "string" ? body.phone.trim() : undefined;
  const website =
    typeof body.website === "string" ? body.website.trim() : undefined;

  if (!name || name.length < 2) {
    return { ok: false, error: "Company name is required." };
  }

  if (!INDUSTRIES.includes(industry as Industry)) {
    return { ok: false, error: "Please select a valid industry." };
  }

  if (!COMPANY_SIZES.includes(size as CompanySize)) {
    return { ok: false, error: "Please select company size." };
  }

  if (!REVENUE_RANGES.includes(revenue as RevenueRange)) {
    return { ok: false, error: "Please select annual revenue." };
  }

  if (!city || city.length < 2) {
    return { ok: false, error: "City is required." };
  }

  if (state.length !== 2) {
    return { ok: false, error: "State must be a two-letter code." };
  }

  if (website && !validateWebsite(website)) {
    return { ok: false, error: "Please enter a valid website URL." };
  }

  return {
    ok: true,
    data: {
      name,
      industry: industry as Industry,
      size: size as CompanySize,
      revenue: revenue as RevenueRange,
      city,
      state,
      phone: phone || undefined,
      website: website || undefined,
    },
  };
}

export function validateSaveGoalsBody(
  body: Record<string, unknown>,
): { ok: true; goals: OnboardingGoalId[]; urgency: UrgencyId } | { ok: false; error: string } {
  const goalsRaw = body.goals;
  const urgency = typeof body.urgency === "string" ? body.urgency : "";

  if (!Array.isArray(goalsRaw) || goalsRaw.length === 0) {
    return {
      ok: false,
      error: "Select at least one reason you're here today.",
    };
  }

  const goals = goalsRaw.filter(
    (g): g is OnboardingGoalId =>
      typeof g === "string" && GOAL_IDS.has(g as OnboardingGoalId),
  );

  if (goals.length === 0) {
    return { ok: false, error: "Select at least one valid goal." };
  }

  if (!URGENCY_IDS.has(urgency as UrgencyId)) {
    return { ok: false, error: "Please select your timeline." };
  }

  return { ok: true, goals, urgency: urgency as UrgencyId };
}

export function companyHasProfile(company: {
  name: string;
  industry: string;
  size: string;
  revenue: string;
  city: string;
}): boolean {
  return Boolean(
    company.name?.trim() &&
      company.industry &&
      company.size &&
      company.revenue &&
      company.city?.trim(),
  );
}
