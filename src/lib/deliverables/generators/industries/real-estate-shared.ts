import type { Company, Survey } from "@prisma/client";
import type { AssessmentFormData } from "@/types/assessment";
import { resolveScore } from "@/lib/deliverables/artifacts";

export const REAL_ESTATE_AI_SYSTEM =
  "You are writing a comprehensive AI readiness report for a real estate brokerage or team in Placer County, California (Roseville, Granite Bay, Rocklin). Be specific, practical, and ROI-focused. Reference lead response time, conversion rates, MLS workflows, and CRM automation. Use local market context where natural (median home prices $750K–$1.2M in premium Placer County neighborhoods).";

export const REAL_ESTATE_PROMPT_SYSTEM =
  "You are a Clinovyr real estate AI consultant creating a copy-paste prompt library for agents. Each prompt must use [bracket] placeholders, include usage notes, and estimate time saved. Focus on lead response, listings, CMAs, nurture, and transaction coordination.";

export const REAL_ESTATE_CRM_SYSTEM =
  "You are a Clinovyr CRM implementation specialist for real estate teams. Provide day-by-day setup steps for HubSpot, GoHighLevel, or Follow Up Boss. Include GoHighLevel screenshot descriptions (what the user should click) for key configuration steps.";

export function isRealEstateIndustry(industry: string): boolean {
  return /real\s*estate|property/i.test(industry);
}

export function companySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function getBrokerageTypeLabel(
  company: Company,
  formData: AssessmentFormData | null,
): string {
  const size = formData?.employees ?? company.size;
  if (size === "1–5") return "Solo Agent / Small Team";
  if (size === "6–20") return "Boutique Brokerage Team";
  if (size === "21–50") return "Mid-Size Brokerage";
  if (size === "51–200" || size === "200+") return "Large Brokerage / Multi-Office";
  return "Real Estate Team";
}

export type CrmPlatform = "HubSpot" | "GoHighLevel" | "Follow Up Boss";

export function recommendCrmPlatform(
  company: Company,
  formData: AssessmentFormData | null,
): CrmPlatform {
  const existing = formData?.crm?.[0];
  if (existing === "GoHighLevel") return "GoHighLevel";
  if (existing === "HubSpot") return "HubSpot";
  if (/follow\s*up\s*boss|fub/i.test(formData?.crm?.join(" ") ?? "")) {
    return "Follow Up Boss";
  }

  const size = formData?.employees ?? company.size;
  if (size === "1–5" || size === "6–20") return "HubSpot";
  if (size === "21–50") return "Follow Up Boss";
  return "GoHighLevel";
}

