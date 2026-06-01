import {
  INITIAL_FORM_DATA,
  TIME_DRAINS,
  type AssessmentFormData,
} from "./assessment-types";

export type ReadinessTier = "Foundation" | "Developing" | "Advanced" | "Leader";

export type RecommendedPackage =
  | "AI Opportunity Audit ($1,500)"
  | "AI Readiness Assessment ($5,000)"
  | "Workflow Automation Sprint ($12,000)";

export type AIReadinessScore = {
  overallScore: number;
  tier: ReadinessTier;
  categoryScores: {
    techStack: number;
    processMaturity: number;
    dataReadiness: number;
    adoptionReadiness: number;
    roi_potential: number;
  };
  topOpportunities: string[];
  quickWins: string[];
  estimatedAnnualROI: string;
  recommendedPackage: RecommendedPackage;
};

const MANUAL_HEAVY_DRAINS = new Set([
  "Data entry",
  "Email management",
  "Invoicing/billing",
  "Report generation",
  "Social media",
  "Customer follow-up",
]);

const CATEGORY_WEIGHTS = {
  techStack: 0.2,
  processMaturity: 0.2,
  dataReadiness: 0.2,
  adoptionReadiness: 0.15,
  roi_potential: 0.25,
} as const;

const EMPLOYEE_ROI_MULTIPLIER: Record<string, number> = {
  "1–5": 1,
  "6–20": 1.4,
  "21–50": 2,
  "51–200": 2.8,
  "200+": 3.5,
};

const REVENUE_ROI_MULTIPLIER: Record<string, number> = {
  "Under $500K": 1,
  "$500K–$2M": 1.5,
  "$2M–$10M": 2.2,
  "$10M+": 3,
};

const DRAIN_ROI_WEIGHT: Record<string, number> = {
  "Customer follow-up": 1.1,
  "Appointment scheduling": 1,
  "Report generation": 1.2,
  "Data entry": 1.3,
  "Email management": 1.15,
  "Invoicing/billing": 1.25,
  "Social media": 0.9,
  "Staff communication": 0.95,
};

type IndustryKey =
  | "Medical/Dental"
  | "Real Estate"
  | "Legal/Financial"
  | "Construction"
  | "Wellness/Med Spa"
  | "Retail";

const INDUSTRY_OPPORTUNITIES: Record<
  IndustryKey,
  Record<string, string[]>
