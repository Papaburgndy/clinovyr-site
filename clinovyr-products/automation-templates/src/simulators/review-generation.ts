/**
 * Dry-run business logic derived from the review-generation n8n workflow intent:
 * - Completed ~1 day ago → SMS review request
 * - Completed ~3 days ago with no review → email follow-up
 * - Completed today → too soon, no outreach
 */

export type ReviewAction = "sms" | "email" | "none";

export interface AppointmentRecord {
  id: string;
  customer_name: string;
  phone?: string;
  email?: string;
  appointmentDate: string;
  review_sent?: string;
  review_received?: string;
}

export interface ReviewDecision {
  action: ReviewAction;
  reason: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function daysSinceAppointment(
  appointmentDate: string | Date,
  referenceDate: Date = new Date()
): number {
  const appt =
    typeof appointmentDate === "string" ? new Date(appointmentDate) : appointmentDate;
  const refStart = startOfUtcDay(referenceDate).getTime();
  const apptStart = startOfUtcDay(appt).getTime();
  return Math.round((refStart - apptStart) / MS_PER_DAY);
}

export function evaluateReviewOutreach(
  appointment: AppointmentRecord,
  referenceDate: Date = new Date()
): ReviewDecision {
  if (appointment.review_sent === "yes") {
    return { action: "none", reason: "review_already_sent" };
  }

  const days = daysSinceAppointment(appointment.appointmentDate, referenceDate);

  if (days <= 0) {
    return { action: "none", reason: "appointment_too_recent" };
  }

  if (days === 1) {
    return { action: "sms", reason: "appointment_yesterday_sms_window" };
  }

  if (days >= 3) {
    if (appointment.review_received === "yes") {
      return { action: "none", reason: "review_already_received" };
    }
    return { action: "email", reason: "appointment_three_days_email_followup" };
  }

  return { action: "none", reason: "outside_outreach_windows" };
}

export function buildReviewSmsBody(appointment: AppointmentRecord, companyName: string): string {
  return `Hi ${appointment.customer_name}, we'd love your feedback on your visit at ${companyName}. Reply STOP to opt out.`;
}

export function buildReviewEmailSubject(companyName: string): string {
  return `We'd still love your feedback — ${companyName}`;
}