export function buildRealEstateContextBlock(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): string {
  const score = resolveScore(formData, survey);
  const topDrains = formData?.timeDrainsRanked?.slice(0, 5).join(", ") ?? "N/A";
  const stack = [
    formData?.crm?.length ? `CRM: ${formData.crm.join(", ")}` : null,
    formData?.emailTools?.length
      ? `Email: ${formData.emailTools.join(", ")}`
      : null,
    formData?.scheduling?.length
      ? `Scheduling: ${formData.scheduling.join(", ")}`
      : null,
    formData?.pm?.length ? `PM: ${formData.pm.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return [
    `Brokerage/Team: ${company.name}`,
    `Type: ${getBrokerageTypeLabel(company, formData)}`,
    `Industry: ${company.industry} · Team size: ${company.size}`,
    `Revenue range: ${formData?.revenue ?? company.revenue ?? "N/A"}`,
    `Readiness score: ${survey.score ?? score?.overallScore ?? "N/A"}/100 (${survey.tier ?? score?.tier ?? "N/A"})`,
    `Top time drains: ${topDrains}`,
    `Tech stack: ${stack || "Not fully documented"}`,
    `Recommended CRM: ${recommendCrmPlatform(company, formData)}`,
    `AI comfort: ${formData?.comfortLevel ?? "N/A"}/10 · AI tools used: ${formData?.aiTools ?? "N/A"}`,
    `Biggest concern: ${formData?.biggestConcern ?? "N/A"}`,
    `Goals: ${formData?.goals?.join(", ") ?? "N/A"}`,
    `Executive summary: ${survey.executiveSummary ?? "N/A"}`,
    `Top opportunities: ${Array.isArray(survey.topOpportunities) ? (survey.topOpportunities as string[]).join("; ") : "N/A"}`,
    `Estimated ROI: ${survey.estimatedROI ?? score?.estimatedAnnualROI ?? "N/A"}`,
    `Notes: ${formData?.additionalNotes ?? "None"}`,
  ].join("\n");
}

export type RealEstateFileResult = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  displayName: string;
};

/** Placer County commission insight for ROI materials */
export const PLACER_COMMISSION_INSIGHT =
  "Roseville/Granite Bay median home prices range $750K–$1.2M. At 2.5% commission, one additional close per agent generates $18,750–$30,000 in GCI — often enough to fund a full year of AI tools and automation.";

export type RealEstatePrompt = {
  title: string;
  category: string;
  prompt: string;
  usageNotes: string;
  timeSaved: string;
};

export const DEFAULT_REAL_ESTATE_PROMPTS: RealEstatePrompt[] = [
  {
    title: "MLS Listing Description",
    category: "Listings",
    prompt:
      "Write a compelling MLS listing description for a property with the following details: Address: [ADDRESS], Square footage: [SQ FT], Bedrooms: [#], Bathrooms: [#], Year built: [YEAR], Key features: [LIST FEATURES], Neighborhood highlights: [NEIGHBORHOOD DETAILS], Asking price: [PRICE]. The description should be [# OF WORDS] words, highlight the top 3 emotional selling points, and comply with Fair Housing Act language guidelines. End with a clear call to action.",
    usageNotes:
      "Paste property details from MLS draft or seller intake form. Review for Fair Housing compliance before publishing.",
    timeSaved: "20–30 min per listing",
  },
  {
    title: "Buyer Objection Response Scripts",
    category: "Lead Conversion",
    prompt:
      "I am a real estate agent and a buyer prospect said: '[EXACT OBJECTION STATEMENT]'. Buyer profile: [BUYER PROFILE]. Market conditions in [CITY/NEIGHBORHOOD]: [BRIEF MARKET SUMMARY]. Provide 3 empathetic, factual response scripts. Each should acknowledge the concern, provide a data-backed reframe, and include a soft follow-up question.",
    usageNotes:
      "Use within 5 minutes of receiving an objection via text, email, or call follow-up. Adapt tone to match your voice.",
    timeSaved: "10–15 min per objection",
  },
  {
    title: "CMA Pricing Narrative",
    category: "Listings",
    prompt:
      "Using comparable sales data, write a CMA narrative for seller client. Subject: [ADDRESS, SQ FT, BEDS, BATHS, CONDITION]. Comp 1: [DETAILS]. Comp 2: [DETAILS]. Comp 3: [DETAILS]. Active competition: [SUMMARY]. Write 3–4 paragraphs explaining pricing rationale and recommend list price range [LOW] to [HIGH] in plain language.",
    usageNotes:
      "Attach to your CMA PDF before listing appointments. Have seller read before you walk through numbers live.",
    timeSaved: "30–45 min per CMA",
  },
  {
    title: "Post-Closing Nurture Sequence",
    category: "Sphere & Referrals",
    prompt:
      "Create a 6-email post-closing nurture sequence for [CLIENT NAME] who [BOUGHT/SOLD] at [ADDRESS] on [CLOSE DATE]. Life situation: [SITUATION]. Agent: [AGENT NAME], [BROKERAGE]. Schedule: 1 week, 1 month, 3 months, 6 months, 11 months, 13 months. Each email under 150 words with one specific CTA. Avoid generic 'hope you're settling in' openers.",
    usageNotes:
      "Load into CRM automation after close. Personalize the first line with a detail from the transaction.",
    timeSaved: "2–3 hours per client lifecycle",
  },
  {
    title: "Expired Listing Prospecting Letter",
    category: "Prospecting",
    prompt:
      "Write a prospecting letter to owner of expired listing at [ADDRESS]. Listed at [ORIGINAL PRICE], on market [# DAYS]. Known issues: [PRICING / CONDITION / MARKETING / UNKNOWN]. My differentiators: [2–3 SPECIFICS]. Local stat: [RELEVANT STAT]. One page, empathetic tone, low-pressure CTA. No 'I have buyers waiting' unless true.",
    usageNotes:
      "Pair with a door knock or handwritten note for expireds in your farm area.",
    timeSaved: "20 min per letter",
  },
  {
    title: "Transaction Timeline for Clients",
    category: "Transaction Coordination",
    prompt:
      "Create a plain-language transaction timeline for [BUYER/SELLER] [CLIENT NAME] at [ADDRESS]. Dates: Offer accepted [DATE], Inspection [DATE], Appraisal [DATE], Loan [DATE], Walkthrough [DATE], Close [DATE]. For each milestone: what happens, client action, consequence if missed. Add 'Things That Could Slow This Down' with 4 common CA delays.",
    usageNotes:
      "Send at contract acceptance. Update dates if amendments change contingencies.",
    timeSaved: "45 min per transaction",
  },
  {
    title: "Monthly Market Update Newsletter",
    category: "Marketing",
    prompt:
      "Write a monthly market update for homeowners in [NEIGHBORHOOD/ZIP]. Data: Sold [#], Median price [PRICE], DOM [DAYS], List-to-sale [%], Active [#], MoM change [%]. Agent: [NAME], [BROKERAGE], DRE [LICENSE #]. 300–400 words: intro, data summary, 'What This Means for You', soft valuation CTA. Informative, not salesy.",
    usageNotes:
      "Send to sphere and past clients on the 1st of each month. Pull stats from MLS or Redfin Data Center.",
    timeSaved: "1–2 hours per newsletter",
  },
  {
    title: "Pre-Listing Appointment Strategy",
    category: "Listings",
    prompt:
      "Prepare pre-listing strategy for [ADDRESS]. Seller situation: [SITUATION]. Their price expectation: [PRICE]. My CMA range: [LOW]–[HIGH]. Gap: [$ / %]. Provide: (1) validation script, (2) three market data points supporting my range, (3) two discovery questions, (4) fallback if they insist on higher price with price-reduction plan language.",
    usageNotes:
      "Review in the car before every listing appointment. Role-play the validation script once.",
    timeSaved: "30 min prep per appointment",
  },
  {
    title: "Investor Cash Flow Summary",
    category: "Investor Clients",
    prompt:
      "Plain-language cash flow analysis for [PROPERTY TYPE] at [ADDRESS]. Purchase [PRICE], Down [%], Rate [%], Term [YEARS]. Rent [$], Expenses [TAXES, INSURANCE, HOA, PM, MAINT, VACANCY]. Calculate monthly/annual cash flow, GRM, cap rate, cash-on-cash. Table + 2 paragraphs on whether deal pencils and price needed for [TARGET]% CoC. Note: illustration only, not tax advice.",
    usageNotes:
      "Attach to investor buyer consults. Have client verify numbers with their CPA.",
    timeSaved: "45–60 min per analysis",
  },
  {
    title: "Google Review Responses",
    category: "Reputation",
    prompt:
      "Write professional Google Business Profile responses for [AGENT NAME], [BROKERAGE], DRE [LICENSE #]. Under 75 words each, address specific review content, sound human. Reviews: (1) [5-STAR TEXT], (2) [4-STAR TEXT], (3) [3-STAR TEXT], (4) [NEGATIVE TEXT — context: [CONTEXT]]. Negative response: de-escalating, invite offline resolution.",
    usageNotes:
      "Respond within 24 hours. Never confirm client relationships or transaction details without consent.",
    timeSaved: "15 min per batch",
  },
  {
    title: "Instant Lead Qualifier Reply",
    category: "Lead Response",
    prompt:
      "A new lead just inquired via [ZILLOW / REALTOR.COM / WEBSITE FORM]. Lead message: '[MESSAGE]'. Property interest: [ADDRESS OR AREA], Timeline: [IF KNOWN], Budget: [IF KNOWN]. Write an SMS under 160 characters and an email under 100 words that: (1) responds within brand voice, (2) asks 3 qualifying questions (timeline, pre-approval, motivation), (3) offers a specific next step (call slot or showing).",
    usageNotes:
      "Use as first-touch template in Make.com or CRM auto-reply. Personalize property reference before sending.",
    timeSaved: "5–10 min per lead",
  },
  {
    title: "Open House Follow-Up",
    category: "Lead Conversion",
    prompt:
      "Write follow-up messages for open house attendees at [ADDRESS] on [DATE]. Attendee: [NAME], Notes from sign-in: [INTEREST / TIMELINE / COMMENTS]. Create: (1) same-day text, (2) next-day email with listing highlights, (3) day-3 check-in if no response. Reference something specific from our conversation at the open house.",
    usageNotes:
      "Send same-day text before 6pm. Log all touches in CRM with tags for hot/warm/cold.",
    timeSaved: "15 min per attendee batch",
  },
  {
    title: "Showing Feedback Request",
    category: "Buyer Representation",
    prompt:
      "Draft a showing feedback request for buyer [CLIENT NAME] after viewing [ADDRESS] today. Property highlights: [KEY FEATURES]. Ask 4 specific questions: overall impression, deal-breakers, comparison to [OTHER PROPERTY VIEWED], readiness to offer. Tone: consultative, not pushy. Include option to schedule second showing or pass.",
    usageNotes:
      "Send within 2 hours of showing while impressions are fresh. Use feedback to refine search criteria.",
    timeSaved: "10 min per showing",
  },
  {
    title: "Sphere of Influence Check-In",
    category: "Sphere & Referrals",
    prompt:
      "Write a personalized check-in message to [CONTACT NAME] in my sphere. Last interaction: [DATE / CONTEXT]. Personal detail I know: [DETAIL]. Local hook: [RECENT MARKET STAT OR NEIGHBORHOOD NEWS]. Under 80 words, no hard sell — one soft offer (market snapshot, home valuation, or coffee). Sign as [AGENT NAME].",
    usageNotes:
      "Send 5–10 per week to stay top-of-mind. Track in CRM with 'sphere touch' tag.",
    timeSaved: "5 min per contact",
  },
  {
    title: "Listing Appointment Prep Checklist",
    category: "Listings",
    prompt:
      "Generate a listing appointment prep checklist for [ADDRESS]. Seller motivation: [REASON FOR SELLING]. Competition nearby: [ACTIVE LISTINGS]. My marketing plan highlights: [PHOTO / STAGING / DIGITAL / OPEN HOUSE STRATEGY]. Output: (1) 10 questions to ask sellers, (2) 5 objections to anticipate with responses, (3) documents to bring, (4) follow-up email draft if they need time to decide.",
    usageNotes:
      "Print and bring to every listing presentation. Check off questions during the meeting.",
    timeSaved: "25 min prep per appointment",
  },
];
