import { DELIVERABLE_KEY_META } from "@/lib/deliverables/artifacts";

export const DELIVERABLE_DESCRIPTIONS: Record<string, string> = {
  "assessment-report-pdf":
    "Full AI readiness assessment with scores, tier analysis, and prioritized recommendations.",
  "opportunity-roadmap":
    "Phased roadmap ranking your top automation opportunities by impact and effort.",
  "tool-stack-guide":
    "Structured JSON guide to recommended tools, integrations, and rollout order.",
  "implementation-checklist":
    "Step-by-step checklist to implement your highest-ROI AI workflows.",
  "executive-presentation":
    "Markdown outline for presenting findings and next steps to leadership.",
  "opportunity-brief":
    "Focused brief on your #1 AI opportunity with scope and expected outcomes.",
  "tool-recommendations":
    "Curated tool recommendations matched to your industry and workflows.",
  "automation-blueprints":
    "JSON blueprints for automations tailored to your operations.",
  "crm-setup-guide":
    "CRM configuration and workflow guide aligned to your sales process.",
  "staff-training-guide":
    "Training guide to onboard your team on new AI-assisted workflows.",
  "roi-calculator":
    "Spreadsheet worksheet to model savings and payback on AI initiatives.",
};

export function getDeliverableDescription(key: string): string {
  return (
    DELIVERABLE_DESCRIPTIONS[key] ??
    "Personalized deliverable prepared from your assessment."
  );
}

export function getDeliverableDisplayName(
  key: string,
  fallbackName: string,
): string {
  return DELIVERABLE_KEY_META[key]?.displayName ?? fallbackName;
}
