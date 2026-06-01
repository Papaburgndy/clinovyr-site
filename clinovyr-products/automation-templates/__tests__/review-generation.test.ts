import * as fs from "fs";
import * as path from "path";
import {
  buildReviewEmailSubject,
  buildReviewSmsBody,
  daysSinceAppointment,
  evaluateReviewOutreach,
} from "../src/simulators/review-generation";

const mockPath = path.join(__dirname, "../test/mock-data/appointment.json");

interface MockFile {
  referenceDate: string;
  companyName: string;
  scenarios: Array<{
    label: string;
    appointment: {
      id: string;
      customer_name: string;
      phone?: string;
      email?: string;
      appointmentDate: string;
      review_sent?: string;
    };
    expectedAction: string;
  }>;
}

describe("review-generation simulator", () => {
  const referenceDate = new Date("2026-06-01T18:00:00.000Z");
  const mock = JSON.parse(fs.readFileSync(mockPath, "utf-8")) as MockFile;

  it("loads mock appointment scenarios", () => {
    expect(mock.scenarios).toHaveLength(3);
  });

  it.each([
    ["appointment_today", "none", "appointment_too_recent"],
    ["appointment_yesterday", "sms", "appointment_yesterday_sms_window"],
    ["appointment_three_days_ago", "email", "appointment_three_days_email_followup"],
  ] as const)(
    "%s → %s outreach",
    (label, expectedAction, expectedReason) => {
      const scenario = mock.scenarios.find((s) => s.label === label);
      expect(scenario).toBeDefined();

      const decision = evaluateReviewOutreach(scenario!.appointment, referenceDate);
      expect(decision.action).toBe(expectedAction);
      expect(decision.reason).toBe(expectedReason);
    }
  );

  it("appointment yesterday generates SMS body", () => {
    const yesterday = mock.scenarios.find((s) => s.label === "appointment_yesterday")!;
    const decision = evaluateReviewOutreach(yesterday.appointment, referenceDate);
    expect(decision.action).toBe("sms");

    const body = buildReviewSmsBody(yesterday.appointment, mock.companyName);
    expect(body).toContain(yesterday.appointment.customer_name);
    expect(body).toContain(mock.companyName);
  });

  it("appointment 3 days ago generates email follow-up subject", () => {
    const threeDays = mock.scenarios.find((s) => s.label === "appointment_three_days_ago")!;
    const decision = evaluateReviewOutreach(threeDays.appointment, referenceDate);
    expect(decision.action).toBe("email");

    const subject = buildReviewEmailSubject(mock.companyName);
    expect(subject).toContain(mock.companyName);
  });

  it("skips email follow-up when review already received", () => {
    const threeDays = mock.scenarios.find((s) => s.label === "appointment_three_days_ago")!;
    const decision = evaluateReviewOutreach(
      { ...threeDays.appointment, review_received: "yes" },
      referenceDate
    );
    expect(decision.action).toBe("none");
    expect(decision.reason).toBe("review_already_received");
  });

  it("skips outreach when review already sent", () => {
    const yesterday = mock.scenarios.find((s) => s.label === "appointment_yesterday")!;
    const decision = evaluateReviewOutreach(
      { ...yesterday.appointment, review_sent: "yes" },
      referenceDate
    );
    expect(decision.action).toBe("none");
    expect(decision.reason).toBe("review_already_sent");
  });

  it("computes day offsets from reference date", () => {
    expect(daysSinceAppointment("2026-06-01T14:00:00.000Z", referenceDate)).toBe(0);
    expect(daysSinceAppointment("2026-05-31T10:00:00.000Z", referenceDate)).toBe(1);
    expect(daysSinceAppointment("2026-05-29T09:30:00.000Z", referenceDate)).toBe(3);
  });
});
