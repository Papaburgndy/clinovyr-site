import type { Company, Survey } from "@prisma/client";
import type { AssessmentFormData } from "@/types/assessment";
import { resolveScore } from "@/lib/deliverables/artifacts";

export const RETAIL_AI_SYSTEM =
  "You are writing a comprehensive AI readiness report for a retail or hospitality business in Placer County, California (Roseville, Granite Bay, Fountains at Roseville corridor). Use a practical, margin-aware tone — sophisticated but grounded in local retail reality. Focus on win-back campaigns, review velocity, email personalization, social content, and staffing optimization — not futuristic inventory robots. Reference Klaviyo vs Mailchimp and POS/email integrations where relevant.";

export const RETAIL_WINBACK_SYSTEM =
  "You are a Clinovyr retail marketing consultant creating a customer win-back campaign kit. Include 5 email templates (Day 0, 3, 7, 14, 21), 3 SMS templates, and a Klaviyo setup guide achievable in ~45 minutes. Personalize to the business name, products, and survey data. Tone: warm, local, never desperate.";

export const RETAIL_REVIEW_SYSTEM =
  "You are a Clinovyr retail operations consultant creating a review management operational guide. Cover post-purchase automation (Klaviyo/SMS), a library of 20 review response templates by star rating, and Make.com blueprint instructions with an exact Claude prompt for drafting review responses. Be specific and copy-paste ready.";

export const RETAIL_SOCIAL_SYSTEM =
  "You are a Clinovyr retail social media consultant creating a 30-day content calendar. Detect whether the business is restaurant/hospitality vs boutique vs specialty retail and tailor captions accordingly. Provide exactly 28 captions with hashtags and posting times, plus 5 Instagram story templates.";

export const RETAIL_WINBACK_INSIGHT =
  "Industry benchmark: win-back campaigns to lapsed customers cost 5–8× less than acquiring new shoppers. A 5% reactivation rate on 2,000 past customers at $85 average transaction generates $8,500 in recovered revenue from one email sequence — often within 30 days.";

export type RetailSubType = "restaurant" | "boutique" | "specialty-retail";

export function isRetailIndustry(industry: string): boolean {
  return /retail|hospitality|restaurant|boutique|shop|cafe|food\s*service|store|ecommerce|e-commerce/i.test(
    industry,
  );
}

export function isRestaurantContext(
  company: Company,
  formData: AssessmentFormData | null,
): boolean {
  const industry = `${formData?.industry ?? ""} ${company.industry}`.toLowerCase();
  const goals = (formData?.goals ?? []).join(" ").toLowerCase();
  const drains = (formData?.timeDrainsRanked ?? []).join(" ").toLowerCase();
  const notes = (formData?.additionalNotes ?? "").toLowerCase();
  const combined = `${industry} ${goals} ${drains} ${notes}`;
  return /restaurant|hospitality|dining|cafe|coffee|bar|bistro|food\s*service|kitchen|menu|chef|catering|bakery|brewery|winery/i.test(
    combined,
  );
}

export function isBoutiqueContext(
  company: Company,
  formData: AssessmentFormData | null,
): boolean {
  const industry = `${formData?.industry ?? ""} ${company.industry}`.toLowerCase();
  return /boutique|apparel|fashion|jewelry|gift\s*shop|specialty\s*retail|curated/i.test(
    industry,
  );
}

export function getRetailSubType(
  company: Company,
  formData: AssessmentFormData | null,
): RetailSubType {
  if (isRestaurantContext(company, formData)) return "restaurant";
  if (isBoutiqueContext(company, formData)) return "boutique";
  return "specialty-retail";
}

export function getRetailTypeLabel(
  company: Company,
  formData: AssessmentFormData | null,
): string {
  const sub = getRetailSubType(company, formData);
  if (sub === "restaurant") return "Restaurant & Hospitality";
  if (sub === "boutique") return "Boutique & Apparel Retail";
  return "Specialty Retail";
}

