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
  PLACER_COMMISSION_INSIGHT,
  REAL_ESTATE_AI_SYSTEM,
  buildRealEstateContextBlock,
  getBrokerageTypeLabel,
} from "@/lib/deliverables/generators/industries/real-estate-shared";
import type { AssessmentFormData } from "@/types/assessment";

export type RealEstateUseCase = {
  rank: number;
  name: string;
  description: string;
  tools: string;
};

export type PlatformRecommendation = {
  platform: string;
  bestFor: string;
  monthlyCost: string;
  strengths: string;
  weaknesses: string;
};

export type RealEstateAIReportContent = {
  executiveSummary: string;
  leadResponseProblem: string;
  leadResponseStats: string[];
  useCases: RealEstateUseCase[];
  platformRecommendations: PlatformRecommendation[];
  recommendedPlatform: string;
  decisionMatrix: Array<{
    criterion: string;
    goHighLevel: string;
    hubSpot: string;
    followUpBoss: string;
  }>;
  implementationRoadmap: string;
  roiProjections: string;
  roiHighlights: string[];
};

function buildReportFallback(
  company: Company,
  formData: AssessmentFormData | null,
): RealEstateAIReportContent {
  const brokerage = getBrokerageTypeLabel(company, formData);
  const topDrain = formData?.timeDrainsRanked?.[0] ?? "customer follow-up";
  const crm = formData?.crm?.join(", ") ?? "your CRM";

  return {
    executiveSummary: `${company.name} is a ${brokerage.toLowerCase()} serving Placer County buyers and sellers with ${crm}. With ${company.size} team members, your assessment highlights ${topDrain.toLowerCase()} as the primary operational drain — especially the gap between inbound lead volume and consistent, fast follow-up. Agents in Roseville and Granite Bay markets compete on response time as much as on pricing expertise; AI-assisted qualification, listing copy, and nurture sequences can recover 8–15 hours per agent per week while improving conversion on $750K+ transactions.`,
    leadResponseProblem:
      "Industry data shows that responding to a Zillow or Realtor.com lead within 5 minutes increases contact rates by up to 400% compared to a 30-minute delay. Yet most brokerages still rely on manual inbox checks, shared team inboxes, and ad-hoc texting — meaning hot buyers and sellers in Rocklin, Lincoln, and Granite Bay often hear from a competitor first. Every hour of delay on a qualified Placer County lead represents thousands in potential GCI walking out the door.",
    leadResponseStats: [
      "78% of buyers work with the first agent who responds meaningfully (NAR consumer research)",
      "Average agent response time to online leads: 4+ hours (industry benchmark)",
      "5-minute response window: up to 21× higher qualification rate vs. 30+ minutes",
      "Placer County median DOM: competitive listings require same-day follow-up on showing requests",
      "Teams without automated lead routing lose 15–25% of paid portal leads to slow handoffs",
    ],
    useCases: [
      {
        rank: 1,
        name: "AI lead qualifier & instant response",
        description:
          "Webhook from Zillow/Realtor.com → Claude scores intent (timeline, budget, motivation) → SMS auto-reply within 60 seconds → CRM task for agent → drip for unresponsive leads. Routes hot buyers to on-call agent via Slack/SMS.",
        tools: "Make.com, Claude API, Twilio, GoHighLevel or Follow Up Boss",
      },
      {
        rank: 2,
        name: "MLS listing description generator",
        description:
          "Google Form or MLS draft intake → Claude produces 3 Fair Housing-compliant variations (luxury, family, investor angles) → agent picks/edits → paste to MLS. Cuts listing launch time from 45 min to 10 min.",
        tools: "Claude, Google Forms, Make.com, Buffer for social snippets",
      },
      {
        rank: 3,
        name: "Automated drip & nurture campaigns",
        description:
          "Behavior-triggered sequences: viewed 3 listings in price band → market update; open house attendee → 7-day follow-up; past client → 11-month home anniversary + referral ask.",
        tools: "GoHighLevel, ActivePipe, or HubSpot workflows + Claude personalization",
      },
      {
        rank: 4,
        name: "Transaction coordinator co-pilot",
        description:
          "Parse contract dates from uploaded docs → milestone timeline → automated reminders to agents, clients, and lenders → draft status update emails for TC review. Reduces missed contingency deadlines.",
        tools: "Dotloop/SkySlope webhooks, Make.com, Claude, Google Sheets tracker",
      },
      {
        rank: 5,
        name: "Neighborhood market reports",
        description:
          "Monthly pull of MLS stats by ZIP → Claude narrative for sphere email and social → branded PDF for listing appointments. Positions agents as local market experts in Granite Bay and Roseville.",
        tools: "MLS export, Claude, Canva template, Mailchimp or GHL email",
      },
    ],
    platformRecommendations: [
      {
        platform: "GoHighLevel",
        bestFor: "Large teams (21+ agents) needing all-in-one CRM, SMS, funnels, and white-label",
        monthlyCost: "$97–$497/mo (agency tiers)",
        strengths: "Built-in SMS, pipelines, automations, landing pages, reputation management",
        weaknesses: "Steeper learning curve; overkill for solo agents",
      },
      {
        platform: "HubSpot",
        bestFor: "Small teams (1–20) starting CRM discipline with strong email marketing",
        monthlyCost: "Free–$800/mo (Sales Hub Starter+)",
        strengths: "Excellent email, forms, deal pipeline, free tier to start",
        weaknesses: "SMS and advanced automation require integrations; not built for real estate out of box",
      },
      {
        platform: "Follow Up Boss",
        bestFor: "Established teams (6–50 agents) focused on lead aggregation and agent accountability",
        monthlyCost: "$69–$1,000+/mo by team size",
        strengths: "Best-in-class lead routing from Zillow, Realtor.com, Ylopo; agent activity tracking",
        weaknesses: "Limited marketing automation vs. GHL; add Make.com for AI layers",
      },
    ],
    recommendedPlatform:
      company.size === "1–5" || company.size === "6–20"
        ? "HubSpot for CRM foundation + Make.com for AI lead response, graduating to Follow Up Boss as lead volume grows"
        : company.size === "21–50"
          ? "Follow Up Boss for lead routing + Make.com/Claude for qualification and nurture"
          : "GoHighLevel as primary platform with Make.com integrations for MLS and transaction workflows",
    decisionMatrix: [
      {
        criterion: "Lead routing (portals)",
        goHighLevel: "Good (integrations)",
        hubSpot: "Manual / Zapier",
        followUpBoss: "Excellent (native)",
      },
      {
        criterion: "SMS automation",
        goHighLevel: "Excellent (built-in)",
        hubSpot: "Add-on needed",
        followUpBoss: "Good (integrated)",
      },
      {
        criterion: "Ease of setup",
        goHighLevel: "Moderate",
        hubSpot: "Easy",
        followUpBoss: "Easy",
      },
      {
        criterion: "All-in-one marketing",
        goHighLevel: "Excellent",
        hubSpot: "Good (email focus)",
        followUpBoss: "Limited",
      },
      {
        criterion: "Team size fit",
        goHighLevel: "21+ agents",
        hubSpot: "1–20 agents",
        followUpBoss: "6–50 agents",
      },
      {
        criterion: "Monthly cost (team)",
        goHighLevel: "$297–$497",
        hubSpot: "$0–$450",
        followUpBoss: "$400–$800",
      },
    ],
    implementationRoadmap:
      "Phase 1 (Days 1–14): Audit lead sources, connect portal feeds to CRM, deploy instant SMS auto-reply on new leads, train agents on AI prompt library.\nPhase 2 (Days 15–45): Launch listing description workflow, build 3 nurture sequences (buyer, seller, sphere), implement lead scoring in Make.com.\nPhase 3 (Days 46–90): Transaction milestone tracker, monthly market report automation, KPI dashboard (response time, conversion, GCI per lead source).",
    roiProjections: PLACER_COMMISSION_INSIGHT,
    roiHighlights: [
      "One extra close per agent per quarter at $900K median = ~$22,500 GCI",
      "5-minute lead response can recover 2–4 additional transactions per year on a 10-agent team",
      "Listing description automation saves 3–5 hours/week across the team",
      "TC co-pilot reduces missed deadline risk (avg cost of blown contingency: $5K–$15K)",
      "Clinovyr Workflow Automation Sprint ($12K) break-even: typically 1 additional close within 6 months",
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

function DecisionMatrixTable({
  rows,
}: {
  rows: RealEstateAIReportContent["decisionMatrix"];
}) {
  return (
    <View>
      <View style={pdfStyles.tableHeader}>
        <Text style={[pdfStyles.tableCellHeader, { flex: 1.4 }]}>Criterion</Text>
        <Text style={pdfStyles.tableCellHeader}>GoHighLevel</Text>
        <Text style={pdfStyles.tableCellHeader}>HubSpot</Text>
        <Text style={[pdfStyles.tableCellHeader, { flex: 1.1 }]}>Follow Up Boss</Text>
      </View>
      {rows.map((row) => (
        <View key={row.criterion} style={pdfStyles.tableRow}>
          <Text style={[pdfStyles.tableCell, { flex: 1.4, fontFamily: "Helvetica-Bold" }]}>
            {row.criterion}
          </Text>
          <Text style={pdfStyles.tableCell}>{row.goHighLevel}</Text>
          <Text style={pdfStyles.tableCell}>{row.hubSpot}</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.1 }]}>{row.followUpBoss}</Text>
        </View>
      ))}
    </View>
  );
}

