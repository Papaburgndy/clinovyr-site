import type { Company, Survey } from "@prisma/client";
import type { AssessmentFormData } from "@/types/assessment";
import { resolveScore } from "@/lib/deliverables/artifacts";

export const WELLNESS_AI_SYSTEM =
  "You are writing a comprehensive AI readiness report for a wellness, med spa, or aesthetic business in Placer County, California (Roseville, Granite Bay, Rocklin). Use an aspirational wellness brand tone — sophisticated, warm, and results-focused. Be specific about client retention economics, rebooking automation, and booking platform integrations. Always include FTC compliance guidance on health and beauty claims.";

export const WELLNESS_SOCIAL_SYSTEM =
  "You are a Clinovyr wellness marketing consultant creating a 30-day social content calendar for a med spa or wellness studio. Personalize posts to the business's services from survey data. Each post needs: caption under 125 words, exactly 15 hashtags, and a clear image concept for a VA or owner to execute. Mix educational, promotional, staff/brand, and engagement content.";

export const WELLNESS_RETENTION_SYSTEM =
  "You are a Clinovyr client retention strategist writing a comprehensive playbook for wellness and med spa businesses. Focus on lifecycle stages, automated touchpoints, VIP programs, win-back campaigns, staff training, and retention metrics. Tone: aspirational but operational — owners should be able to implement immediately.";

export const WELLNESS_RETENTION_INSIGHT =
  "Industry benchmark: acquiring a new med spa client costs 5× more than retaining an existing one. A 10% improvement in rebooking rate on 200 active clients at $250 average treatment value generates $50,000 in additional annual revenue — often without increasing ad spend.";

export function isWellnessIndustry(industry: string): boolean {
  return /wellness|med\s*spa|spa|aesthetic|beauty/i.test(industry);
}

export function companySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function getWellnessTypeLabel(
  company: Company,
  formData: AssessmentFormData | null,
): string {
  const industry = formData?.industry ?? company.industry;
  if (/med\s*spa|aesthetic/i.test(industry)) return "Med Spa & Aesthetics";
  if (/beauty/i.test(industry)) return "Beauty & Skincare Studio";
  if (/wellness/i.test(industry)) return "Wellness Center";
  return "Spa & Wellness Business";
}

export type BookingPlatform = "Mindbody" | "Jane App" | "Vagaro";

export function recommendBookingPlatform(
  company: Company,
  formData: AssessmentFormData | null,
): BookingPlatform {
  const scheduling = formData?.scheduling?.join(" ") ?? "";
  if (/mindbody/i.test(scheduling)) return "Mindbody";
  if (/jane/i.test(scheduling)) return "Jane App";
  if (/vagaro/i.test(scheduling)) return "Vagaro";

  const size = formData?.employees ?? company.size;
  if (size === "1–5" || size === "6–20") return "Jane App";
  return "Mindbody";
}