export function companySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export type EmailPlatform = "Klaviyo" | "Mailchimp";

export function recommendEmailPlatform(
  formData: AssessmentFormData | null,
): EmailPlatform {
  const email = formData?.emailTools?.join(" ") ?? "";
  if (/klaviyo/i.test(email)) return "Klaviyo";
  if (/mailchimp/i.test(email)) return "Mailchimp";
  const revenue = formData?.revenue ?? "";
  if (/500|750|1M|250/i.test(revenue)) return "Klaviyo";
  return "Mailchimp";
}

export function recommendPosStack(formData: AssessmentFormData | null): string {
  const crm = formData?.crm?.join(" ") ?? "";
  const accounting = formData?.accounting?.join(" ") ?? "";
  if (/shopify/i.test(crm) || /shopify/i.test(accounting)) return "Shopify POS + Klaviyo native";
  if (/square/i.test(crm) || /square/i.test(accounting)) return "Square POS + Klaviyo or Mailchimp";
  if (/toast|lightspeed|clover/i.test(crm)) return "Toast/Lightspeed/Clover → Klaviyo via API or Zapier";
  return "Square or Shopify POS with Klaviyo recommended for Placer County independents";
}

export function buildRetailContextBlock(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): string {
  const score = resolveScore(formData, survey);
  const subType = getRetailSubType(company, formData);
  const topDrains = formData?.timeDrainsRanked?.slice(0, 5).join(", ") ?? "N/A";
  const stack = [
    formData?.crm?.length ? `POS/CRM: ${formData.crm.join(", ")}` : null,
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
    `Type: ${getRetailTypeLabel(company, formData)} (${subType})`,
    `Industry: ${company.industry} · Team size: ${company.size}`,
    `Revenue range: ${formData?.revenue ?? company.revenue ?? "N/A"}`,
    `Readiness score: ${survey.score ?? score?.overallScore ?? "N/A"}/100 (${survey.tier ?? score?.tier ?? "N/A"})`,
    `Top time drains: ${topDrains}`,
    `Tech stack: ${stack || "Not fully documented"}`,
    `Recommended email platform: ${recommendEmailPlatform(formData)}`,
    `POS integration path: ${recommendPosStack(formData)}`,
    `AI comfort: ${formData?.comfortLevel ?? "N/A"}/10 · AI tools used: ${formData?.aiTools ?? "N/A"}`,
    `Biggest concern: ${formData?.biggestConcern ?? "N/A"}`,
    `Goals: ${formData?.goals?.join(", ") ?? "N/A"}`,
    `Executive summary: ${survey.executiveSummary ?? "N/A"}`,
    `Top opportunities: ${Array.isArray(survey.topOpportunities) ? (survey.topOpportunities as string[]).join("; ") : "N/A"}`,
    `Estimated ROI: ${survey.estimatedROI ?? score?.estimatedAnnualROI ?? "N/A"}`,
    `Notes: ${formData?.additionalNotes ?? "None"}`,
  ].join("\n");
}

export type RetailFileResult = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  displayName: string;
};

export type RetailUseCase = {
  rank: number;
  name: string;
  description: string;
  tools: string;
  roiNote: string;
};

export type RetailSocialPost = {
  day: number;
  week: number;
  type: string;
  caption: string;
  hashtags: string[];
  postingTime: string;
  imageConcept: string;
};

export type RetailStoryTemplate = {
  name: string;
  frames: string[];
  cta: string;
};

export function defaultMonthlyRevenue(employees: string | undefined): number {
  if (employees === "1–5") return 45_000;
  if (employees === "6–20") return 120_000;
  if (employees === "21–50") return 280_000;
  return 450_000;
}

export function defaultCustomerCount(employees: string | undefined): number {
  if (employees === "1–5") return 800;
  if (employees === "6–20") return 2_500;
  if (employees === "21–50") return 8_000;
  return 15_000;
}

