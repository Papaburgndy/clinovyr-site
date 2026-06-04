import type { Company, Survey } from "@prisma/client";
import type { AssessmentFormData } from "@/types/assessment";
import { resolveScore } from "@/lib/deliverables/artifacts";

export const CONSTRUCTION_AI_SYSTEM =
  "You are writing a comprehensive AI readiness report for a general contractor or specialty trade firm in Placer County, California (Roseville, Granite Bay, Rocklin, Lincoln). Use plain language — no jargon. Be specific, practical, and ROI-focused. Reference bid estimation, subcontractor coordination, client progress updates, lead qualification, and materials tracking. Include local context: ADU boom, Bosch facility expansion, Placer County permit timelines.";

export const CONSTRUCTION_BID_SYSTEM =
  "You are a Clinovyr construction operations consultant creating a practical guide for contractors to use AI when drafting bids. Provide exact copy-paste prompts, step-by-step workflow, and a realistic sample bid scope input with AI output example. Focus on saving owner time without replacing field judgment.";

export const CONSTRUCTION_COMMUNICATION_SYSTEM =
  "You are a Clinovyr construction communications specialist creating immediately usable message templates for subcontractor and client coordination. Each template needs: situation description, full message text (email/SMS ready), and customization note. Word-doc style — professional but direct, typical of small-to-mid GCs.";

export function isConstructionIndustry(industry: string): boolean {
  return /construction|contractor|building|remodel|gc|general contractor/i.test(
    industry,
  );
}

export function companySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function getContractorTypeLabel(
  company: Company,
  formData: AssessmentFormData | null,
): string {
  const industry = formData?.industry ?? company.industry;
  const size = formData?.employees ?? company.size;
  if (/remodel|renovation/i.test(industry)) return "Residential Remodeling Contractor";
  if (/commercial/i.test(industry)) return "Commercial General Contractor";
  if (/specialty|trade|electrical|plumb|hvac/i.test(industry)) {
    return "Specialty Trade Contractor";
  }
  if (size === "1–5") return "Owner-Operator GC";
  if (size === "6–20") return "Small General Contractor";
  if (size === "21–50") return "Mid-Size Construction Firm";
  return "Regional Construction Company";
}

export function recommendProjectManagementTool(
  company: Company,
  formData: AssessmentFormData | null,
): "Procore" | "Google Sheets" | "Buildertrend" | "JobTread" {
  const existing = formData?.pm?.join(" ") ?? "";
  if (/procore/i.test(existing)) return "Procore";
  if (/buildertrend/i.test(existing)) return "Buildertrend";
  if (/jobtread/i.test(existing)) return "JobTread";

  const size = formData?.employees ?? company.size;
  if (size === "1–5" || size === "6–20") return "Google Sheets";
  if (size === "21–50") return "Buildertrend";
  return "Procore";
}

export function defaultOwnerHourlyRate(_formData: AssessmentFormData | null): number {
  return 150;
}

export function estimateOwnerAdminHours(formData: AssessmentFormData | null): number {
  const drains = formData?.timeDrainsRanked ?? [];
  const bids = drains.some((d) => /bid|estimate|proposal/i.test(d)) ? 3 : 1.5;
  const comms = drains.some((d) => /client|communicat|update|follow/i.test(d)) ? 3 : 2;
  const subs = drains.some((d) => /sub|schedul|coord/i.test(d)) ? 2.5 : 1.5;
  const admin = drains.some((d) => /admin|invoice|paperwork/i.test(d)) ? 2 : 1;
  return Math.round((bids + comms + subs + admin) * 10) / 10;
}

export function defaultActiveJobs(employees: string | undefined): number {
  if (employees === "1–5") return 4;
  if (employees === "6–20") return 8;
  if (employees === "21–50") return 15;
  return 25;
}

export function defaultAvgProjectValue(employees: string | undefined): number {
  if (employees === "1–5") return 85_000;
  if (employees === "6–20") return 125_000;
  if (employees === "21–50") return 250_000;
  return 500_000;
}