> = {
  "Medical/Dental": {
    "Appointment scheduling": [
      "AI-powered appointment reminders and no-show reduction workflows",
      "Automated intake form processing and EHR pre-population",
      "Smart waitlist management and same-day fill notifications",
    ],
    "Customer follow-up": [
      "Post-visit follow-up sequences with personalized care instructions",
      "Automated recall campaigns for preventive care appointments",
      "Treatment plan adherence check-ins via SMS and email",
    ],
    "Data entry": [
      "Insurance verification automation before appointments",
      "Clinical note transcription and structured data extraction",
      "Patient demographic sync between scheduling and billing systems",
    ],
    "Report generation": [
      "Automated production and collections dashboards by provider",
      "HIPAA-compliant operational reporting for practice managers",
      "Payer mix and denial trend analysis with AI summaries",
    ],
    "Email management": [
      "Triage and draft responses for patient inquiry inboxes",
      "Automated routing of referral and records-request emails",
      "Template-assisted responses for common billing questions",
    ],
    "Invoicing/billing": [
      "Claim scrubbing and coding suggestion before submission",
      "Automated patient balance reminders and payment plans",
      "Denial management workflows with resubmission tracking",
    ],
    "Social media": [
      "Localized content calendars for community health education",
      "Review response drafting aligned with HIPAA-safe messaging",
      "Before/after and service highlight posts with brand guardrails",
    ],
    "Staff communication": [
      "Shift handoff summaries and daily huddle briefings",
      "Policy update distribution with acknowledgment tracking",
      "Internal FAQ bot for front-desk and billing workflows",
    ],
  },
  "Real Estate": {
    "Customer follow-up": [
      "Lead nurture sequences tailored to buyer vs. seller stage",
      "Automated check-ins after showings with sentiment capture",
      "Re-engagement campaigns for dormant pipeline contacts",
    ],
    "Appointment scheduling": [
      "Showing coordination with calendar sync across agents",
      "Automated confirmation and driving-direction messages",
      "Open house RSVP follow-up and attendee segmentation",
    ],
    "Report generation": [
      "CMA and market update reports generated from MLS data",
      "Pipeline and conversion dashboards by agent and source",
      "Weekly activity summaries for team leads and brokers",
    ],
    "Data entry": [
      "Listing data entry from photos and documents into MLS/CRM",
      "Contact import cleanup and duplicate merge automation",
      "Transaction checklist population from contract uploads",
    ],
    "Email management": [
      "Inbox triage for buyer inquiries and vendor communications",
      "Draft listing announcement and just-listed email campaigns",
      "Automated routing of transaction emails to deal folders",
    ],
    "Invoicing/billing": [
      "Commission tracking and payout reconciliation workflows",
      "Expense capture for agents with approval routing",
      "Invoice reminders for vendor and marketing spend",
    ],
    "Social media": [
      "Listing highlight reels and carousel content from MLS feeds",
      "Neighborhood market snapshot posts on a fixed cadence",
      "Agent brand content with local market commentary drafts",
    ],
    "Staff communication": [
      "Transaction milestone alerts for coordinators and TCs",
      "Daily priority lists for agents based on hot leads",
      "Team playbook Q&A for compliance and brokerage policies",
    ],
  },
  "Legal/Financial": {
    "Customer follow-up": [
      "Client onboarding status updates and document reminders",
      "Matter milestone notifications with next-step clarity",
      "Prospect follow-up for consultations and proposal windows",
    ],
    "Appointment scheduling": [
      "Consultation booking with conflict checks and prep packets",
      "Automated reminders with secure document upload links",
      "Paralegal and advisor calendar coordination",
    ],
    "Report generation": [
      "Client portfolio and matter status reports with AI summaries",
      "Compliance and audit trail reporting automation",
      "KPI dashboards for utilization, billing, and pipeline",
    ],
    "Data entry": [
      "Contract and form data extraction into matter management",
      "KYC/AML document intake and field population",
      "Time entry suggestions from calendar and email activity",
    ],
    "Email management": [
      "Secure email triage with privilege-aware draft responses",
      "Routing of client requests to the right matter folder",
      "Template-assisted responses for common status inquiries",
    ],
    "Invoicing/billing": [
      "Time capture prompts and narrative drafting for invoices",
      "Trust account reconciliation assistance and alerts",
      "Collections follow-up sequences for aged receivables",
    ],
    "Social media": [
      "Thought leadership content from firm expertise areas",
      "Regulatory update summaries adapted for client audiences",
      "Event and webinar promotion with registration follow-up",
    ],
    "Staff communication": [
      "Matter assignment notifications with context briefs",
      "Deadline and filing reminder distribution to teams",
      "Internal knowledge base for procedures and templates",
    ],
  },
  Construction: {
    "Customer follow-up": [
      "Bid follow-up sequences with scope clarification prompts",
      "Homeowner update cadence during active projects",
      "Subcontractor outreach and qualification follow-ups",
    ],
    "Appointment scheduling": [
      "Site visit and estimate scheduling with crew availability",
      "Inspection and permit appointment coordination",
      "Change-order review meeting booking automation",
    ],
    "Report generation": [
      "Job costing and margin reports by project and phase",
      "Daily field report aggregation into executive summaries",
      "Safety and compliance reporting with trend highlights",
    ],
    "Data entry": [
      "Punch list and photo documentation into project systems",
      "Material takeoff assistance from plans and specs",
      "Timesheet and equipment log digitization from mobile",
    ],
    "Email management": [
      "RFI and submittal email routing to project managers",
      "Client change-request triage and acknowledgment drafts",
      "Vendor quote comparison summaries from inbox threads",
    ],
    "Invoicing/billing": [
      "Progress billing preparation from field completion data",
      "Lien waiver and pay application document assembly",
      "A/R follow-up for retainage and outstanding draws",
    ],
    "Social media": [
      "Project progress photo posts with geo-targeted captions",
      "Before/after portfolio content from job site media",
      "Hiring and culture posts to support workforce pipeline",
    ],
    "Staff communication": [
      "Daily crew briefings with weather and schedule changes",
      "Subcontractor coordination alerts for critical path tasks",
      "Safety incident reporting and escalation workflows",
    ],
  },
  "Wellness/Med Spa": {
    "Customer follow-up": [
      "Post-treatment care sequences and rebooking prompts",
      "Membership and package renewal outreach automation",
      "Consult-to-book follow-up for high-intent leads",
    ],
    "Appointment scheduling": [
      "Online booking with provider-specific availability rules",
      "Waitlist fill and last-minute cancellation backfill",
      "Multi-service appointment sequencing and buffer logic",
    ],
    "Report generation": [
      "Provider utilization and retail attach rate dashboards",
      "Campaign ROI reporting for promotions and memberships",
      "Client lifetime value and retention cohort summaries",
    ],
    "Data entry": [
      "Client intake and consent form data into CRM/POS",
      "Inventory usage logging tied to treatment records",
      "Gift card and package redemption tracking automation",
    ],
    "Email management": [
      "Inquiry triage for treatment questions and pricing",
      "Promotional campaign drafting with compliance guardrails",
      "VIP client concierge response templates",
    ],
    "Invoicing/billing": [
      "Membership billing reminders and failed payment recovery",
      "Retail upsell prompts at checkout and follow-up",
      "Tip and commission reconciliation for staff",
    ],
    "Social media": [
      "Treatment education reels with booking CTAs",
      "Seasonal promotion content calendars",
      "Review response and reputation management drafts",
    ],
    "Staff communication": [
      "Daily schedule briefings with prep and retail goals",
      "Product and protocol update distribution to providers",
      "Front-desk scripts and FAQ for new services",
    ],
  },
  Retail: {
    "Customer follow-up": [
      "Post-purchase thank-you and review request sequences",
      "Win-back campaigns for lapsed customers by segment",
      "VIP and loyalty tier outreach with personalized offers",
    ],
    "Appointment scheduling": [
      "Personal shopping and styling appointment booking",
      "Inventory hold and pickup scheduling automation",
      "Staff shift and event staffing coordination",
    ],
    "Report generation": [
      "Sales, margin, and inventory turnover dashboards",
      "Promotional lift analysis by SKU and channel",
      "Foot traffic and conversion reporting with AI commentary",
    ],
    "Data entry": [
      "Product catalog updates from supplier sheets and images",
      "Receiving and inventory count reconciliation assistance",
      "Customer profile enrichment from purchase history",
    ],
    "Email management": [
      "Customer service inbox triage and response drafting",
      "Wholesale and vendor correspondence routing",
      "Campaign performance reply handling and list hygiene",
    ],
    "Invoicing/billing": [
      "Vendor invoice matching to POs and receipts",
      "Returns and credit memo processing workflows",
      "Cash reconciliation summaries for store managers",
    ],
    "Social media": [
      "Product drop and sale announcement content pipelines",
      "User-generated content curation and repost workflows",
      "Local event promotion tied to in-store inventory",
    ],
    "Staff communication": [
      "Daily sales goal and promo briefings for floor staff",
      "Inventory alert distribution for low-stock hero SKUs",
      "Onboarding micro-training for seasonal hires",
    ],
  },
};

