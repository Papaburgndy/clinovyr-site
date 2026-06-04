import type { Company, Order, Survey } from "@prisma/client";

export type DashboardState = "A" | "B" | "C" | "D";

export type StepperStepId =
  | "account"
  | "survey"
  | "payment"
  | "deliverables";

export type StepperStep = {
  id: StepperStepId;
  label: string;
  complete: boolean;
};

export type PortalCompanyData = Company & {
  survey: Survey | null;
  order: Order | null;
};

const PAID_STATUSES = ["paid", "delivered"] as const;

export function isOrderPaid(order: Order | null | undefined): boolean {
  if (!order) return false;
  return PAID_STATUSES.includes(
    order.status as (typeof PAID_STATUSES)[number],
  );
}

export function isSurveyComplete(survey: Survey | null | undefined): boolean {
  return survey?.status === "complete";
}

export function hasDeliverablesContent(
  order: Order | null | undefined,
): boolean {
  if (!order?.deliverables) return false;
  const d = order.deliverables;
  if (Array.isArray(d)) return d.length > 0;
  if (typeof d === "object" && d !== null) {
    return Object.keys(d).length > 0;
  }
  return false;
}

export function isDeliverablesReady(order: Order | null | undefined): boolean {
  if (!order) return false;
  if (order.status === "delivered") return true;
  return hasDeliverablesContent(order);
}

export function getStepperSteps(
  company: Company | null,
  survey: Survey | null | undefined,
  order: Order | null | undefined,
): StepperStep[] {
  const accountComplete = Boolean(company);
  const surveyComplete = isSurveyComplete(survey);
  const paymentComplete = isOrderPaid(order);
  const deliverablesComplete = isDeliverablesReady(order);

  return [
    { id: "account", label: "Account Created", complete: accountComplete },
    { id: "survey", label: "Survey", complete: surveyComplete },
    { id: "payment", label: "Payment", complete: paymentComplete },
    {
      id: "deliverables",
      label: "Deliverables Ready",
      complete: deliverablesComplete,
    },
  ];
}

export function isSurveyNotStarted(
  survey: Survey | null | undefined,
): boolean {
  if (!survey) return true;
  return survey.status !== "complete" && survey.score == null;
}

export function getDashboardState(
  survey: Survey | null | undefined,
  order: Order | null | undefined,
): DashboardState {
  if (isSurveyNotStarted(survey)) return "A";

  if (!isOrderPaid(order)) return "B";

  if (!isDeliverablesReady(order)) return "C";

  return "D";
}

export function getPlanBadgeLabel(
  survey: Survey | null | undefined,
  order: Order | null | undefined,
): string {
  if (isOrderPaid(order)) {
    return order?.product ?? "Assessment Purchased";
  }
  if (isSurveyComplete(survey)) {
    return "Survey Complete";
  }
  return "Getting Started";
}

export function formatCents(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export type TopOpportunity = {
  title?: string;
  name?: string;
  description?: string;
};

export function parseTopOpportunities(
  value: Survey["topOpportunities"],
): TopOpportunity[] {
  if (!value || !Array.isArray(value)) return [];
  return value.slice(0, 3) as TopOpportunity[];
}