export function buildConstructionContextBlock(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): string {
  const score = resolveScore(formData, survey);
  const topDrains = formData?.timeDrainsRanked?.slice(0, 5).join(", ") ?? "N/A";
  const stack = [
    formData?.pm?.length ? `Project mgmt: ${formData.pm.join(", ")}` : null,
    formData?.crm?.length ? `CRM/leads: ${formData.crm.join(", ")}` : null,
    formData?.accounting?.length
      ? `Accounting: ${formData.accounting.join(", ")}`
      : null,
    formData?.emailTools?.length
      ? `Email: ${formData.emailTools.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return [
    `Company: ${company.name}`,
    `Type: ${getContractorTypeLabel(company, formData)}`,
    `Industry: ${company.industry} · Team size: ${company.size}`,
    `Revenue range: ${formData?.revenue ?? company.revenue ?? "N/A"}`,
    `Owner effective rate (est.): $${defaultOwnerHourlyRate(formData)}/hr`,
    `Owner admin hours/week (est.): ${estimateOwnerAdminHours(formData)}`,
    `Active jobs (est.): ${defaultActiveJobs(formData?.employees ?? company.size)}`,
    `Readiness score: ${score?.overallScore ?? survey.score ?? "N/A"}/100 (${score?.tier ?? survey.tier ?? "N/A"})`,
    `Top time drains: ${topDrains}`,
    `Tech stack: ${stack || "Not fully documented"}`,
    `Recommended PM tool: ${recommendProjectManagementTool(company, formData)}`,
    `AI comfort: ${formData?.comfortLevel ?? "N/A"}/10 · AI tools used: ${formData?.aiTools ?? "N/A"}`,
    `Biggest concern: ${formData?.biggestConcern ?? "N/A"}`,
    `Goals: ${formData?.goals?.join(", ") ?? "N/A"}`,
    `Executive summary: ${survey.executiveSummary ?? "N/A"}`,
    `Top opportunities: ${Array.isArray(survey.topOpportunities) ? (survey.topOpportunities as string[]).join("; ") : "N/A"}`,
    `Estimated ROI: ${survey.estimatedROI ?? score?.estimatedAnnualROI ?? "N/A"}`,
    `Notes: ${formData?.additionalNotes ?? "None"}`,
  ].join("\n");
}

export type ConstructionFileResult = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  displayName: string;
};

export const PLACER_CONSTRUCTION_INSIGHT =
  "Placer County is in an ADU and infill boom — Roseville and Granite Bay homeowners are adding units while commercial work accelerates around the Bosch facility corridor. Permit timelines at Placer County Building Division often run 4–8 weeks for residential; staying ahead on client communication during waits protects margins and referrals.";

export const OWNER_TIME_INSIGHT =
  "At $150/hr owner time, 8 hours/week on admin (bids, client updates, sub follow-ups) = $62,400/year — time that could go to estimating, site visits, and closing the next job.";

export type ConstructionMessageTemplate = {
  title: string;
  situation: string;
  message: string;
  customizationNote: string;
};

export const DEFAULT_CONSTRUCTION_TEMPLATES: ConstructionMessageTemplate[] = [
  {
    title: "Initial Subcontractor Scope Request",
    situation:
      "You need pricing from a sub for a new job but don't have formal plans yet — just a walkthrough and photos.",
    message:
      "Hi [SUB NAME],\n\nWe're bidding a [PROJECT TYPE] at [ADDRESS] in [CITY]. Scope includes:\n• [SCOPE ITEM 1]\n• [SCOPE ITEM 2]\n• [SCOPE ITEM 3]\n\nTarget start: [DATE]. Plans attached / site walk available [DATE/TIME].\n\nPlease send lump-sum or T&M estimate by [DEADLINE]. Include lead time and any exclusions.\n\nThanks,\n[YOUR NAME]\n[COMPANY] · [PHONE]",
    customizationNote:
      "Attach 3–5 site photos. If no plans, list room dimensions from your field notes. Set deadline 48–72 hrs before your bid due date.",
  },
  {
    title: "COI & W-9 Follow-Up",
    situation:
      "Sub is scheduled to start Monday but hasn't sent insurance certificate or W-9.",
    message:
      "Hi [SUB NAME],\n\nQuick reminder — we need your current COI (naming [COMPANY] as additional insured) and W-9 before mobilization on [PROJECT]. Start date is [DATE].\n\nPlease send today or confirm ETA. We can't issue PO without these on file.\n\nThanks,\n[YOUR NAME]",
    customizationNote:
      "Send 72 hrs before start, then day-before if still missing. CC your bookkeeper on the second reminder.",
  },
  {
    title: "Weekly Schedule Confirmation",
    situation:
      "Monday morning — confirming who is on which job this week to avoid no-shows and conflicts.",
    message:
      "Team — here's the schedule for week of [DATE]:\n\n• [JOB 1 / ADDRESS]: [SUB/CREW] — [TASK]\n• [JOB 2 / ADDRESS]: [SUB/CREW] — [TASK]\n• [JOB 3 / ADDRESS]: [HOLD / TBD]\n\nReply CONFIRM with your job assignment or flag conflicts by noon today.\n\n— [YOUR NAME]",
    customizationNote:
      "Send every Monday 7am. Copy supers and key subs only — not entire vendor list.",
  },
  {
    title: "Change Order Request to Client",
    situation:
      "Client asked for additional work not in original contract — you need written approval before proceeding.",
    message:
      "Hi [CLIENT NAME],\n\nPer our conversation on [DATE], the following is outside the original scope for [PROJECT]:\n\n[DESCRIBE CHANGE — e.g., relocate plumbing, upgrade tile package]\n\nEstimated additional cost: $[AMOUNT] (+/- [X]% pending [CONDITION]).\nTimeline impact: [+X DAYS / NONE].\n\nPlease reply APPROVE to proceed, or let's schedule a call to discuss alternatives.\n\n[YOUR NAME]\n[COMPANY]",
    customizationNote:
      "Always put dollar amount and schedule impact in writing. Do not start work until you have email approval or signed CO.",
  },
  {
    title: "Payment Reminder (Progress Draw)",
    situation:
      "Progress invoice is 7 days past due; you need payment before ordering materials for next phase.",
    message:
      "Hi [CLIENT NAME],\n\nFriendly reminder: Invoice #[NUMBER] for $[AMOUNT] ( [MILESTONE DESCRIPTION] ) was due [DATE].\n\nOnce received, we'll order [NEXT PHASE MATERIALS] and schedule [CREW] for [DATE].\n\nPay link: [LINK] · Check payable to [COMPANY].\n\nQuestions? Call me at [PHONE].\n\nThanks,\n[YOUR NAME]",
    customizationNote:
      "First reminder = friendly. Second at 14 days = firm with hold on scheduling. Match tone to contract payment terms.",
  },
  {
    title: "Sub Performance Issue",
    situation:
      "Sub missed schedule, quality issue, or no-show — need direct conversation without burning relationship.",
    message:
      "Hi [SUB NAME],\n\nOn [PROJECT] today we had [SPECIFIC ISSUE — e.g., crew no-show, rough-in not per plan].\n\nThis impacts [CRITICAL PATH ITEM] scheduled for [DATE].\n\nNeed your plan by EOD: [1] When you'll be on site, [2] How you'll correct [ISSUE], [3] Who is point of contact.\n\nWe want to keep you on the job but need reliability on the items above.\n\n[YOUR NAME] · [PHONE]",
    customizationNote:
      "Document with photos same day. Follow up phone call if no response in 4 hours on active jobs.",
  },
  {
    title: "Client Weekly Progress Update",
    situation:
      "Friday afternoon — homeowner wants to know what happened this week and what's next.",
    message:
      "Hi [CLIENT NAME],\n\nProgress update for [PROJECT] — week of [DATE]:\n\n✓ Completed: [ITEM 1], [ITEM 2]\n→ In progress: [ITEM 3]\n→ Next week: [ITEM 4], [ITEM 5]\n\nOpen items: [PERMIT STATUS / CLIENT SELECTION / INSPECTION DATE]\n\nPhotos attached. Questions? Reply here or call [PHONE].\n\nHave a great weekend,\n[YOUR NAME]\n[COMPANY]",
    customizationNote:
      "Send every Friday by 4pm. Attach 2–4 photos max. AI can draft from your bullet notes — you review before send.",
  },
  {
    title: "Inspection Readiness Notice",
    situation:
      "Inspection scheduled — need sub to confirm work is ready and site is accessible.",
    message:
      "Hi [SUB NAME],\n\n[INSPECTION TYPE] inspection for [PROJECT] is scheduled [DATE] [TIME WINDOW].\n\nConfirm by reply:\n1. Work in your scope is 100% complete and accessible\n2. Site is clean and safe for inspector\n3. Any corrections needed before [DATE]\n\nFailure to be ready may delay inspection and downstream trades.\n\n[YOUR NAME]",
    customizationNote:
      "Send 48 hrs before inspection. CC client only if they need to provide access.",
  },
  {
    title: "Lead Qualification Reply",
    situation:
      "Homeowner filled out website form — need to respond quickly and filter tire-kickers.",
    message:
      "Hi [NAME],\n\nThanks for reaching out about your [PROJECT TYPE] in [CITY]. To see if we're a fit, a few quick questions:\n\n1. What's your target timeline to start?\n2. Do you have plans or is this design-build?\n3. Approximate budget range you're working with?\n\nWe specialize in [YOUR NICHE — e.g., Placer County remodels $75K–$250K]. If that aligns, I'll call you [DAY] to discuss next steps.\n\n[YOUR NAME]\n[COMPANY] · [PHONE]",
    customizationNote:
      "Respond within 1 hour during business hours. Automate first reply via n8n; owner handles hot leads personally.",
  },
  {
    title: "Project Close-Out & Referral Ask",
    situation:
      "Punch list complete, final payment received — wrap up professionally and ask for review.",
    message:
      "Hi [CLIENT NAME],\n\n[PROJECT] is officially complete — thank you for trusting [COMPANY].\n\nAttached: final invoice receipt, warranty info, and maintenance tips for [KEY SYSTEMS].\n\nIf you're happy with the work, we'd appreciate a Google review: [LINK]. Referrals are the highest compliment — send anyone considering a remodel our way.\n\nEnjoy your [NEW KITCHEN / ADU / etc.]!\n\n[YOUR NAME]",
    customizationNote:
      "Send within 48 hrs of final walkthrough. Wait 7 days before review ask if punch list was contentious.",
  },
];

export type BidGuideStep = {
  step: number;
  title: string;
  description: string;
  prompt: string;
};

export const DEFAULT_BID_GUIDE_STEPS: BidGuideStep[] = [
  {
    step: 1,
    title: "Gather & Organize Scope Inputs",
    description:
      "Collect plans, photos, site notes, and client wish list into one document before opening AI. Garbage in = garbage out on bids.",
    prompt:
      "I'm preparing a bid for a [PROJECT TYPE] at [ADDRESS]. Here are my inputs:\n\nPlans/specs: [PASTE OR SUMMARIZE]\nSite conditions: [ACCESS, DEMO, SOIL, ETC.]\nClient priorities: [LIST]\nMy exclusions policy: [STANDARD EXCLUSIONS]\n\nList missing information I need before estimating. Output as a numbered checklist.",
  },
  {
    step: 2,
    title: "AI Scope Analysis & Trade Breakout",
    description:
      "Have AI break the project into trade packages with flags for allowances and unknowns.",
    prompt:
      "Analyze this construction scope for a [RESIDENTIAL/COMMERCIAL] project in Placer County, CA:\n\n[PASTE SCOPE / PLAN NOTES]\n\nOutput:\n1. Trade-by-trade scope summary (demo, framing, MEP, finishes)\n2. Items needing subcontractor quotes (flag each)\n3. Allowance recommendations with $ ranges for [REGION]\n4. Risk items that could blow budget (permits, unknowns behind walls)\n5. Suggested contingency % for this project type\n\nPlain language. No jargon.",
  },
  {
    step: 3,
    title: "Draft Proposal Narrative",
    description:
      "Turn technical scope into client-friendly proposal language that builds trust.",
    prompt:
      "Write a proposal narrative for homeowner [CLIENT NAME] at [ADDRESS].\n\nProject: [DESCRIPTION]\nScope summary: [PASTE FROM STEP 2]\nTimeline: [WEEKS/MONTHS]\nPrice: $[AMOUNT] (payment schedule: [DEPOSIT / DRAWS])\n\nTone: confident, clear, not salesy. Include:\n- What we will do (bullet scope)\n- What is NOT included\n- Permitting approach for Placer County\n- Next steps to sign\n\nUnder 400 words.",
  },
  {
    step: 4,
    title: "Sub RFQ Package from Scope",
    description:
      "Generate consistent RFQ emails for each trade from the same scope analysis.",
    prompt:
      "Create subcontractor RFQ text for [TRADE — e.g., electrical] on this project:\n\nAddress: [ADDRESS]\nScope for this trade: [PASTE TRADE SECTION]\nBid due: [DATE]\nStart window: [DATE]\n\nInclude: scope bullets, plan reference, insurance requirements, lump-sum vs T&M ask, and submission format. Professional, direct, under 200 words.",
  },
  {
    step: 5,
    title: "Review, Adjust & Price",
    description:
      "AI drafts — you price. Never send AI numbers without your markup, overhead, and profit applied.",
    prompt:
      "Review this draft bid summary for gaps and inconsistencies:\n\n[PASTE FULL DRAFT]\n\nMy target margin: [X]% · Overhead: [Y]%\n\nFlag: math errors, missing trades, scope overlap, unrealistic timeline, compliance gaps for California residential. Suggest 3 clarifying questions to ask the client before finalizing.",
  },
];

export const SAMPLE_BID_INPUT = `Kitchen & great room remodel — 1,850 sq ft home, Granite Bay
• Demo existing kitchen, remove load-bearing wall (engineer spec attached)
• New cabinetry (client selecting — allowance $42K)
• Quartz counters, tile backsplash
• Relocate gas line for range; panel upgrade likely
• Refinish hardwood in adjacent great room
• Target start: 8 weeks after permit
• Client budget mentioned: "$120–140K" — wants fixed price if possible`;

export const SAMPLE_BID_OUTPUT = `SCOPE ANALYSIS SUMMARY

Trades requiring sub quotes: demolition, structural/framing, electrical (panel + gas), plumbing, HVAC (if hood/make-up air), drywall, cabinetry install, flooring, tile, paint.

Allowances recommended:
• Cabinetry: $42,000 (client selection — confirm box count & hardware)
• Countertops: $8,500–$11,000 (quartz, ~45 sq ft)
• Tile backsplash: $2,500–$4,000

Risk flags:
• Load-bearing wall — engineer stamp + Placer County plan check (4–6 wk typical)
• Panel upgrade — utility coordination may add 2–3 weeks
• Unknown conditions behind existing kitchen walls

Suggested contingency: 10% on construction portion (exclude cabinetry allowance)

PROPOSAL NARRATIVE (DRAFT)
"We'll transform your kitchen and great room into one open, functional space — starting with safe demo and structural work per your engineer's plan, then coordinating all trades through finish. Fixed-price proposal of $138,500 covers everything listed in Scope Exhibit A except cabinetry selections above your allowance. We pull permits through Placer County and keep you updated every Friday. Next step: sign agreement and schedule pre-construction walk with our superintendent."`;
