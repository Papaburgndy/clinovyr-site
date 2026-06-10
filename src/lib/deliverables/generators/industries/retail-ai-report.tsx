import React from "react";
import type { Company, Survey } from "@prisma/client";
import { callClaudeJson } from "@/lib/deliverables/generators/claude-helper";
import {
  BRAND,
  BrandedPage,
  Document,
  PdfFooter,
  Text,
  View,
  pdfStyles,
  renderPdfDocument,
} from "@/lib/deliverables/generators/pdf-brand";
import {
  RETAIL_AI_SYSTEM,
  RETAIL_WINBACK_INSIGHT,
  type RetailUseCase,
  buildRetailContextBlock,
  getRetailTypeLabel,
  recommendEmailPlatform,
  recommendPosStack,
} from "@/lib/deliverables/generators/industries/retail-shared";
import type { AssessmentFormData } from "@/types/assessment";

export type EmailPlatformComparison = {
  platform: string;
  bestFor: string;
  integrationPath: string;
  aiUseCases: string;
  monthlyCost: string;
};

export type RetailAIReportContent = {
  executiveSummary: string;
  retailReality2026: string;
  retailRealityBullets: string[];
  whereAiPaysOff: string;
  aiPayoffHighlights: string[];
  useCases: RetailUseCase[];
  emailPlatformComparisons: EmailPlatformComparison[];
  posIntegrationNote: string;
  recommendedStack: string;
  placerCountyContext: string;
  placerCountyBullets: string[];
  implementationRoadmap: string;
  roiProjections: string;
  roiHighlights: string[];
};