const GENERIC_OPPORTUNITIES: Record<string, string[]> = {
  "Customer follow-up": [
    "Automated lead and client follow-up sequences",
    "CRM-triggered reminders for stale opportunities",
    "Personalized re-engagement campaigns by segment",
  ],
  "Appointment scheduling": [
    "Self-serve booking with automated confirmations",
    "Calendar sync and no-show reduction workflows",
    "Waitlist and cancellation backfill automation",
  ],
  "Report generation": [
    "Executive dashboards with AI-generated summaries",
    "Scheduled operational reports from connected systems",
    "KPI alerting when metrics drift from targets",
  ],
  "Data entry": [
    "Document and form data extraction into core systems",
    "Duplicate detection and record cleanup automation",
    "Batch import validation with exception routing",
  ],
  "Email management": [
    "Inbox triage with draft responses for common requests",
    "Email-to-task routing for team accountability",
    "Template libraries with AI-assisted personalization",
  ],
  "Invoicing/billing": [
    "Invoice generation and payment reminder automation",
    "Expense capture and approval routing",
    "A/R aging follow-up sequences",
  ],
  "Social media": [
    "Content calendar generation with brand guardrails",
    "Review monitoring and response drafting",
    "Campaign asset repurposing across channels",
  ],
  "Staff communication": [
    "Daily briefing digests from connected tools",
    "Internal FAQ and policy chat for frontline teams",
    "Task handoff notifications with context summaries",
  ],
};

function clampScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

function countActiveCategories(selections: string[][]): number {
  return selections.filter(
    (items) => items.length > 0 && !items.every((item) => item === "None"),
  ).length;
}

function countNoneCategories(selections: string[][]): number {
  return selections.filter(
    (items) => items.length === 0 || items.includes("None"),
  ).length;
}

function scoreTechStack(formData: AssessmentFormData): number {
  const categories = [
    formData.crm,
    formData.emailTools,
    formData.scheduling,
    formData.pm,
    formData.accounting,
  ];

  const activeCount = countActiveCategories(categories);
  const noneCount = countNoneCategories(categories);

  let score = activeCount * 18;

  const hasCrm = formData.crm.some((item) => item !== "None");
  const hasDedicatedPm = formData.pm.some(
    (item) => item !== "None" && item !== "Spreadsheets",
  );
  const hasDedicatedAccounting = formData.accounting.some(
    (item) => item === "QuickBooks" || item === "Xero" || item === "FreshBooks",
  );
  const usesSpreadsheetsOnly =
    formData.pm.includes("Spreadsheets") && !hasDedicatedPm;

  if (hasCrm && hasDedicatedPm && hasDedicatedAccounting) {
    score += 15;
  }

  if (usesSpreadsheetsOnly) {
    score -= 12;
  }

  score -= noneCount * 8;

  const totalSelections = categories.reduce((sum, items) => sum + items.length, 0);
  if (totalSelections > activeCount + 2) {
    score -= 10;
  }

  if (formData.emailTools.includes("Gmail/Outlook only")) {
    score -= 5;
  }

  return clampScore(score);
}

function scoreProcessMaturity(formData: AssessmentFormData): number {
  const topDrains = formData.timeDrainsRanked.slice(0, 3);
  const manualInTop3 = topDrains.filter((drain) =>
    MANUAL_HEAVY_DRAINS.has(drain),
  ).length;

  let score = 85 - manualInTop3 * 18;

  const bottomDrains = formData.timeDrainsRanked.slice(-2);
  const manualAtBottom = bottomDrains.filter((drain) =>
    MANUAL_HEAVY_DRAINS.has(drain),
  ).length;
  score += manualAtBottom * 8;

  if (formData.timeDrainsRanked[0] === "Data entry") {
    score -= 10;
  }

  return clampScore(score);
}

function scoreDataReadiness(formData: AssessmentFormData): number {
  let score = 40;

  if (formData.accounting.some((item) => item !== "Other")) {
    score += 15;
  }

  if (
    formData.accounting.includes("QuickBooks") ||
    formData.accounting.includes("Xero")
  ) {
    score += 15;
  }

  if (formData.pm.includes("Spreadsheets")) {
    score -= 20;
  } else if (formData.pm.some((item) => item !== "None")) {
    score += 20;
  }

  if (formData.crm.some((item) => item !== "None")) {
    score += 15;
  }

  if (formData.scheduling.some((item) => item !== "None")) {
    score += 10;
  }

  return clampScore(score);
}

function scoreAdoptionReadiness(formData: AssessmentFormData): number {
  const aiUsageScore: Record<string, number> = {
    "Yes, regularly": 90,
    "Tried a few": 55,
    Never: 25,
  };

  const usage = aiUsageScore[formData.aiTools] ?? 40;
  const comfort = formData.comfortLevel ?? 3;
  const comfortScore = ((comfort - 1) / 4) * 100;

  return clampScore(usage * 0.55 + comfortScore * 0.45);
}

function scoreRoiPotential(formData: AssessmentFormData): number {
  const employeeFactor = (EMPLOYEE_ROI_MULTIPLIER[formData.employees] ?? 1) * 18;
  const revenueFactor = (REVENUE_ROI_MULTIPLIER[formData.revenue] ?? 1) * 16;

  const topDrains = formData.timeDrainsRanked.slice(0, 3);
  const drainFactor = topDrains.reduce((sum, drain, index) => {
    const weight = DRAIN_ROI_WEIGHT[drain] ?? 1;
    const positionMultiplier = index === 0 ? 1.2 : index === 1 ? 1 : 0.85;
    return sum + weight * positionMultiplier * 8;
  }, 0);

  return clampScore(employeeFactor + revenueFactor + drainFactor);
}

