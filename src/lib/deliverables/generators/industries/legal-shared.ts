import type { Company, Survey } from "@prisma/client";
import type { AssessmentFormData } from "@/types/assessment";
import { resolveScore } from "@/lib/deliverables/artifacts";

export const LEGAL_AI_SYSTEM =
  "You are writing a comprehensive AI readiness report for a law firm or registered investment adviser (RIA) in California. Be specific, practical, and compliance-aware. Reference ABA Formal Opinions, California State Bar ethics guidance, and SEC recordkeeping rules where relevant for RIAs. Always recommend attorney oversight of AI outputs and consulting ethics counsel before deployment.";

export const LEGAL_PROMPT_SYSTEM =
  "You are a Clinovyr legal AI consultant creating an attorney-tested prompt library. Each prompt must use [bracket] placeholders, include a concise ethicsNote (ABA/State Bar aligned), usage notes, and time saved. Never suggest bypassing attorney review of work product or putting privileged client data into non-compliant tools.";

export const LEGAL_INTAKE_SYSTEM =
  "You are a Clinovyr legal operations consultant writing a client intake automation setup guide for law firms using Clio. Provide step-by-step instructions for Typeform/JotForm + Zapier + Claude (Option A) or Clio Grow + Claude (Option B). Include a specific matter summarization prompt attorneys can paste into Claude.";

export const LEGAL_COMPLIANCE_SYSTEM =
  "You are a Clinovyr legal compliance consultant creating a pre-deployment AI checklist for law firms and RIAs. Output yes/no checklist items covering privacy, confidentiality, attorney oversight, vendor agreements, disclosure, and malpractice risk. If RIA context applies, add SEC recordkeeping and client disclosure items.";

export function isLegalIndustry(industry: string): boolean {
  return /legal|law|financial|ria|attorney|lawyer/i.test(industry);
}

export function isRiaContext(company: Company, formData: AssessmentFormData | null): boolean {
  const industry = formData?.industry ?? company.industry;
  return /ria|registered investment|investment adviser|financial|wealth|advisory|fiduciary/i.test(
    industry,
  );
}

export function getFirmTypeLabel(
  company: Company,
  formData: AssessmentFormData | null,
): string {
  if (isRiaContext(company, formData)) return "Registered Investment Adviser (RIA)";
  const industry = formData?.industry ?? company.industry;
  if (/solo|1–5/i.test(company.size)) return "Solo / Small Law Practice";
  if (/litigation/i.test(industry)) return "Litigation Firm";
  if (/corporate|business/i.test(industry)) return "Business Law Firm";
  if (/family|estate/i.test(industry)) return "Estate & Family Law Firm";
  if (/legal/i.test(industry)) return "Law Firm";
  return "Legal Practice";
}

export function companySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function defaultBillableRate(formData: AssessmentFormData | null): number {
  const revenue = formData?.revenue ?? "";
  if (/500|750|1M/i.test(revenue)) return 550;
  if (/250|300|400/i.test(revenue)) return 425;
  if (/100|150|200/i.test(revenue)) return 350;
  return 400;
}

export function estimateNonBillableHours(formData: AssessmentFormData | null): number {
  const drains = formData?.timeDrainsRanked ?? [];
  const intake = drains.some((d) => /intake|onboard|new client/i.test(d)) ? 3 : 1.5;
  const status = drains.some((d) => /status|update|follow.?up/i.test(d)) ? 2.5 : 1;
  const billing = drains.some((d) => /billing|time entry|invoice/i.test(d)) ? 2 : 1;
  const admin = drains.some((d) => /admin|scheduling|calendar/i.test(d)) ? 2 : 1;
  return Math.round((intake + status + billing + admin) * 10) / 10;
}