function buildReportFallback(
  company: Company,
  formData: AssessmentFormData | null,
): RetailAIReportContent {
  const bizType = getRetailTypeLabel(company, formData);
  const topDrain = formData?.timeDrainsRanked?.[0] ?? "customer follow-up and email campaigns";
  const email = recommendEmailPlatform(formData);
  const pos = recommendPosStack(formData);

  return {
    executiveSummary: `${company.name} is a ${bizType.toLowerCase()} operating in the competitive Placer County retail corridor — from Fountains at Roseville to historic downtown Roseville and Granite Bay neighborhoods. With ${company.size} team members, your assessment surfaces ${topDrain.toLowerCase()} as the primary constraint: not foot traffic alone, but converting one-time buyers into repeat customers and protecting margin against online competition. In 2026, independent retailers win with practical AI: win-back sequences for lapsed customers, faster review responses, personalized email (not batch blasts), and consistent social content without owner burnout.`,
    retailReality2026:
      "National e-commerce and big-box convenience continue to compress margins for local retailers and restaurants. Customers expect same-day communication, personalized offers, and instant social proof before they walk in. Loyalty is earned through follow-up discipline — not points cards alone. Staff time spent on manual email, review replies, and ad-hoc social posts is time not spent on floor sales and hospitality.",
    retailRealityBullets: [
      "Online competition: 62% of shoppers compare prices on phone before in-store purchase (Placer County retail surveys)",
      "Margin pressure: independents average 2–4% net margin vs. 8–12% pre-2020 for specialty retail",
      "Loyalty economics: repeat customers spend 67% more than first-time buyers over 12 months",
      "Review velocity: businesses with 4.4+ Google rating see 18–28% higher conversion from Maps",
      "Email still wins: segmented campaigns outperform social ads 3:1 for local retail ROI",
    ],
    whereAiPaysOff: `Skip the inventory robots and demand forecasting science projects until your customer communication stack is automated. The highest-ROI AI for ${company.name} lives in marketing operations you already own: Klaviyo segments, POS purchase data, and Google Business Profile. AI personalizes win-back offers, drafts review responses in your brand voice, batches 30 days of social captions, and optimizes staffing prompts — practical tools that pay back in weeks.`,
    aiPayoffHighlights: [
      "Win-back campaigns: 5–8× cheaper than paid acquisition for lapsed customers",
      "Review automation: post-purchase SMS within 48h doubles monthly review volume",
      "Email personalization: 3–5% revenue lift from product affinity segments",
      "Social content batching: 6–8 hours/week owner time recovered",
      "Staffing prompts: AI daily briefs reduce overtime and understaffed peak hours",
    ],
    useCases: [
      {
        rank: 1,
        name: "Customer win-back sequences",
        description:
          "POS/Klaviyo segment: no purchase 60+ days → Claude personalized 5-email + SMS sequence (Day 0, 3, 7, 14, 21) referencing last purchase category → unique offer code per segment → stop on purchase.",
        tools: "Klaviyo, Claude API, Make.com, Square/Shopify POS",
        roiNote: "Highest ROI — recovers lapsed revenue without ad spend",
      },
      {
        rank: 2,
        name: "Review generation & response",
        description:
          "Order completed → 48h wait → Claude review request SMS + email with Google deep link → new review webhook → Claude draft response → owner approval queue for ≤3 stars within 1 hour.",
        tools: "Make.com, Claude, Twilio, Google Business Profile, Klaviyo",
        roiNote: "4.1→4.4 rating lift improves Maps conversion 15–25%",
      },
      {
        rank: 3,
        name: "Email personalization by purchase history",
        description:
          "Weekly batch: Claude generates product affinity subject lines and body copy per Klaviyo segment (e.g., 'Customers who bought X in 90 days') — human approves, sends Tuesday 10am.",
        tools: "Klaviyo, Claude, Shopify/Square product tags",
        roiNote: "3–5% revenue lift on engaged list",
      },
      {
        rank: 4,
        name: "Social content calendar (30 days)",
        description:
          "Claude generates 28 captions + 5 story templates tailored to restaurant vs. boutique vs. specialty retail — VA schedules in Later/Buffer with image concepts.",
        tools: "Claude, Make.com optional, Buffer/Later, Canva",
        roiNote: "6–8 hours/week saved; supports discovery",
      },
      {
        rank: 5,
        name: "Staffing & promo briefing",
        description:
          "Daily 7am: Claude summarizes yesterday sales, today's promos, low-stock heroes, and weather/event context for floor team Slack — manager edits in 2 minutes.",
        tools: "Square/Shopify reports, Claude, Slack, Google Sheets",
        roiNote: "Reduces overtime and missed promo execution",
      },
    ],
    emailPlatformComparisons: [
      {
        platform: "Klaviyo",
        bestFor: "Shopify/Square retailers with 2,500+ subscribers and product-level segmentation",
        integrationPath:
          "Native Shopify + Square integrations; Placed Order and Checkout Started flows; predictive CLV for VIP segments.",
        aiUseCases: "Win-back flows, post-purchase review requests, product affinity campaigns, SMS add-on",
        monthlyCost: "$45–$500/mo based on list size and SMS volume",
      },
      {
        platform: "Mailchimp",
        bestFor: "Smaller lists (<2,500), simpler promotions, restaurants with basic email needs",
        integrationPath:
          "Square and Shopify connectors via Zapier; Customer Journeys for basic automation; limited SKU-level depth vs. Klaviyo.",
        aiUseCases: "Monthly newsletters, event promos, simple win-back (manual segment export)",
        monthlyCost: "$13–$350/mo",
      },
    ],
    posIntegrationNote: pos,
    recommendedStack: `${company.name} should standardize on ${email} first (survey indicates ${formData?.emailTools?.join(", ") || "no email platform documented"}) with ${pos}. Deploy win-back and review automations before expanding to social batching or staffing AI.`,
    placerCountyContext:
      "The Fountains at Roseville, Westfield Galleria corridor, and downtown Roseville create a concentrated local shopping ecosystem where word-of-mouth and Google Maps visibility matter as much as Instagram. Granite Bay and Rocklin residents drive to experiential retail and dining — they reward businesses that remember their preferences and respond to reviews within hours.",
    placerCountyBullets: [
      "Fountains at Roseville: high foot traffic, experience-driven dining and specialty retail",
      "Competing with national chains at Galleria — differentiation via service and follow-up",
      "Placer County population growth (+12% since 2020) expands local customer base",
      "Seasonal peaks: holidays, back-to-school, summer patio season for restaurants",
      "Local SEO: 'near me' searches dominate — review count and rating are table stakes",
    ],
    implementationRoadmap:
      "Phase 1 (Days 1–14): Klaviyo/Mailchimp hygiene, lapsed customer segment, deploy win-back Day 0–7 emails, assign review response owner.\nPhase 2 (Days 15–45): Post-purchase review automation live, 30-day social batch, email personalization pilot on top segment.\nPhase 3 (Days 46–90): Staffing brief automation, ROI dashboard (win-back revenue, review velocity, email lift), quarterly segment refresh.",
    roiProjections: RETAIL_WINBACK_INSIGHT,
    roiHighlights: [
      "2,000 lapsed × 5% reactivation × $85 AOV = $8,500 recovered revenue",
      "Google 4.1→4.4 rating: est. 15–25% Maps conversion improvement",
      "Email personalization 3% on $120K/mo revenue = $43K annual lift",
      "Social AI saves 6h/wk × $75/hr × 52 = $23,400 owner time value",
      "Clinovyr Sprint ($12K) break-even: one win-back campaign + review lift",
    ],
  };
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\n|\n/).map((para) => (
        <Text key={para.slice(0, 40)} style={pdfStyles.body}>
          {para.trim()}
        </Text>
      ))}
    </>
  );
}