function scoreToTier(score: number): ReadinessTier {
  if (score >= 80) return "Leader";
  if (score >= 60) return "Advanced";
  if (score >= 40) return "Developing";
  return "Foundation";
}

function resolveIndustryKey(industry: string): IndustryKey | null {
  if (industry in INDUSTRY_OPPORTUNITIES) {
    return industry as IndustryKey;
  }
  return null;
}

function getTopOpportunities(formData: AssessmentFormData): string[] {
  const primaryDrain = formData.timeDrainsRanked[0];
  const secondaryDrain = formData.timeDrainsRanked[1];
  const industryKey = resolveIndustryKey(formData.industry);
  const lookup = industryKey
    ? INDUSTRY_OPPORTUNITIES[industryKey]
    : GENERIC_OPPORTUNITIES;

  const primary = lookup[primaryDrain] ?? GENERIC_OPPORTUNITIES[primaryDrain] ?? [];
  const secondary =
    lookup[secondaryDrain] ?? GENERIC_OPPORTUNITIES[secondaryDrain] ?? [];

  const combined = [...primary, ...secondary];
  const unique = [...new Set(combined)];

  if (unique.length >= 3) {
    return unique.slice(0, 3);
  }

  const fallback = Object.values(lookup).flat();
  return [...new Set([...unique, ...fallback])].slice(0, 3);
}

function getQuickWins(formData: AssessmentFormData): string[] {
  const wins: string[] = [];
  const topDrains = formData.timeDrainsRanked.slice(0, 3);

  if (topDrains.includes("Email management")) {
    wins.push(
      "Deploy an AI email triage assistant with 10 approved response templates for your top inquiry types",
    );
  }

  if (
    topDrains.includes("Appointment scheduling") &&
    formData.scheduling.includes("None")
  ) {
    wins.push(
      "Launch self-serve online booking with automated confirmations to cut phone-tag scheduling within 30 days",
    );
  }

  if (
    topDrains.includes("Data entry") ||
    formData.pm.includes("Spreadsheets")
  ) {
    wins.push(
      "Automate one repetitive data-entry workflow (intake, orders, or timesheets) using form-to-sheet or CRM automation",
    );
  }

  if (topDrains.includes("Customer follow-up")) {
    wins.push(
      "Build a 3-touch follow-up sequence in your CRM for new leads or post-visit clients with AI-drafted messages",
    );
  }

  if (topDrains.includes("Report generation")) {
    wins.push(
      "Connect your accounting/CRM data to a weekly auto-generated KPI email so reporting takes minutes, not hours",
    );
  }

  if (topDrains.includes("Invoicing/billing")) {
    wins.push(
      "Turn on automated payment reminders and past-due follow-ups tied to your accounting platform",
    );
  }

  if (formData.aiTools === "Never" || (formData.comfortLevel ?? 0) <= 2) {
    wins.push(
      "Run a 30-day AI pilot with one trusted tool (email drafts or meeting notes) and measure hours saved per week",
    );
  }

  if (
    formData.crm.includes("None") &&
    topDrains.some((drain) =>
      ["Customer follow-up", "Email management"].includes(drain),
    )
  ) {
    wins.push(
      "Stand up a lightweight CRM pipeline with automated task reminders for every new inquiry",
    );
  }

  return [...new Set(wins)].slice(0, 3);
}

function safeDivide(numerator: number, denominator: number, fallback = 1): number {
  return denominator !== 0 ? numerator / denominator : fallback;
}

