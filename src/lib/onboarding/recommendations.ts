import type { OnboardingGoalId, UrgencyId } from "@/lib/onboarding/constants";

export type ProductRecommendation = {
  product: string;
  tagline: string;
  reason: string;
};

const GOAL_PRIORITY: OnboardingGoalId[] = [
  "run-ai-ongoing",
  "automate-workflows",
  "strategy-roadmap",
  "understand-ai",
  "exploring",
];

const BY_GOAL: Record<OnboardingGoalId, ProductRecommendation> = {
  "run-ai-ongoing": {
    product: "Workflow Automation Sprint",
    tagline: "Everything you need to run AI, with setup help",
    reason:
      "You want AI working day-to-day — the Sprint delivers build-ready blueprints, training guides, and hands-on setup sessions to get it running.",
  },
  "automate-workflows": {
    product: "Workflow Automation Sprint",
    tagline: "Build-ready automations for your workflows",
    reason:
      "You're ready to automate specific workflows — the Sprint delivers importable blueprints and setup sessions to get them live fast.",
  },
  "strategy-roadmap": {
    product: "AI Readiness Assessment",
    tagline: "A clear roadmap aligned to your business",
    reason:
      "You need strategy and a roadmap — the Assessment turns your survey into a prioritized, phased AI plan with an executive briefing.",
  },
  "understand-ai": {
    product: "AI Readiness Assessment",
    tagline: "See where AI creates the most value",
    reason:
      "You want clarity on where AI fits — the assessment scores opportunities and next steps.",
  },
  exploring: {
    product: "AI Readiness Assessment",
    tagline: "Low-commitment starting point",
    reason:
      "You're exploring before committing — the assessment is the best way to learn what's possible.",
  },
};

export function recommendProduct(
  goals: OnboardingGoalId[],
  urgency: UrgencyId,
): ProductRecommendation {
  const primary =
    GOAL_PRIORITY.find((goal) => goals.includes(goal)) ?? "exploring";

  let recommendation = { ...BY_GOAL[primary] };

  if (urgency === "ready-now" && primary === "exploring") {
    recommendation = {
      ...BY_GOAL["understand-ai"],
      reason:
        "You're ready to move now — start with the AI Readiness Assessment to prioritize quick wins.",
    };
  }

  if (
    urgency === "ready-now" &&
    goals.includes("automate-workflows") &&
    !goals.includes("run-ai-ongoing")
  ) {
    recommendation = {
      ...BY_GOAL["automate-workflows"],
      reason:
        "You're ready to move now on automation — a Workflow Automation Sprint is the fastest path to results.",
    };
  }

  if (goals.includes("strategy-roadmap") && goals.includes("run-ai-ongoing")) {
    recommendation = {
      ...BY_GOAL["run-ai-ongoing"],
      reason:
        "Strategy plus day-to-day execution points to the Sprint — roadmap, blueprints, and setup sessions in one package.",
    };
  }

  return recommendation;
}