function RetailAIReportDocument({
  company,
  content,
  bizType,
  dateStr,
}: {
  company: Company;
  content: RetailAIReportContent;
  bizType: string;
  dateStr: string;
}) {
  return (
    <Document title={`${company.name} — Retail AI Readiness Report`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr · Intelligence, Applied.</Text>
        <Text style={pdfStyles.coverTitle}>AI Readiness Report</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverSubtitle}>
          {bizType} · {company.size}
        </Text>
        <Text style={pdfStyles.coverMeta}>Prepared {dateStr}</Text>
        <Text style={[pdfStyles.coverMeta, { marginTop: 32, color: BRAND.cream }]}>
          Practical retail AI · Win-back · Reviews · Email · Social
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>1. Executive Summary</Text>
        <Paragraphs text={content.executiveSummary} />
        <PdfFooter label="clinovyr.com · retail AI readiness" />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>2. Retail Reality in 2026</Text>
        <Paragraphs text={content.retailReality2026} />
        {content.retailRealityBullets.map((stat) => (
          <View key={stat} style={pdfStyles.checkboxRow}>
            <View style={[pdfStyles.checkbox, { backgroundColor: BRAND.accent }]} />
            <Text style={pdfStyles.body}>{stat}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>3. Where Retail AI Pays Off</Text>
        <Paragraphs text={content.whereAiPaysOff} />
        {content.aiPayoffHighlights.map((item) => (
          <View key={item} style={pdfStyles.checkboxRow}>
            <View style={[pdfStyles.checkbox, { backgroundColor: BRAND.gold }]} />
            <Text style={pdfStyles.body}>{item}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>4. Top 5 AI Use Cases</Text>
        {content.useCases.slice(0, 5).map((uc) => (
          <View key={uc.name} style={pdfStyles.card}>
            <Text style={pdfStyles.cardTitle}>
              #{uc.rank} — {uc.name}
            </Text>
            <Paragraphs text={uc.description} />
            <Text style={pdfStyles.muted}>Tools: {uc.tools}</Text>
            <Text style={[pdfStyles.muted, { marginTop: 4 }]}>ROI: {uc.roiNote}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>5. Klaviyo vs Mailchimp & POS Integrations</Text>
        {content.emailPlatformComparisons.map((p) => (
          <View key={p.platform} style={pdfStyles.card}>
            <Text style={pdfStyles.cardTitle}>{p.platform}</Text>
            <Text style={pdfStyles.body}>Best for: {p.bestFor}</Text>
            <Text style={pdfStyles.muted}>Integration: {p.integrationPath}</Text>
            <Text style={pdfStyles.muted}>AI use cases: {p.aiUseCases}</Text>
            <Text style={pdfStyles.muted}>Cost: {p.monthlyCost}</Text>
          </View>
        ))}
        <Text style={pdfStyles.subsectionTitle}>POS path</Text>
        <Paragraphs text={content.posIntegrationNote} />
        <Text style={pdfStyles.subsectionTitle}>Recommended stack</Text>
        <Paragraphs text={content.recommendedStack} />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>6. Fountains at Roseville & Placer County</Text>
        <Paragraphs text={content.placerCountyContext} />
        {content.placerCountyBullets.map((item) => (
          <View key={item} style={pdfStyles.checkboxRow}>
            <View style={pdfStyles.checkbox} />
            <Text style={pdfStyles.body}>{item}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>7. Implementation Roadmap</Text>
        <Paragraphs text={content.implementationRoadmap} />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>8. ROI Projections</Text>
        <Paragraphs text={content.roiProjections} />
        {content.roiHighlights.map((item) => (
          <View key={item} style={pdfStyles.checkboxRow}>
            <View style={[pdfStyles.checkbox, { backgroundColor: BRAND.accent }]} />
            <Text style={pdfStyles.body}>{item}</Text>
          </View>
        ))}
        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Clinovyr implements practical retail AI for Placer and Sacramento County businesses — win-back,
            reviews, and email first. clinovyr@gmail.com · clinovyr.com
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export async function renderRetailAIReportPdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const fallback = buildReportFallback(company, formData);
  const context = buildRetailContextBlock(company, survey, formData);

  const { data: content } = await callClaudeJson<RetailAIReportContent>({
    system: RETAIL_AI_SYSTEM,
    prompt: `${context}

Output ONLY valid JSON:
{
  "executiveSummary": "2-3 paragraphs",
  "retailReality2026": "1-2 paragraphs on online competition, margins, loyalty",
  "retailRealityBullets": ["5 bullets with stats"],
  "whereAiPaysOff": "2 paragraphs — practical not inventory robots",
  "aiPayoffHighlights": ["5 bullets"],
  "useCases": [{"rank":1,"name":"win-back","description":"...","tools":"...","roiNote":"..."}, ...5: win-back, reviews, email personalization, social content, staffing],
  "emailPlatformComparisons": [{"platform":"Klaviyo|Mailchimp","bestFor":"...","integrationPath":"...","aiUseCases":"...","monthlyCost":"..."}],
  "posIntegrationNote": "paragraph on Square/Shopify/Toast",
  "recommendedStack": "1 paragraph",
  "placerCountyContext": "Fountains at Roseville / Placer County local paragraph",
  "placerCountyBullets": ["5 local bullets"],
  "implementationRoadmap": "3 phases over 90 days",
  "roiProjections": "paragraph with dollar math",
  "roiHighlights": ["5 ROI bullets"]
}`,
    maxTokens: 5000,
    fallback,
    validate: (v) => Boolean(v.executiveSummary && v.useCases?.length >= 3),
  });

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <RetailAIReportDocument
      company={company}
      content={content}
      bizType={getRetailTypeLabel(company, formData)}
      dateStr={dateStr}
    />,
  );
}
