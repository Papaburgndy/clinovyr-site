import type { OnboardingGoalId, UrgencyId } from "@/lib/onboarding/constants";

export type CompanyOnboardingNotes = {
  goals: OnboardingGoalId[];
  urgency: UrgencyId;
  goalsSavedAt?: string;
};

export function parseCompanyNotes(notes: unknown): CompanyOnboardingNotes | null {
  if (!notes || typeof notes !== "object") return null;
  const raw = notes as Record<string, unknown>;
  if (!Array.isArray(raw.goals) || typeof raw.urgency !== "string") {
    return null;
  }
  return {
    goals: raw.goals as OnboardingGoalId[],
    urgency: raw.urgency as UrgencyId,
    goalsSavedAt:
      typeof raw.goalsSavedAt === "string" ? raw.goalsSavedAt : undefined,
  };
}
