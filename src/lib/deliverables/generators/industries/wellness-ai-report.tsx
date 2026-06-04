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
  WELLNESS_AI_SYSTEM,
  WELLNESS_RETENTION_INSIGHT,
  type WellnessUseCase,
  buildWellnessContextBlock,
  getWellnessTypeLabel,
  recommendBookingPlatform,
} from "@/lib/deliverables/generators/industries/wellness-shared";
import type { AssessmentFormData } from "@/types/assessment";

export type PlatformIntegration = {
  platform: string;
  bestFor: string;
  integrationPath: string;
  aiUseCases: string;
  monthlyCost: string;
};

export type WellnessAIReportContent = {
  executiveSummary: string;
  revenueModel: string;
  retentionVsAcquisition: string[];
  retentionEconomics: string;
  aiForRetention: string;
  retentionAiHighlights: string[];
  useCases: WellnessUseCase[];
  platformIntegrations: PlatformIntegration[];
  recommendedPlatform: string;
  ftcComplianceNote: string;
  ftcComplianceChecklist: string[];
  implementationRoadmap: string;
  roiProjections: string;
  roiHighlights: string[];
};

function buildReportFallback(
  company: Company,
  formData: AssessmentFormData | null,
): WellnessAIReportContent {
  const bizType = getWellnessTypeLabel(company, formData);
  const topDrain = formData?.timeDrainsRanked?.[0] ?? "client rebooking and follow-up";
  const platform = recommendBookingPlatform(company, formData);

  return {
    executiveSummary: `${company.name} is a ${bizType.toLowerCase()} serving clients in the Placer County corridor. With ${company.size} team members, your assessment highlights ${topDrain.toLowerCase()} as the primary growth constraint — not lead volume, but converting first visits into loyal, rebooking clients. Med spas and wellness studios that win in 2026 compete on retention automation: personalized post-treatment sequences, at-risk client alerts, and consistent social proof. AI layers on top of ${platform} can recover 10–15 staff hours per week while lifting rebooking rates 10–20% within 90 days.`,
    revenueModel:
      "Wellness and med spa revenue follows a repeat-visit model: 60–75% of annual revenue typically comes from existing clients, not new acquisitions. First-visit conversion to a second appointment within 90 days is the single strongest predictor of lifetime value. Memberships, series packages, and VIP tiers amplify this — but only when supported by systematic touchpoints between visits.",
    retentionVsAcquisition: [
      "Cost to acquire a new med spa client: $150–$400 (ads, promos, staff time)",
      "Cost to retain and rebook an existing client: $15–$40 (automated SMS/email)",
      "Industry benchmark: retention costs ~5× less than acquisition",
      "Average med spa client LTV: $1,200–$3,500 over 24 months with consistent rebooking",
      "A 10% rebooking improvement on 200 clients at $250 avg treatment = $50,000 additional annual revenue",
    ],
    retentionEconomics:
      "Focus AI investment on the post-treatment window (days 1–14) and the at-risk window (45+ days without booking). These two intervals capture the highest ROI: clients are most receptive to rebooking immediately after a great result, and most recoverable before they switch to a competitor.",
    aiForRetention:
      "Client retention is the highest-ROI AI use case for wellness businesses — higher than social ads, chatbots, or inventory AI. Why: you already have the client data in your booking system; AI personalizes outreach at scale without adding front-desk headcount. Automated rebooking prompts, loyalty tier nudges, and win-back sequences consistently outperform generic email blasts by 3–5× on click-through and booking conversion.",
    retentionAiHighlights: [
      "Post-treatment SMS within 72 hours increases rebooking by 18–28% (industry studies)",
      "At-risk client alerts (45+ days idle) recover 12–20% of lapsed clients with one personalized offer",
      "AI-generated review requests within 24 hours of visit boost Google review velocity 2–3×",
      "Social content automation saves 6–10 hours/week for owners managing Instagram manually",
      "Upsell sequences based on treatment history lift average ticket 8–15% without hard selling",
    ],
    useCases: [
      {
        rank: 1,
        name: "Post-treatment rebooking automation",
        description:
          "Mindbody/Jane webhook on completed appointment → 3-day wait → Claude personalized SMS referencing treatment received → 48h follow-up email with booking link → log to Google Sheets. Adapts message tone by service type (injectables vs. facial vs. body).",
        tools: "Make.com, Claude API, Twilio, Mindbody or Jane App webhook, Mailchimp/Klaviyo",
        roiNote: "Highest ROI — targets clients in peak rebooking window",
      },
      {
        rank: 2,
        name: "Loyalty & at-risk client alerts",
        description:
          "Daily schedule scans client database → flags VIPs approaching tier downgrade and clients 45+ days without booking → Claude drafts personalized outreach → staff approval queue or auto-send for tier-1 clients.",
        tools: "Make.com, Claude, booking platform API, Slack alerts to spa director",
        roiNote: "Recovers lapsed revenue without new ad spend",
      },
      {
        rank: 3,
        name: "AI social content generation",
        description:
          "Weekly batch: Claude generates 7 posts (educational, promotional, staff spotlight) personalized to your service menu → export to Later/Buffer → VA adds images from concept briefs. Maintains consistent posting without owner time drain.",
        tools: "Claude, Make.com, Buffer/Later, Canva templates",
        roiNote: "6–10 hours/week saved; supports acquisition indirectly",
      },
      {
        rank: 4,
        name: "Review generation workflow",
        description:
          "Completed appointment → 24h wait → Claude review request SMS/email (warm, specific to treatment) → Google Reviews deep link → log response in Sheets → alert staff for 4-star or below within 1 hour.",
        tools: "Make.com, Claude, Twilio, Google Business Profile",
        roiNote: "Reviews drive local SEO and new client trust",
      },
      {
        rank: 5,
        name: "Treatment upsell sequences",
        description:
          "Trigger on service completion or product purchase → Claude sequence recommending complementary treatments based on history (e.g., microneedling client → collagen booster series at visit 3) → email + SMS with soft CTA, never clinical claims.",
        tools: "Klaviyo/Mailchimp, Claude, booking platform tags",
        roiNote: "8–15% average ticket lift when personalized",
      },
    ],
    platformIntegrations: [
      {
        platform: "Mindbody",
        bestFor: "Multi-location spas, fitness-wellness hybrids, membership-heavy models",
        integrationPath:
          "Mindbody API + webhooks (appointment.completed, client.created) → Make.com HTTP module. Use Client API for at-risk scans. Requires Mindbody Accelerate or higher for API access.",
        aiUseCases: "Rebooking SMS, win-back campaigns, class/appointment reminders, membership renewal nudges",
        monthlyCost: "$139–$699/mo depending on tier and locations",
      },
      {
        platform: "Jane App",
        bestFor: "Boutique med spas, solo-to-small teams, clinical aesthetics practices",
        integrationPath:
          "Jane webhooks (appointment.completed, patient.created) → Make.com. Simpler API surface than Mindbody; excellent for treatment notes context in Claude prompts.",
        aiUseCases: "Post-visit follow-up, review requests, treatment plan reminders, intake form summaries",
        monthlyCost: "$54–$199/mo per practitioner tier",
      },
    ],
    recommendedPlatform: `${company.name} should prioritize ${platform} integrations first — ${platform === "Jane App" ? "Jane's webhook simplicity and treatment-note context make Claude personalization especially effective for boutique med spas" : "Mindbody's client API and membership tools support at-scale retention automation for multi-provider studios"}. Layer Make.com scenarios before considering platform-native marketing add-ons.`,
    ftcComplianceNote:
      "The FTC actively monitors health and beauty claims in advertising — including social posts, SMS, and email generated by AI. You may not claim treatments 'cure,' 'eliminate,' or 'guarantee' results. Before/after content requires clear disclosure, typical results language, and often practitioner supervision. AI-generated copy must be reviewed by a licensed provider or marketing lead before publication. Testimonials need substantiation; incentivized reviews must be disclosed.",
    ftcComplianceChecklist: [
      "No disease-treatment claims unless FDA-cleared device with approved labeling",
      "Avoid 'permanent,' 'guaranteed,' or '100% effective' language in AI drafts",
      "Before/after photos: same lighting, disclose if results atypical, include timeframe",
      "Injectable and prescription-adjacent services: provider name and license in ads where required",
      "Incentivized reviews: disclose offer (e.g., 'Complimentary add-on for honest review')",
      "AI social posts: human review before publish — assign one compliance owner",
      "SMS marketing: prior express consent (TCPA) — transactional vs. promotional separation",
      "Weight loss / body contouring: avoid unsubstantiated inch-loss or metabolism claims",
    ],
    implementationRoadmap:
      "Phase 1 (Days 1–14): Connect booking webhooks to Make.com, deploy post-treatment rebooking SMS, establish FTC review workflow for AI content.\nPhase 2 (Days 15–45): Launch at-risk client daily scan, review generation sequence, 30-day social content batch.\nPhase 3 (Days 46–90): VIP tier automation, upsell sequences by service category, retention KPI dashboard (rebooking rate, visit frequency, LTV).",
    roiProjections: WELLNESS_RETENTION_INSIGHT,
    roiHighlights: [
      "200 clients × $250 avg × 10% rebooking lift = $50,000 additional annual revenue",
      "5× cheaper to retain vs. acquire — AI retention pays back in 30–60 days",
      "Review automation: 10 new Google reviews/month improves local pack ranking",
      "Social content AI saves 6–10 owner hours/week ($150–$250/hr opportunity cost)",
      "Clinovyr Workflow Automation Sprint ($12K) break-even: ~3% rebooking improvement on 200-client base",
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

function WellnessAIReportDocument({
  company,
  content,
  bizType,
  dateStr,
}: {
  company: Company;
  content: WellnessAIReportContent;
  bizType: string;
  dateStr: string;
}) {
  return (
    <Document title={`${company.name} — Wellness AI Readiness Report`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr · Intelligence, Applied.</Text>
        <Text style={pdfStyles.coverTitle}>AI Readiness Report</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverSubtitle}>
          {bizType} · {company.size}
        </Text>
        <Text style={pdfStyles.coverMeta}>Prepared {dateStr}</Text>
        <Text style={[pdfStyles.coverMeta, { marginTop: 32, color: BRAND.cream }]}>
          Retention-first AI strategy for wellness & med spa
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>1. Executive Summary</Text>
        <Paragraphs text={content.executiveSummary} />
        <Text style={[pdfStyles.muted, { marginTop: 12 }]}>
          Placer County wellness market · Retention economics drive recommendations below
        </Text>
        <PdfFooter />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>2. Med Spa Revenue Model</Text>
        <Paragraphs text={content.revenueModel} />
        <Text style={pdfStyles.subsectionTitle}>Retention vs. acquisition</Text>
        {content.retentionVsAcquisition.map((stat) => (
          <View key={stat} style={pdfStyles.checkboxRow}>
            <View style={[pdfStyles.checkbox, { backgroundColor: BRAND.accent }]} />
            <Text style={pdfStyles.body}>{stat}</Text>
          </View>
        ))}
        <Text style={pdfStyles.subsectionTitle}>Where revenue leaks</Text>
        <Paragraphs text={content.retentionEconomics} />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>3. AI for Client Retention</Text>
        <Text style={[pdfStyles.muted, { marginBottom: 8 }]}>
          Highest ROI focus area for {company.name}
        </Text>
        <Paragraphs text={content.aiForRetention} />
        {content.retentionAiHighlights.map((item) => (
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
        <Text style={pdfStyles.sectionTitle}>5. Mindbody & Jane App Integrations</Text>
        {content.platformIntegrations.map((p) => (
          <View key={p.platform} style={pdfStyles.card}>
            <Text style={pdfStyles.cardTitle}>{p.platform}</Text>
            <Text style={pdfStyles.body}>Best for: {p.bestFor}</Text>
            <Text style={pdfStyles.muted}>Integration: {p.integrationPath}</Text>
            <Text style={pdfStyles.muted}>AI use cases: {p.aiUseCases}</Text>
            <Text style={pdfStyles.muted}>Cost: {p.monthlyCost}</Text>
          </View>
        ))}
        <Text style={pdfStyles.subsectionTitle}>Clinovyr recommendation</Text>
        <Paragraphs text={content.recommendedPlatform} />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>FTC Compliance — Health & Beauty Claims</Text>
        <Paragraphs text={content.ftcComplianceNote} />
        <Text style={pdfStyles.subsectionTitle}>Pre-publish checklist</Text>
        {content.ftcComplianceChecklist.map((item) => (
          <View key={item} style={pdfStyles.checkboxRow}>
            <View style={pdfStyles.checkbox} />
            <Text style={pdfStyles.body}>{item}</Text>
          </View>
        ))}
        <Text style={[pdfStyles.muted, { marginTop: 10 }]}>
          Assign one compliance owner to review all AI-generated client-facing content before
          publish. When in doubt, consult your medical director or marketing counsel.
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>6. Implementation Roadmap</Text>
        <Paragraphs text={content.implementationRoadmap} />
        <View style={pdfStyles.timelinePhase}>
          <Text style={pdfStyles.subsectionTitle}>Quick wins (Week 1)</Text>
          <Text style={pdfStyles.body}>
            • Connect booking webhook · Deploy rebooking SMS · FTC review owner assigned · Baseline
            rebooking rate metric
          </Text>
        </View>
        <View style={pdfStyles.timelinePhase}>
          <Text style={pdfStyles.subsectionTitle}>Foundation (Weeks 2–6)</Text>
          <Text style={pdfStyles.body}>
            • At-risk client alerts · Review generation live · 30-day social batch · Staff training on
            AI touchpoints
          </Text>
        </View>
        <View style={pdfStyles.timelinePhase}>
          <Text style={pdfStyles.subsectionTitle}>Scale (Weeks 7–12)</Text>
          <Text style={pdfStyles.body}>
            • VIP tier automation · Upsell sequences · Retention dashboard · Quarterly ROI review
          </Text>
        </View>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>7. ROI Projections</Text>
        <Paragraphs text={content.roiProjections} />
        {content.roiHighlights.map((item) => (
          <View key={item} style={pdfStyles.checkboxRow}>
            <View style={[pdfStyles.checkbox, { backgroundColor: BRAND.accent }]} />
            <Text style={pdfStyles.body}>{item}</Text>
          </View>
        ))}
        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Clinovyr implements retention-first AI for Placer County wellness businesses. A 10%
            rebooking lift funds the investment — we help you get there. clinovyr@gmail.com ·
            clinovyr.com
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export async function renderWellnessAIReportPdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const fallback = buildReportFallback(company, formData);
  const context = buildWellnessContextBlock(company, survey, formData);

  const { data: content } = await callClaudeJson<WellnessAIReportContent>({
    system: WELLNESS_AI_SYSTEM,
    prompt: `${context}

Output ONLY valid JSON:
{
  "executiveSummary": "2-3 paragraphs, aspirational wellness tone",
  "revenueModel": "1-2 paragraphs on repeat-visit economics",
  "retentionVsAcquisition": ["5 bullet stats with dollar amounts"],
  "retentionEconomics": "paragraph on post-treatment and at-risk windows",
  "aiForRetention": "2 paragraphs why retention is highest ROI",
  "retentionAiHighlights": ["5 bullets"],
  "useCases": [{"rank":1,"name":"...","description":"...","tools":"...","roiNote":"..."}, ...5: rebooking, loyalty/at-risk, social content, reviews, upsell sequences],
  "platformIntegrations": [{"platform":"Mindbody|Jane App","bestFor":"...","integrationPath":"...","aiUseCases":"...","monthlyCost":"..."}],
  "recommendedPlatform": "1 paragraph",
  "ftcComplianceNote": "2 paragraphs on FTC health/beauty claims",
  "ftcComplianceChecklist": ["8 checklist items"],
  "implementationRoadmap": "Phase 1-3 over 90 days",
  "roiProjections": "paragraph with 200 clients x $250 x 10% = $50K math",
  "roiHighlights": ["5 ROI bullets"]
}`,
    maxTokens: 5000,
    fallback,
    validate: (v) => Boolean(v.executiveSummary && v.useCases?.length >= 3),
  });

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <WellnessAIReportDocument
      company={company}
      content={content}
      bizType={getWellnessTypeLabel(company, formData)}
      dateStr={dateStr}
    />,
  );
}
