import type { Order, Survey } from "@prisma/client";

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatOrderStatus(order: Order | null): string {
  if (!order) return "No order";
  return order.status.charAt(0).toUpperCase() + order.status.slice(1);
}

export function formatSurveyStatus(survey: Survey | null): string {
  if (!survey) return "Not started";
  if (survey.status === "complete") return "Complete";
  return "In progress";
}