export function buildLegalContextBlock(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): string {
  const score = resolveScore(formData, survey);
  const topDrains = formData?.timeDrainsRanked?.slice(0, 5).join(", ") ?? "N/A";
  const stack = [
    formData?.crm?.length ? `Practice mgmt: ${formData.crm.join(", ")}` : null,
    formData?.emailTools?.length
      ? `Email: ${formData.emailTools.join(", ")}`
      : null,
    formData?.pm?.length ? `PM: ${formData.pm.join(", ")}` : null,
    formData?.accounting?.length
      ? `Accounting: ${formData.accounting.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return [
    `Firm: ${company.name}`,
    `Type: ${getFirmTypeLabel(company, formData)}`,
    `Industry: ${company.industry} · Team size: ${company.size}`,
    `RIA context: ${isRiaContext(company, formData) ? "Yes" : "No"}`,
    `Revenue range: ${formData?.revenue ?? company.revenue ?? "N/A"}`,
    `Estimated billable rate: $${defaultBillableRate(formData)}/hr`,
    `Non-billable admin hours/week (est.): ${estimateNonBillableHours(formData)}`,
    `Readiness score: ${survey.score ?? score?.overallScore ?? "N/A"}/100 (${survey.tier ?? score?.tier ?? "N/A"})`,
    `Top time drains: ${topDrains}`,
    `Tech stack: ${stack || "Not fully documented"}`,
    `AI comfort: ${formData?.comfortLevel ?? "N/A"}/10 · AI tools used: ${formData?.aiTools ?? "N/A"}`,
    `Biggest concern: ${formData?.biggestConcern ?? "N/A"}`,
    `Goals: ${formData?.goals?.join(", ") ?? "N/A"}`,
    `Executive summary: ${survey.executiveSummary ?? "N/A"}`,
    `Top opportunities: ${Array.isArray(survey.topOpportunities) ? (survey.topOpportunities as string[]).join("; ") : "N/A"}`,
    `Estimated ROI: ${survey.estimatedROI ?? score?.estimatedAnnualROI ?? "N/A"}`,
    `Notes: ${formData?.additionalNotes ?? "None"}`,
  ].join("\n");
}

export type LegalFileResult = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  displayName: string;
};

export const BILLING_HOURS_INSIGHT =
  "At $300–$600/hr billable rates, every hour of non-billable admin (intake, status updates, billing entries) represents $15,600–$31,200 in annual lost revenue per attorney at just one hour per week — before counting opportunity cost of delayed client work.";

export type LegalPrompt = {
  title: string;
  category: string;
  prompt: string;
  ethicsNote: string;
  usageNotes: string;
  timeSaved: string;
};

export const MATTER_SUMMARIZATION_PROMPT = `You are a legal intake assistant for [FIRM NAME]. Summarize the following new client intake submission for attorney review. Do NOT provide legal advice. Do NOT invent facts.

Client name: [CLIENT NAME]
Matter type: [PRACTICE AREA]
Intake responses:
[PASTE FORM RESPONSES]

Output format:
1. **Conflict check flags** — parties, adverse interests, prior representation concerns
2. **Matter summary** — 3–5 sentences, neutral tone, facts only from intake
3. **Urgency assessment** — Low / Medium / High with one-sentence rationale
4. **Suggested routing** — which attorney or practice group based on [ROUTING RULES]
5. **Missing information** — list documents or facts needed before consultation
6. **Next steps** — recommended intake follow-up (no legal conclusions)

Attorney must review and approve before any client communication.`;

export const DEFAULT_LEGAL_PROMPTS: LegalPrompt[] = [
  {
    title: "New Client Intake Summary",
    category: "Intake",
    prompt:
      "Summarize this new client intake for attorney review. Client: [NAME]. Matter: [TYPE]. Responses: [PASTE]. Output: conflict flags, 4-sentence neutral summary, urgency (L/M/H), missing info list, suggested next steps. Do not provide legal advice or conclusions.",
    ethicsNote:
      "⚖️ ETHICS NOTE: Intake summaries are work product for attorney review only. Verify conflict check independently in your practice management system before accepting engagement.",
    usageNotes:
      "Run after form submission via Zapier/Claude. Attorney approves before scheduling consultation.",
    timeSaved: "20–30 min per intake",
  },
  {
    title: "Engagement Letter First Draft",
    category: "Document Drafting",
    prompt:
      "Draft an engagement letter outline for [FIRM NAME] representing [CLIENT NAME] in [MATTER TYPE]. Scope: [SCOPE]. Fee structure: [HOURLY/FLAT/CONTingency]. Include: parties, scope limitations, fee terms, termination, conflicts disclosure placeholder, and signature block. Use neutral professional tone. Flag sections requiring partner review.",
    ethicsNote:
      "⚖️ ETHICS NOTE: ABA Model Rule 1.5 — fee arrangements must be communicated in writing. Partner must review and customize before sending; AI draft is not final work product.",
    usageNotes:
      "Use firm template as system context. Replace all bracket fields; never send without partner sign-off.",
    timeSaved: "45–60 min per letter",
  },
  {
    title: "Demand Letter First Draft",
    category: "Document Drafting",
    prompt:
      "Draft a demand letter from [ATTORNEY NAME] at [FIRM] to [RECIPIENT] regarding [DISPUTE SUMMARY]. Key facts: [FACTS]. Damages sought: [AMOUNT/RELIEF]. Tone: firm but professional. Include: factual background, legal basis placeholder [STATUTE/CASE], demand, deadline [DATE], reservation of rights. Mark [ATTORNEY REVIEW REQUIRED] on every legal conclusion.",
    ethicsNote:
      "⚖️ ETHICS NOTE: Verify all facts and legal citations independently. Misstatements in demand letters can create malpractice exposure and sanctions risk.",
    usageNotes:
      "Attorney must verify facts against client file and research before sending.",
    timeSaved: "1–2 hours per draft",
  },
  {
    title: "Time Entry Narrative from Notes",
    category: "Billing",
    prompt:
      "Convert these rough activity notes into billable time entry narratives for Clio/PracticePanther. Date: [DATE]. Attorney: [NAME]. Notes: [RAW NOTES]. Output: separate entries with duration suggestions, UTBMS-style task codes if applicable, professional third-person narratives. Flag any entry that may be non-billable.",
    ethicsNote:
      "⚖️ ETHICS NOTE: Model Rule 1.5 — fees must be reasonable. Do not inflate time; attorney certifies accuracy of all billing entries.",
    usageNotes:
      "Paste end-of-day notes. Review durations and merge duplicate entries before posting.",
    timeSaved: "15–20 min daily",
  },
  {
    title: "Client Status Update Email",
    category: "Client Communications",
    prompt:
      "Draft a client status update email for [CLIENT NAME] regarding [MATTER NAME]. Recent activity: [ACTIVITY]. Next steps: [STEPS]. Expected timeline: [TIMELINE]. Tone: reassuring, plain language, no legal advice. Under 200 words. Include call-to-action if client action needed.",
    ethicsNote:
      "⚖️ ETHICS NOTE: Model Rule 1.4 — communicate material developments. Attorney must review for accuracy and privilege before sending; do not disclose strategy client should not see.",
    usageNotes:
      "Send weekly on active matters. Log in practice management system.",
    timeSaved: "10–15 min per update",
  },
  {
    title: "Legal Research Summarization",
    category: "Research",
    prompt:
      "Summarize the following legal research for internal attorney memo. Jurisdiction: [STATE/FEDERAL]. Issue: [LEGAL ISSUE]. Sources: [PASTE CASE STATUTES OR WESTLAW EXCERPTS]. Output: issue statement, rule summary with citations, application to [CLIENT FACTS], open questions. Label as DRAFT — NOT LEGAL ADVICE.",
    ethicsNote:
      "⚖️ ETHICS NOTE: Model Rule 1.1 — competence requires verifying AI summaries against primary sources. Never cite a case without reading it.",
    usageNotes:
      "Use for internal drafting only. Shepardize/KeyCite all citations before relying.",
    timeSaved: "30–45 min per research issue",
  },
  {
    title: "Deposition Outline Generator",
    category: "Litigation",
    prompt:
      "Create a deposition outline for deposing [WITNESS NAME] in [CASE NAME]. Known facts: [FACTS]. Objectives: [OBJECTIVES]. Output: background questions, topic sections, exhibit references [EXHIBITS], impeachment areas flagged for attorney prep. Do not assume facts not provided.",
    ethicsNote:
      "⚖️ ETHICS NOTE: Model Rule 3.4 — preparation must be truthful. Attorney must review for propriety; avoid harassing or irrelevant question lines.",
    usageNotes:
      "Prep tool only. Customize based on discovery responses and case strategy.",
    timeSaved: "1–2 hours prep time",
  },
  {
    title: "Discovery Request First Draft",
    category: "Litigation",
    prompt:
      "Draft interrogatories and document requests for [PLAINTIFF/DEFENDANT] in [CASE]. Claims/defenses: [SUMMARY]. Output: 15 interrogatories and 10 document requests tailored to [ISSUES]. Number sequentially. Include definitions and instructions section placeholder.",
    ethicsNote:
      "⚖️ ETHICS NOTE: Model Rules 3.4 and 1.3 — discovery must be proportional and good-faith. Review for overbreadth before serving.",
    usageNotes:
      "Starting point for associate draft. Partner reviews for scope and strategy fit.",
    timeSaved: "2–3 hours per set",
  },
  {
    title: "Meeting Memo from Transcript",
    category: "Client Communications",
    prompt:
      "Convert this client meeting notes/transcript into an internal memo. Client: [NAME]. Date: [DATE]. Attendees: [LIST]. Transcript: [PASTE]. Output: key facts learned, client goals, action items with owners, follow-up deadlines, conflicts or risks flagged.",
    ethicsNote:
      "⚖️ ETHICS NOTE: Preserve attorney-client privilege — store memo in matter file only. Redact before any AI tool if vendor lacks appropriate confidentiality terms.",
    usageNotes:
      "Run within firm-approved AI environment with BAA/confidentiality agreement.",
    timeSaved: "20–30 min per meeting",
  },
  {
    title: "Contract Clause Plain-English Summary",
    category: "Business Law",
    prompt:
      "Summarize these contract clauses in plain English for client explanation. Contract type: [TYPE]. Clauses: [PASTE]. Output: table with Clause | Plain English | Client Impact (Low/Med/High) | Questions for counterparty. Do not recommend accept/reject — facts only.",
    ethicsNote:
      "⚖️ ETHICS NOTE: Model Rule 2.1 — advisor role requires attorney judgment on recommendations. Summary is educational; attorney provides advice separately.",
    usageNotes:
      "Use in client meetings to accelerate review. Attach to formal legal opinion separately.",
    timeSaved: "30–45 min per contract review",
  },
  {
    title: "Estate Plan Client Questionnaire Follow-Up",
    category: "Estate Planning",
    prompt:
      "Based on this estate planning intake for [CLIENT NAME], generate a follow-up question list. Provided: [ASSETS, BENEFICIARIES, GOALS]. Output: missing asset documentation, beneficiary conflict flags, tax planning topics for attorney discussion, suggested trust/will structures for partner review only.",
    ethicsNote:
      "⚖️ ETHICS NOTE: Estate planning requires individualized advice. AI output is intake prep only — never document delivery without licensed attorney review.",
    usageNotes:
      "Send follow-up questionnaire to client after initial intake call.",
    timeSaved: "25–35 min per estate intake",
  },
  {
    title: "Opposing Counsel Correspondence Draft",
    category: "Litigation",
    prompt:
      "Draft a professional letter to opposing counsel [OC NAME] regarding [SUBJECT]. Our position: [POSITION]. Request: [REQUEST]. Tone: collegial but firm. Include citation placeholders [CASE/STATUTE]. Under 300 words.",
    ethicsNote:
      "⚖️ ETHICS NOTE: Model Rule 4.1 — truthfulness in statements to others. Attorney must verify all factual assertions before sending.",
    usageNotes:
      "Review tone and strategy with lead attorney on contested matters.",
    timeSaved: "15–20 min per letter",
  },
  {
    title: "Matter Close-Out Checklist",
    category: "Operations",
    prompt:
      "Generate a matter close-out checklist for [MATTER NAME], type [PRACTICE AREA], status [CLOSED/SETTLED]. Include: final billing, trust reconciliation, file retention per [CA RULES], client closing letter draft, referral request, destruction schedule for confidential docs.",
    ethicsNote:
      "⚖️ ETHICS NOTE: California State Bar retention rules require minimum 5-year retention for client files. Verify trust accounting with compliance officer.",
    usageNotes:
      "Run at matter closure. Paralegal executes; attorney signs off on trust and billing.",
    timeSaved: "30 min per matter",
  },
  {
    title: "Conflict Check Pre-Screen",
    category: "Intake",
    prompt:
      "Pre-screen this potential client for conflict issues before formal check. Parties: [PARTIES]. Adverse parties: [ADVERSARIES]. Related entities: [ENTITIES]. Prior matters mentioned: [PRIOR]. Output: red flags, questions for conflicts database search, suggested waiver scenarios if any.",
    ethicsNote:
      "⚖️ ETHICS NOTE: Model Rule 1.7 — this is a screening aid only. Formal conflict check in Clio/PracticePanther is mandatory before engagement.",
    usageNotes:
      "Use before scheduling consultation. Never rely solely on AI for conflict clearance.",
    timeSaved: "10 min per lead",
  },
  {
    title: "Client FAQ Response Draft",
    category: "Client Communications",
    prompt:
      "Draft a response to this client question: '[CLIENT QUESTION]'. Matter context: [CONTEXT]. Provide plain-language explanation without creating new legal advice beyond existing engagement scope. If question exceeds scope, draft referral to consultation. Under 150 words.",
    ethicsNote:
      "⚖️ ETHICS NOTE: Model Rule 1.4 — respond promptly but accurately. Escalate novel legal questions to attorney; do not let staff or AI answer beyond scope.",
    usageNotes:
      "Attorney reviews all substantive legal questions before send.",
    timeSaved: "10 min per inquiry",
  },
  {
    title: "Trial Exhibit List Organizer",
    category: "Litigation",
    prompt:
      "Organize this exhibit list for trial. Case: [CASE]. Exhibits: [LIST WITH DESCRIPTIONS]. Output: numbered list grouped by theme, foundation witness suggested, authentication notes, objections anticipated. Format suitable for trial binder index.",
    ethicsNote:
      "⚖️ ETHICS NOTE: Model Rule 3.4 — ensure exhibit list matches actual evidence. Attorney verifies foundation and admissibility.",
    usageNotes:
      "Update as discovery progresses. Sync with trial tech and paralegal binder prep.",
    timeSaved: "45–60 min per trial prep",
  },
  {
    title: "Retainer Replenishment Notice",
    category: "Billing",
    prompt:
      "Draft a retainer replenishment notice for client [NAME], matter [MATTER]. Current trust balance: [AMOUNT]. Recommended replenishment: [AMOUNT]. Work anticipated: [DESCRIPTION]. Professional tone, explain trust accounting briefly, include remittance instructions placeholder.",
    ethicsNote:
      "⚖️ ETHICS NOTE: Model Rule 1.15 — trust account communications must be accurate. Verify balances in trust ledger before sending.",
    usageNotes:
      "Trigger when trust falls below threshold in Clio. Accounting reviews before send.",
    timeSaved: "10 min per notice",
  },
  {
    title: "Regulatory Filing Summary (RIA)",
    category: "RIA / Compliance",
    prompt:
      "Summarize requirements for [FILING TYPE — e.g., Form ADV amendment, Form CRS update] for RIA [FIRM NAME]. AUM: [AUM]. Changes: [DESCRIBE CHANGES]. Output: deadline, required sections, disclosure implications, client notification requirements. Label: compliance officer review required.",
    ethicsNote:
      "⚖️ ETHICS NOTE: SEC Marketing Rule and Form ADV require accuracy. CC compliance officer; AI summary is not a filing.",
    usageNotes:
      "For RIAs only. Compliance officer verifies against current SEC/FINRA guidance.",
    timeSaved: "1–2 hours per filing prep",
  },
  {
    title: "Client Portfolio Review Letter (RIA)",
    category: "RIA / Client Communications",
    prompt:
      "Draft a quarterly client review letter for RIA client [NAME]. Portfolio summary: [PERFORMANCE SUMMARY]. Allocation: [ALLOCATION]. Market context: [BRIEF CONTEXT]. Include required disclosures placeholder [DISCLOSURES]. No performance guarantees. Under 400 words.",
    ethicsNote:
      "⚖️ ETHICS NOTE: SEC Marketing Rule prohibits misleading performance claims. Compliance must approve all client-facing investment communications.",
    usageNotes:
      "Quarterly touchpoint template. Attach required disclosures and performance methodology.",
    timeSaved: "30–45 min per client",
  },
  {
    title: "Paralegal Task Delegation Brief",
    category: "Operations",
    prompt:
      "Create a delegation brief for paralegal on matter [MATTER]. Task: [TASK — e.g., assemble production set, draft subpoena]. Deadline: [DATE]. Background: [SUMMARY]. Deliverables: [LIST]. Quality checks: [CHECKLIST]. Flag items requiring attorney approval before execution.",
    ethicsNote:
      "⚖️ ETHICS NOTE: Model Rule 5.3 — attorney must supervise nonlawyer assistants. AI brief does not substitute for attorney direction and review.",
    usageNotes:
      "Assign in Clio tasks. Attorney reviews output before filing or client delivery.",
    timeSaved: "15 min per delegation",
  },
];

export const DEFAULT_COMPLIANCE_ITEMS = {
  lawFirm: [
    {
      item: "We have identified all data flows where client information (including PII and privileged material) could enter an AI system",
      topic: "Privacy & Confidentiality",
    },
    {
      item: "Our AI vendor agreements include confidentiality terms, data retention limits, and prohibition on training on our client data",
      topic: "Vendor Agreements",
    },
    {
      item: "We have a written policy requiring licensed attorney review of all AI-generated work product before client delivery or court filing",
      topic: "Attorney Oversight",
    },
    {
      item: "We have run a conflicts check process that is independent of any AI pre-screening tool",
      topic: "Conflicts",
    },
    {
      item: "Staff have been trained on which tools may NOT receive client names, matter details, or privileged content",
      topic: "Confidentiality Training",
    },
    {
      item: "We have documented our AI use in client engagement letters or separate technology disclosures where appropriate",
      topic: "Client Disclosure",
    },
    {
      item: "We have consulted (or scheduled consultation with) ethics counsel on AI deployment in our practice areas",
      topic: "Ethics Counsel",
    },
    {
      item: "Our malpractice carrier has been notified or we have confirmed coverage for AI-assisted workflows",
      topic: "Malpractice Insurance",
    },
    {
      item: "We maintain audit logs of AI prompts and outputs for matters where work product is generated",
      topic: "Recordkeeping",
    },
    {
      item: "We have a process to verify AI-generated citations against primary legal sources before reliance",
      topic: "Competence (Rule 1.1)",
    },
    {
      item: "Billing policies clarify whether AI-assisted time is billable and how it is described on invoices",
      topic: "Billing Ethics",
    },
    {
      item: "We have an incident response plan if client data is inadvertently submitted to a non-approved AI tool",
      topic: "Breach Response",
    },
  ],
  ria: [
    {
      item: "We have mapped AI tools against SEC recordkeeping requirements (Rule 204-2) and retention schedules",
      topic: "SEC Recordkeeping",
    },
    {
      item: "Marketing and client communications generated with AI are reviewed by compliance before distribution",
      topic: "SEC Marketing Rule",
    },
    {
      item: "Form ADV and Form CRS disclosures address our use of technology and AI in advisory services",
      topic: "Client Disclosure",
    },
    {
      item: "We have identified all data flows where client financial information could enter an AI system",
      topic: "Privacy & Confidentiality",
    },
    {
      item: "Vendor agreements prohibit AI providers from training on client portfolio or personal data",
      topic: "Vendor Agreements",
    },
    {
      item: "Licensed principals review all AI-generated investment analysis before client delivery",
      topic: "Supervisory Review",
    },
    {
      item: "Staff are trained on prohibited uses of AI with MNPI and client account information",
      topic: "Confidentiality Training",
    },
    {
      item: "We maintain books and records of AI-assisted communications per SEC requirements",
      topic: "Books & Records",
    },
    {
      item: "Our compliance manual has been updated to address AI tools in advisory workflows",
      topic: "Compliance Program",
    },
    {
      item: "We have documented how AI outputs are validated before investment recommendations",
      topic: "Fiduciary Duty",
    },
    {
      item: "Cybersecurity policies address AI tool access and API key management",
      topic: "Cybersecurity",
    },
    {
      item: "We have an incident response plan for inadvertent disclosure of client financial data to AI tools",
      topic: "Breach Response",
    },
  ],
};
