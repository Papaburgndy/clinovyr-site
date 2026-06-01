import { TIME_DRAINS } from "@/lib/assessment-types";
import type { AssessmentFormData } from "@/lib/assessment-types";
import {
  calculateAIReadinessScore,
  type RecommendedPackage,
  type ReadinessTier,
} from "@/lib/scoring";
import { validateAssessmentPayload } from "@/lib/validate-assessment";

const TIERS: ReadinessTier[] = [
  "Foundation",
  "Developing",
  "Advanced",
  "Leader",
];

const ALL_DRAINS = [...TIME_DRAINS];

function buildForm(overrides: Partial<AssessmentFormData> = {}): AssessmentFormData {
  return {
    companyName: "Test Company",
    industry: "Medical/Dental",
    employees: "1–5",
    revenue: "Under $500K",
    yearsInBusiness: "2",
    crm: ["None"],
    emailTools: ["Gmail/Outlook only"],
    scheduling: ["None"],
    pm: ["None"],
    accounting: ["Other"],
    timeDrainsRanked: [
      "Data entry",
      "Email management",
      "Invoicing/billing",
      "Customer follow-up",
      "Appointment scheduling",
      "Report generation",
      "Social media",
      "Staff communication",
    ],
    aiTools: "Never",
    comfortLevel: 1,
    biggestConcern: "Cost",
    goals: ["Save staff time"],
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    phone: "555-0100",
    bestTimeToConnect: "Flexible",
    hearAbout: "Google",
    additionalNotes: "",
    ...overrides,
  };
}

/** Low maturity → AI Opportunity Audit ($1,500) */
const foundationAuditMock = buildForm({});

/** Mid maturity → AI Readiness Assessment ($5,000) */
const readinessAssessmentMock = buildForm({
  employees: "6–20",
  revenue: "$500K–$2M",
  crm: ["HubSpot"],
  emailTools: ["Mailchimp"],
  scheduling: ["Calendly"],
  pm: ["Spreadsheets"],
  accounting: ["QuickBooks"],
  timeDrainsRanked: [
    "Staff communication",
    "Social media",
    "Appointment scheduling",
    "Customer follow-up",
    "Report generation",
    "Data entry",
    "Email management",
    "Invoicing/billing",
  ],
  aiTools: "Tried a few",
  comfortLevel: 3,
  goals: ["Save staff time", "Reduce errors"],
});

/** High maturity + ROI → Workflow Automation Sprint ($12,000) */
const automationSprintMock = buildForm({
  employees: "51–200",
  revenue: "$10M+",
  yearsInBusiness: "15",
  crm: ["HubSpot"],
  emailTools: ["Mailchimp"],
  scheduling: ["Calendly"],
  pm: ["Asana"],
  accounting: ["QuickBooks"],
  timeDrainsRanked: [
    "Customer follow-up",
    "Appointment scheduling",
    "Report generation",
    "Data entry",
    "Email management",
    "Invoicing/billing",
    "Social media",
    "Staff communication",
  ],
  aiTools: "Yes, regularly",
  comfortLevel: 5,
  biggestConcern: "Team adoption",
  goals: ["Scale without hiring", "Competitive advantage", "Better reporting/visibility"],
});

const PACKAGE_CASES: Array<{
  name: string;
  data: AssessmentFormData;
  expectedPackage: RecommendedPackage;
}> = [
  {
    name: "Foundation audit tier",
    data: foundationAuditMock,
    expectedPackage: "AI Opportunity Audit ($1,500)",
  },
  {
    name: "Developing readiness tier",
    data: readinessAssessmentMock,
    expectedPackage: "AI Readiness Assessment ($5,000)",
  },
  {
    name: "Advanced automation sprint tier",
    data: automationSprintMock,
    expectedPackage: "Workflow Automation Sprint ($12,000)",
  },
];

function assertScoreShape(
  score: ReturnType<typeof calculateAIReadinessScore>,
  expectedPackage: RecommendedPackage,
) {
  expect(score.overallScore).toBeGreaterThanOrEqual(0);
  expect(score.overallScore).toBeLessThanOrEqual(100);
  expect(TIERS).toContain(score.tier);
  expect(score.topOpportunities).toHaveLength(3);
  expect(score.recommendedPackage).toBe(expectedPackage);
}

describe("calculateAIReadinessScore", () => {
  it.each(PACKAGE_CASES)(
    "$name produces expected recommended package",
    ({ data, expectedPackage }) => {
      const score = calculateAIReadinessScore(data);
      assertScoreShape(score, expectedPackage);
    },
  );

});

describe("validateAssessmentPayload edge cases", () => {
  it("accepts minimum viable submission without optional notes", () => {
    const data = buildForm({ additionalNotes: "" });
    const result = validateAssessmentPayload(data);
    expect(result.valid).toBe(true);
    if (result.valid) {
      const score = calculateAIReadinessScore(result.data);
      assertScoreShape(score, "AI Opportunity Audit ($1,500)");
    }
  });

  it("rejects missing optional-adjacent required fields", () => {
    const incomplete = buildForm({ email: "" });
    const result = validateAssessmentPayload(incomplete);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toMatch(/email/i);
    }
  });

  it("rejects invalid comfort level when omitted from scoring path", () => {
    const result = validateAssessmentPayload(
      buildForm({ comfortLevel: null as unknown as number }),
    );
    expect(result.valid).toBe(false);
  });

  it("scores with default-ranked time drains when only order matters", () => {
    const data = buildForm({ timeDrainsRanked: ALL_DRAINS });
    const score = calculateAIReadinessScore(data);
    expect(score.topOpportunities).toHaveLength(3);
    expect(score.overallScore).toBeGreaterThanOrEqual(0);
  });
});