export function defaultAvgTransaction(subType: RetailSubType): number {
  if (subType === "restaurant") return 42;
  if (subType === "boutique") return 95;
  return 68;
}

export function defaultEmailListSize(employees: string | undefined): number {
  if (employees === "1–5") return 1_200;
  if (employees === "6–20") return 4_500;
  if (employees === "21–50") return 12_000;
  return 25_000;
}

export function defaultEmailOpenRate(): number {
  return 0.22;
}

export function defaultGoogleRating(): number {
  return 4.1;
}

export function buildDefaultSocialPosts(
  company: Company,
  formData: AssessmentFormData | null,
): RetailSocialPost[] {
  const biz = company.name;
  const sub = getRetailSubType(company, formData);
  const isRestaurant = sub === "restaurant";

  const weekTemplates: Array<{
    type: string;
    captionTemplate: string;
    imageConcept: string;
    hashtags: string[];
    postingTime: string;
  }> = isRestaurant
    ? [
        {
          type: "food-feature",
          captionTemplate: `Tonight's special at ${biz}: [DISH NAME] — [2-sentence description]. Made with [local ingredient] from Placer County producers when we can. Dine-in and takeout — link in bio to reserve or order.`,
          imageConcept: "Hero food shot, natural light, shallow depth of field",
          hashtags: [
            "#RosevilleEats",
            "#GraniteBay",
            "#PlacerCounty",
            "#LocalRestaurant",
            "#Foodie",
            "#DinnerSpecial",
            "#EatLocal",
            "#SacFood",
            "#RestaurantLife",
            "#ChefSpecial",
            "#SupportLocal",
            "#FountainsAtRoseville",
            "#DineIn",
            "#Takeout",
            "#ClinovyrPartner",
          ],
          postingTime: "11:30am Tue/Thu",
        },
        {
          type: "behind-the-scenes",
          captionTemplate: `A peek behind the pass at ${biz}. Our team preps every service with the same care we'd serve family — because in Granite Bay, reputation is everything. Swipe for tonight's prep →`,
          imageConcept: "Kitchen BTS, team in action, warm tones",
          hashtags: [
            "#BehindTheScenes",
            "#KitchenLife",
            "#RestaurantTeam",
            "#RosevilleCA",
            "#LocalBusiness",
            "#FoodService",
            "#ChefLife",
            "#Hospitality",
            "#GraniteBay",
            "#PlacerCounty",
            "#TeamSpotlight",
            "#RestaurantBTS",
            "#SupportLocal",
            "#SmallBusiness",
            "#OurKitchen",
          ],
          postingTime: "5:00pm Wed",
        },
        {
          type: "team",
          captionTemplate: `Meet [TEAM MEMBER] — [ROLE] at ${biz} for [X] years. Ask them about [SIGNATURE ITEM] next time you're in. We're hiring seasonal help — DM "TEAM" for details.`,
          imageConcept: "Staff portrait at host stand or line",
          hashtags: [
            "#MeetTheTeam",
            "#RestaurantStaff",
            "#NowHiring",
            "#RosevilleJobs",
            "#HospitalityCareers",
            "#LocalEmployer",
            "#GraniteBay",
            "#FoodIndustry",
            "#TeamCulture",
            "#RestaurantFamily",
            "#PlacerCounty",
            "#SupportLocal",
            "#WorkWithUs",
            "#RestaurantLife",
            "#PeopleFirst",
          ],
          postingTime: "10:00am Mon",
        },
        {
          type: "special-promo",
          captionTemplate: `This week only at ${biz}: [OFFER]. Valid [DATES]. Not valid with other offers. Show this post or mention INSTA at checkout. Questions? Call [PHONE] — we answer during service hours.`,
          imageConcept: "Graphic overlay on branded food photo",
          hashtags: [
            "#WeeklySpecial",
            "#RestaurantDeals",
            "#RosevilleDining",
            "#LimitedTime",
            "#EatOut",
            "#LocalDeal",
            "#GraniteBay",
            "#FoodDeals",
            "#DineLocal",
            "#RestaurantPromo",
            "#PlacerCounty",
            "#SpecialOffer",
            "#FoodLovers",
            "#WeekendPlans",
            "#BookNow",
          ],
          postingTime: "12:00pm Fri",
        },
      ]
    : [
        {
          type: "product-feature",
          captionTemplate: `New at ${biz}: [PRODUCT] — [benefit in one line]. Styled for [season/occasion] in Roseville. Shop in-store at [LOCATION] or DM us to hold your size. Limited quantities.`,
          imageConcept: "Product flat-lay on cream linen, teal accent prop",
          hashtags: [
            "#ShopLocal",
            "#RosevilleCA",
            "#GraniteBay",
            "#BoutiqueStyle",
            "#NewArrival",
            "#PlacerCounty",
            "#RetailTherapy",
            "#SmallBusiness",
            "#LocalShop",
            "#StyleInspo",
            "#GiftIdeas",
            "#SupportLocal",
            "#FountainsAtRoseville",
            "#Curated",
            "#ClinovyrPartner",
          ],
          postingTime: "10:00am Tue",
        },
        {
          type: "styling",
          captionTemplate: `How we styled [PRODUCT] three ways for Placer County weekends — casual Granite Bay brunch, Roseville date night, and Fountains shopping day. Which look is yours? Comment A, B, or C.`,
          imageConcept: "Three-panel carousel, lifestyle backgrounds",
          hashtags: [
            "#StyleTips",
            "#OutfitInspo",
            "#BoutiqueFashion",
            "#RosevilleStyle",
            "#GraniteBay",
            "#RetailFashion",
            "#ShopSmall",
            "#LocalBoutique",
            "#PlacerCounty",
            "#OOTD",
            "#FashionRetail",
            "#StyleGuide",
            "#WeekendStyle",
            "#CuratedLooks",
            "#CustomerStyle",
          ],
          postingTime: "1:00pm Thu",
        },
        {
          type: "customer-spotlight",
          captionTemplate: `Customer spotlight: [NAME] picked up [PRODUCT] for [OCCASION]. We're honored to be part of your story. Tag ${biz} in your photos — we repost favorites every Friday.`,
          imageConcept: "Customer photo (permission) with product tags",
          hashtags: [
            "#CustomerLove",
            "#ShopLocal",
            "#RosevilleCA",
            "#Community",
            "#RetailCommunity",
            "#GraniteBay",
            "#ThankYou",
            "#LocalBusiness",
            "#ClientSpotlight",
            "#PlacerCounty",
            "#SupportSmall",
            "#BoutiqueLife",
            "#RealCustomers",
            "#ShareYourStyle",
            "#UGC",
          ],
          postingTime: "11:00am Sat",
        },
        {
          type: "sale-event",
          captionTemplate: `Mark your calendar: ${biz} [EVENT NAME] [DATE/TIME]. Early access for email subscribers — join the list at link in bio. In-store perks while supplies last.`,
          imageConcept: "Event poster, brand colors ink + accent teal",
          hashtags: [
            "#ShopEvent",
            "#Sale",
            "#RosevilleEvents",
            "#GraniteBay",
            "#RetailSale",
            "#LocalEvent",
            "#PlacerCounty",
            "#BoutiqueSale",
            "#WeekendShopping",
            "#ExclusiveAccess",
            "#ShopSmall",
            "#InStoreEvent",
            "#LimitedStock",
            "#FountainsAtRoseville",
            "#RSVP",
          ],
          postingTime: "9:00am Sun",
        },
      ];

  const engagementTemplate = {
    type: "engagement",
    captionTemplate: `Quick question for our ${biz} community: What's on your [shopping/dining] list this week? Drop a 🛍️ or 🍽️ below — we'll reply with one personalized recommendation.`,
    imageConcept: "Poll sticker graphic, brand cream background",
    hashtags: [
      "#Community",
      "#ShopLocal",
      "#RosevilleCA",
      "#GraniteBay",
      "#EngageWithUs",
      "#LocalBusiness",
      "#PlacerCounty",
      "#CustomerFirst",
      "#RetailCommunity",
      "#AskUs",
      "#Interactive",
      "#SupportLocal",
      "#Neighborhood",
      "#FountainsAtRoseville",
      "#WeListen",
    ],
    postingTime: "7:00pm Wed",
  };

  const posts: RetailSocialPost[] = [];
  let day = 1;
  const weekMix = isRestaurant
    ? ["food-feature", "food-feature", "behind-the-scenes", "team", "special-promo", "food-feature", "engagement"]
    : ["product-feature", "styling", "product-feature", "customer-spotlight", "sale-event", "styling", "engagement"];

  for (let week = 1; week <= 4; week++) {
    for (const type of weekMix) {
      const template =
        type === "engagement"
          ? engagementTemplate
          : weekTemplates.find((t) => t.type === type)!;
      posts.push({
        day,
        week,
        type,
        caption: template.captionTemplate,
        hashtags: template.hashtags,
        postingTime: template.postingTime,
        imageConcept: template.imageConcept,
      });
      day++;
    }
  }

  return posts;
}