function RealEstateAIReportDocument({
  company,
  content,
  brokerageType,
  dateStr,
}: {
  company: Company;
  content: RealEstateAIReportContent;
  brokerageType: string;
  dateStr: string;
}) {
  return (
    <Document title={`${company.name} — Real Estate AI Readiness Report`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr · Intelligence, Applied.</Text>
        <Text style={pdfStyles.coverTitle}>AI Readiness Report</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverSubtitle}>
          {brokerageType} · {company.size}
        </Text>
        <Text style={pdfStyles.coverMeta}>Prepared {dateStr}</Text>
        <Text style={[pdfStyles.coverMeta, { marginTop: 32, color: BRAND.cream }]}>
          Real estate AI strategy for Placer County teams
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>1. Executive Summary</Text>
        <Paragraphs text={content.executiveSummary} />
        <Text style={[pdfStyles.muted, { marginTop: 12 }]}>
          Market context: Roseville, Granite Bay, Rocklin · Team size and brokerage type inform
          recommendations below.
        </Text>
        <PdfFooter />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>2. The Lead Response Problem</Text>
        <Paragraphs text={content.leadResponseProblem} />
        <Text style={pdfStyles.subsectionTitle}>Why speed wins in Placer County</Text>
        {content.leadResponseStats.map((stat) => (
          <View key={stat} style={pdfStyles.checkboxRow}>
            <View style={[pdfStyles.checkbox, { backgroundColor: BRAND.accent }]} />
            <Text style={pdfStyles.body}>{stat}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>3. Top 5 AI Use Cases</Text>
        <Text style={[pdfStyles.muted, { marginBottom: 10 }]}>
          Tailored for {brokerageType.toLowerCase()} · prioritized by ROI and implementation speed
        </Text>
        {content.useCases.slice(0, 5).map((uc) => (
          <View key={uc.name} style={pdfStyles.card}>
            <Text style={pdfStyles.cardTitle}>
              #{uc.rank} — {uc.name}
            </Text>
            <Paragraphs text={uc.description} />
            <Text style={pdfStyles.muted}>Tools: {uc.tools}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>4. Platform Recommendations</Text>
        {content.platformRecommendations.map((p) => (
          <View key={p.platform} style={pdfStyles.card}>
            <Text style={pdfStyles.cardTitle}>{p.platform}</Text>
            <Text style={pdfStyles.body}>Best for: {p.bestFor}</Text>
            <Text style={pdfStyles.muted}>
              Cost: {p.monthlyCost} · Strengths: {p.strengths}
            </Text>
            <Text style={pdfStyles.muted}>Watch out: {p.weaknesses}</Text>
          </View>
        ))}
        <Text style={pdfStyles.subsectionTitle}>Clinovyr recommendation</Text>
        <Paragraphs text={content.recommendedPlatform} />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>CRM Decision Matrix</Text>
        <DecisionMatrixTable rows={content.decisionMatrix} />
        <Text style={[pdfStyles.muted, { marginTop: 10 }]}>
          Compare platforms against your current stack before migrating. Most teams keep{" "}
          {company.name}&apos;s existing tools during a 90-day transition.
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>5. Implementation Roadmap</Text>
        <Paragraphs text={content.implementationRoadmap} />
        <View style={pdfStyles.timelinePhase}>
          <Text style={pdfStyles.subsectionTitle}>Quick wins (Week 1)</Text>
          <Text style={pdfStyles.body}>
            • Connect lead sources to CRM · Deploy 60-second auto-reply · Share prompt library with
            agents · Baseline response-time metric
          </Text>
        </View>
        <View style={pdfStyles.timelinePhase}>
          <Text style={pdfStyles.subsectionTitle}>Foundation (Weeks 2–6)</Text>
          <Text style={pdfStyles.body}>
            • Listing description workflow · Lead scoring automation · 3 nurture sequences live
          </Text>
        </View>
        <View style={pdfStyles.timelinePhase}>
          <Text style={pdfStyles.subsectionTitle}>Scale (Weeks 7–12)</Text>
          <Text style={pdfStyles.body}>
            • Transaction tracker · Market report automation · Team KPI dashboard · Agent coaching on
            AI tools
          </Text>
        </View>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>6. ROI Projections</Text>
        <Paragraphs text={content.roiProjections} />
        {content.roiHighlights.map((item) => (
          <View key={item} style={pdfStyles.checkboxRow}>
            <View style={[pdfStyles.checkbox, { backgroundColor: BRAND.gold }]} />
            <Text style={pdfStyles.body}>{item}</Text>
          </View>
        ))}
        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Clinovyr implements AI automations for Placer County real estate teams. One additional
            close funds the investment — we help you get there faster. clinovyr@gmail.com ·
            clinovyr.com
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export async function renderRealEstateAIReportPdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const fallback = buildReportFallback(company, formData);
  const context = buildRealEstateContextBlock(company, survey, formData);

  const { data: content } = await callClaudeJson<RealEstateAIReportContent>({
    system: REAL_ESTATE_AI_SYSTEM,
    prompt: `${context}

Output ONLY valid JSON matching this structure:
{
  "executiveSummary": "2-3 paragraphs referencing team size and brokerage type",
  "leadResponseProblem": "2 paragraphs on response time and conversion",
  "leadResponseStats": ["5 bullet stats"],
  "useCases": [{"rank":1,"name":"...","description":"...","tools":"..."}, ...5 items: lead qualifier, MLS descriptions, drip campaigns, transaction coordinator, market reports],
  "platformRecommendations": [{"platform":"GoHighLevel|HubSpot|Follow Up Boss","bestFor":"...","monthlyCost":"...","strengths":"...","weaknesses":"..."}],
  "recommendedPlatform": "1 paragraph recommendation",
  "decisionMatrix": [{"criterion":"...","goHighLevel":"...","hubSpot":"...","followUpBoss":"..."}, ...6 rows],
  "implementationRoadmap": "Phase 1-3 over 90 days",
  "roiProjections": "paragraph with Placer County commission math",
  "roiHighlights": ["5 bullet ROI points"]
}`,
    maxTokens: 4500,
    fallback,
    validate: (v) => Boolean(v.executiveSummary && v.useCases?.length >= 3),
  });

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <RealEstateAIReportDocument
      company={company}
      content={content}
      brokerageType={getBrokerageTypeLabel(company, formData)}
      dateStr={dateStr}
    />,
  );
}