function normalizeFormData(input: AssessmentFormData): AssessmentFormData {
  return {
    ...INITIAL_FORM_DATA,
    ...input,
    companyName: input.companyName ?? "",
    industry: input.industry ?? "",
    employees: input.employees ?? "",
    revenue: input.revenue ?? "",
    yearsInBusiness: input.yearsInBusiness ?? "",
    crm: Array.isArray(input.crm) ? input.crm : [],
    emailTools: Array.isArray(input.emailTools) ? input.emailTools : [],
    scheduling: Array.isArray(input.scheduling) ? input.scheduling : [],
    pm: Array.isArray(input.pm) ? input.pm : [],
    accounting: Array.isArray(input.accounting) ? input.accounting : [],
    timeDrainsRanked:
      Array.isArray(input.timeDrainsRanked) &&
      input.timeDrainsRanked.length === TIME_DRAINS.length
        ? input.timeDrainsRanked
        : [...TIME_DRAINS],
    aiTools: input.aiTools ?? "",
    comfortLevel:
      typeof input.comfortLevel === "number" && Number.isFinite(input.comfortLevel)
        ? input.comfortLevel
        : null,
    biggestConcern: input.biggestConcern ?? "",
    goals: Array.isArray(input.goals) ? input.goals : [],
    firstName: input.firstName ?? "",
    lastName: input.lastName ?? "",
    email: input.email ?? "",
    phone: input.phone ?? "",
    bestTimeToConnect: input.bestTimeToConnect ?? "",
    hearAbout: input.hearAbout ?? "",
    additionalNotes: input.additionalNotes ?? "",
  };
}

function estimateAnnualRoi(formData: AssessmentFormData): string {
  const employeeMultiplier = EMPLOYEE_ROI_MULTIPLIER[formData.employees] ?? 1;
  const revenueMultiplier = REVENUE_ROI_MULTIPLIER[formData.revenue] ?? 1;

  const drainIntensity = formData.timeDrainsRanked
    .slice(0, 3)
    .reduce((sum, drain) => sum + (DRAIN_ROI_WEIGHT[drain] ?? 1), 0);

  const intensityFactor = safeDivide(drainIntensity, 3, 1);

  const baseLow = 15000 * employeeMultiplier * intensityFactor;
  const baseHigh = 28000 * revenueMultiplier * intensityFactor;

  const low = Math.round(baseLow / 1000) * 1000;
  const high = Math.round(Math.max(baseHigh, low + 10000) / 1000) * 1000;

  return `$${low.toLocaleString("en-US")}–$${high.toLocaleString("en-US")}`;
}

function recommendPackage(
  overallScore: number,
  tier: ReadinessTier,
  estimatedAnnualROI: string,
): RecommendedPackage {
  const roiHigh = Number.parseInt(
    estimatedAnnualROI.split("–")[1]?.replace(/[$,]/g, "") ?? "0",
    10,
  );

  if (
    (tier === "Advanced" || tier === "Leader") &&
    overallScore >= 65 &&
    roiHigh >= 60000
  ) {
    return "Workflow Automation Sprint ($12,000)";
  }

  if (tier === "Foundation" || overallScore < 45) {
    return "AI Opportunity Audit ($1,500)";
  }

  return "AI Readiness Assessment ($5,000)";
}

export function calculateAIReadinessScore(
  formData: AssessmentFormData,
): AIReadinessScore {
  const normalized = normalizeFormData(formData);

  const categoryScores = {
    techStack: scoreTechStack(normalized),
    processMaturity: scoreProcessMaturity(normalized),
    dataReadiness: scoreDataReadiness(normalized),
    adoptionReadiness: scoreAdoptionReadiness(normalized),
    roi_potential: scoreRoiPotential(normalized),
  };

  const overallScore = clampScore(
    categoryScores.techStack * CATEGORY_WEIGHTS.techStack +
      categoryScores.processMaturity * CATEGORY_WEIGHTS.processMaturity +
      categoryScores.dataReadiness * CATEGORY_WEIGHTS.dataReadiness +
      categoryScores.adoptionReadiness * CATEGORY_WEIGHTS.adoptionReadiness +
      categoryScores.roi_potential * CATEGORY_WEIGHTS.roi_potential,
  );

  const tier = scoreToTier(overallScore);
  const estimatedAnnualROI = estimateAnnualRoi(normalized);

  const result: AIReadinessScore = {
    overallScore,
    tier,
    categoryScores,
    topOpportunities: getTopOpportunities(normalized),
    quickWins: getQuickWins(normalized),
    estimatedAnnualROI,
    recommendedPackage: recommendPackage(overallScore, tier, estimatedAnnualROI),
  };

  if (process.env.NODE_ENV === "development") {
    console.log("[scoring] input:", normalized);
    console.log("[scoring] output:", result);
  }

  return result;
}