export const DEFAULT_STORY_TEMPLATES: RetailStoryTemplate[] = [
  {
    name: "New Arrival / Special Drop",
    frames: [
      "Frame 1: Product or dish hero shot + 'Just dropped'",
      "Frame 2: Close-up detail or ingredient highlight",
      "Frame 3: Price/offer + 'Swipe up' or 'DM to hold'",
    ],
    cta: "Link sticker to shop menu or booking",
  },
  {
    name: "Behind the Scenes",
    frames: [
      "Frame 1: Team prep or stock room",
      "Frame 2: Process clip (3 sec)",
      "Frame 3: 'See you today' + hours",
    ],
    cta: "Location sticker — Fountains / Roseville",
  },
  {
    name: "Customer Love",
    frames: [
      "Frame 1: Repost customer tag (with permission)",
      "Frame 2: Thank-you text overlay",
      "Frame 3: 'Tag us for a feature'",
    ],
    cta: "Mention sticker @yourhandle",
  },
  {
    name: "Weekend Hours & Promo",
    frames: [
      "Frame 1: 'This weekend at [STORE]'",
      "Frame 2: Hours + parking tip",
      "Frame 3: Promo code or happy hour",
    ],
    cta: "Countdown sticker to event end",
  },
  {
    name: "Staff Pick",
    frames: [
      "Frame 1: Staff photo + name",
      "Frame 2: Their favorite product/dish",
      "Frame 3: 'Ask for [NAME] next visit'",
    ],
    cta: "Poll: 'Have you tried this?' Yes / Not yet",
  },
];

export const REVIEW_RESPONSE_CLAUDE_PROMPT = `You are a review response assistant for [BUSINESS NAME], a [RESTAURANT/RETAIL] business in Roseville/Granite Bay, CA.

Review details:
- Platform: [Google/Yelp/Facebook]
- Star rating: [1-5]
- Reviewer name: [NAME]
- Review text: [PASTE REVIEW]

Rules:
- Respond as the owner or manager — warm, professional, never defensive
- Thank the reviewer by name when possible
- For 4-5 stars: reinforce specific praise, invite return visit
- For 3 stars: acknowledge feedback, offer offline resolution (no public arguments)
- For 1-2 stars: apologize sincerely, take conversation offline with phone/email, never blame customer
- Under 80 words for Google; under 120 for Yelp
- No incentives for reviews (FTC/Google policy)
- Sign as "[OWNER NAME], [BUSINESS NAME]"

Output only the response text ready to paste.`;