export function buildWellnessContextBlock(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): string {
  const score = resolveScore(formData, survey);
  const topDrains = formData?.timeDrainsRanked?.slice(0, 5).join(", ") ?? "N/A";
  const stack = [
    formData?.scheduling?.length
      ? `Booking: ${formData.scheduling.join(", ")}`
      : null,
    formData?.crm?.length ? `CRM: ${formData.crm.join(", ")}` : null,
    formData?.emailTools?.length
      ? `Email: ${formData.emailTools.join(", ")}`
      : null,
    formData?.accounting?.length
      ? `Accounting: ${formData.accounting.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return [
    `Business: ${company.name}`,
    `Type: ${getWellnessTypeLabel(company, formData)}`,
    `Industry: ${company.industry} · Team size: ${company.size}`,
    `Revenue range: ${formData?.revenue ?? company.revenue ?? "N/A"}`,
    `Readiness score: ${survey.score ?? score?.overallScore ?? "N/A"}/100 (${survey.tier ?? score?.tier ?? "N/A"})`,
    `Top time drains: ${topDrains}`,
    `Tech stack: ${stack || "Not fully documented"}`,
    `Recommended booking platform: ${recommendBookingPlatform(company, formData)}`,
    `AI comfort: ${formData?.comfortLevel ?? "N/A"}/10 · AI tools used: ${formData?.aiTools ?? "N/A"}`,
    `Biggest concern: ${formData?.biggestConcern ?? "N/A"}`,
    `Goals: ${formData?.goals?.join(", ") ?? "N/A"}`,
    `Executive summary: ${survey.executiveSummary ?? "N/A"}`,
    `Top opportunities: ${Array.isArray(survey.topOpportunities) ? (survey.topOpportunities as string[]).join("; ") : "N/A"}`,
    `Estimated ROI: ${survey.estimatedROI ?? score?.estimatedAnnualROI ?? "N/A"}`,
    `Notes: ${formData?.additionalNotes ?? "None"}`,
  ].join("\n");
}

export type WellnessFileResult = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  displayName: string;
};

export type WellnessSocialPost = {
  day: number;
  week: number;
  type: "educational" | "promotional" | "staff-brand" | "engagement";
  caption: string;
  hashtags: string[];
  imageConcept: string;
};

export type WellnessUseCase = {
  rank: number;
  name: string;
  description: string;
  tools: string;
  roiNote: string;
};

export function defaultActiveClients(employees: string | undefined): number {
  if (employees === "1–5") return 120;
  if (employees === "6–20") return 200;
  if (employees === "21–50") return 450;
  return 800;
}

export function defaultAvgTreatmentValue(employees: string | undefined): number {
  if (employees === "1–5") return 185;
  if (employees === "6–20") return 250;
  if (employees === "21–50") return 320;
  return 275;
}

export function defaultRebookingRate(): number {
  return 0.42;
}

export function defaultVisitsPerYear(): number {
  return 3.2;
}

export function buildDefaultSocialPosts(
  company: Company,
  formData: AssessmentFormData | null,
): WellnessSocialPost[] {
  const biz = company.name;
  const services =
    formData?.goals?.slice(0, 3).join(", ") ??
    "HydraFacial, injectables, laser treatments, body contouring";

  const weekTemplates: Array<{
    type: WellnessSocialPost["type"];
    captionTemplate: string;
    imageConcept: string;
    hashtags: string[];
  }> = [
    {
      type: "educational",
      captionTemplate: `Your skin barrier does more work than any serum. At ${biz}, we see clients who over-exfoliate without realizing it — leading to redness and breakouts. A simple fix: alternate active nights with recovery nights, and always finish with SPF 30+ every morning. Book a complimentary skin consult to build a routine that actually fits your lifestyle.`,
      imageConcept: "Clean flat-lay: SPF, gentle cleanser, hydration serum on cream linen",
      hashtags: [
        "#SkinBarrier",
        "#MedSpaTips",
        "#GraniteBay",
        "#RosevilleCA",
        "#SkincareRoutine",
        "#HealthySkin",
        "#AestheticWellness",
        "#SunProtection",
        "#GlowUp",
        "#SelfCareSunday",
        "#WellnessJourney",
        "#BeautyEducation",
        "#PlacerCounty",
        "#SkinHealth",
        "#ClinovyrPartner",
      ],
    },
    {
      type: "promotional",
      captionTemplate: `Limited spots this month for our signature treatment series at ${biz}. Clients who complete a 3-session plan typically see smoother texture and more even tone within 6 weeks. Mention this post when booking for priority scheduling. Link in bio — we respond to DMs within one business day.`,
      imageConcept: "Before/after-style treatment room with soft teal accent lighting",
      hashtags: [
        "#MedSpaSpecial",
        "#BookNow",
        "#RosevilleMedSpa",
        "#GraniteBayBeauty",
        "#TreatmentSeries",
        "#SkinGoals",
        "#AestheticTreatments",
        "#SelfInvestment",
        "#LocalBusiness",
        "#WellnessOffer",
        "#GlowSeason",
        "#BeautyDeals",
        "#RocklinCA",
        "#SpaDay",
        "#PriorityBooking",
      ],
    },
    {
      type: "staff-brand",
      captionTemplate: `Meet the team behind your glow-up. Our providers at ${biz} combine clinical training with a hospitality-first approach — because results matter, but so does how you feel in the chair. Every recommendation is personalized; we never push treatments you don't need. That's the ${biz} difference.`,
      imageConcept: "Provider portrait in treatment room, warm smile, branded scrubs",
      hashtags: [
        "#MeetTheTeam",
        "#MedSpaLife",
        "#ProviderSpotlight",
        "#GraniteBay",
        "#TrustedCare",
        "#AestheticExpert",
        "#ClientFirst",
        "#WellnessTeam",
        "#BehindTheGlow",
        "#RosevilleBusiness",
        "#BeautyPros",
        "#SpaStaff",
        "#PersonalizedCare",
        "#LocalExperts",
        "#OurStory",
      ],
    },
    {
      type: "engagement",
      captionTemplate: `Quick poll for our ${biz} community: What's your #1 skin goal right now? A) Clearer complexion B) Smoother texture C) Brighter tone D) Preventative aging. Drop your letter below — we'll reply with one tip tailored to your goal. Bonus: one comment wins a complimentary add-on with any booked service this week.`,
      imageConcept: "Instagram poll graphic with four options on brand cream background",
      hashtags: [
        "#SkinGoals",
        "#CommunityPoll",
        "#MedSpaCommunity",
        "#EngageWithUs",
        "#RosevilleCA",
        "#GraniteBay",
        "#SkincareQuestions",
        "#BeautyTalk",
        "#WellnessCommunity",
        "#Giveaway",
        "#InteractivePost",
        "#ClientLove",
        "#SpaLife",
        "#AskUsAnything",
        "#GlowTogether",
      ],
    },
  ];

  const posts: WellnessSocialPost[] = [];
  let day = 1;

  for (let week = 1; week <= 4; week++) {
    const weekMix: WellnessSocialPost["type"][] = [
      "educational",
      "educational",
      "educational",
      "promotional",
      "promotional",
      "staff-brand",
      "engagement",
    ];

    for (const type of weekMix) {
      const template = weekTemplates.find((t) => t.type === type)!;
      posts.push({
        day,
        week,
        type,
        caption: template.captionTemplate.replace(
          /signature treatment series/g,
          services.split(",")[0]?.trim() ?? "signature treatment series",
        ),
        hashtags: template.hashtags,
        imageConcept: template.imageConcept,
      });
      day++;
    }
  }

  return posts;
}
