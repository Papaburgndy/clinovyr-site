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
  CONSTRUCTION_AI_SYSTEM,
  OWNER_TIME_INSIGHT,
  PLACER_CONSTRUCTION_INSIGHT,
  buildConstructionContextBlock,
  getContractorTypeLabel,
  recommendProjectManagementTool,
} from "@/lib/deliverables/generators/industries/construction-shared";
import type { AssessmentFormData } from "@/types/assessment";

export type ConstructionUseCase = {
  rank: number;
  name: string;
  description: string;
  tools: string;
};

export type PlatformComparison = {
  platform: string;
  bestFor: string;
  monthlyCost: string;
  strengths: string;
  weaknesses: string;
};

export type ConstructionAIReportContent = {
  executiveSummary: string;
  contractorProblem: string;
  problemStats: string[];
  useCases: ConstructionUseCase[];
  placerCountyContext: string;
  placerHighlights: string[];
  platformRecommendations: PlatformComparison[];
  recommendedPlatform: string;
  decisionMatrix: Array<{
    criterion: string;
    procore: string;
    googleSheets: string;
    buildertrend: string;
  }>;
  implementationPriority: string;
  implementationRoadmap: string;
  roiProjections: string;
  roiHighlights: string[];
};

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

function buildReportFallback(
  company: Company,
  formData: AssessmentFormData | null,
): ConstructionAIReportContent {
  const contractorType = getContractorTypeLabel(company, formData);
  const topDrain = formData?.timeDrainsRanked?.[0] ?? "client communication and bidding";
  const pmTool = recommendProjectManagementTool(company, formData);

  return {
    executiveSummary: `${company.name} is a ${contractorType.toLowerCase()} with ${company.size} team members serving Placer and Sacramento County homeowners and commercial clients. Your assessment highlights ${topDrain.toLowerCase()} as the primary drain on owner time — hours spent on bids, scheduling subs, and writing client updates instead of running jobs and closing new work. This report maps five practical AI use cases in plain language, local market context for Roseville and Granite Bay, and a clear starting point: fix client communication first, then automate bids and sub coordination.`,
    contractorProblem:
      "Most small and mid-size contractors don't lose money on the job site — they lose it in the office. Owners spend evenings writing bid proposals, chasing subs for quotes, and drafting progress emails while active jobs wait for decisions. When three jobs run simultaneously, communication breaks down: clients feel ignored, subs show up on the wrong day, and change orders get verbal approval instead of written sign-off. Every hour on admin is an hour not spent estimating the next $100K remodel or walking a Bosch corridor commercial bid.",
    problemStats: [
      "Average GC owner spends 6–12 hours/week on bids, emails, and scheduling (NAHB small builder survey)",
      "Bid turnaround over 5 days loses 30%+ of residential leads to faster competitors",
      "Client update gaps during Placer County permit waits are the #1 source of negative reviews",
      "Sub coordination errors cost 1–3 days per critical-path delay on typical remodels",
      "Manual bid assembly takes 4–8 hours per proposal; AI-assisted drafts cut that in half",
    ],
    useCases: [
      {
        rank: 1,
        name: "Automated client progress reports",
        description:
          "Every Friday, pull active jobs from Airtable or Google Sheets → Claude drafts a plain-language update with completed work, next week plan, and open items → email to homeowner → log sent. Owner reviews in 5 minutes instead of writing from scratch.",
        tools: "n8n, Claude API, Google Sheets/Airtable, Gmail",
      },
      {
        rank: 2,
        name: "AI-assisted bid scope & proposal drafts",
        description:
          "Paste walkthrough notes and plan summaries → AI breaks scope by trade, flags allowances, drafts client proposal narrative → owner prices and adjusts. Cuts bid prep from 6 hours to 2–3.",
        tools: "Claude, Google Docs, your estimating spreadsheet",
      },
      {
        rank: 3,
        name: "Subcontractor coordination & RFQ automation",
        description:
          "From one scope analysis, generate consistent RFQ emails for each trade with deadlines and insurance requirements. Track responses in Sheets; auto-remind subs 48 hrs before bid due.",
        tools: "Claude, n8n, Google Sheets, email templates",
      },
      {
        rank: 4,
        name: "Lead qualification & fast first response",
        description:
          "Website form → Claude scores lead (timeline, budget, project type) → SMS owner on hot leads → auto-reply to homeowner within 5 minutes → log to CRM. Win jobs before slower GCs respond.",
        tools: "n8n, Claude API, Twilio, HubSpot or Sheets",
      },
      {
        rank: 5,
        name: "Materials tracking & order reminders",
        description:
          "Link job phases to material lead times → automated reminders when to order long-lead items (cabinets, windows) → flag delays before they hit schedule. Reduces 'waiting on materials' downtime.",
        tools: "Google Sheets, n8n schedules, supplier email parsing",
      },
    ],
    placerCountyContext: PLACER_CONSTRUCTION_INSIGHT,
    placerHighlights: [
      "ADU permits in Placer County surged — homeowners want GCs who communicate through 4–8 week plan check waits",
      "Bosch facility and surrounding commercial corridor create subcontractor demand — early sub booking wins bids",
      "Granite Bay / Roseville remodels often run $75K–$250K — one saved owner hour per week = $7,800/year at $150/hr",
      "Competing against owner-operators who respond fast — automation levels the field without hiring office staff",
      "Local permit status updates reduce 'where are we?' calls during inspection hold periods",
    ],
    platformRecommendations: [
      {
        platform: "Procore",
        bestFor: "Mid-size and commercial GCs (21+ employees) with dedicated PM staff",
        monthlyCost: "$375–$1,000+/mo by volume",
        strengths: "Full project lifecycle, sub portals, RFIs, change orders, document control",
        weaknesses: "Overkill for 1–10 person residential remodelers; setup and training overhead",
      },
      {
        platform: "Google Sheets + Drive",
        bestFor: "Owner-operators and small residential GCs (1–20) running 3–8 jobs",
        monthlyCost: "$0–$14/user/mo (Workspace)",
        strengths: "Flexible, everyone knows it, pairs perfectly with n8n + Claude automations",
        weaknesses: "No sub portal, manual discipline required, version control on shared files",
      },
      {
        platform: "Buildertrend / JobTread",
        bestFor: "Growing residential GCs (6–50) wanting client portal and selections",
        monthlyCost: "$299–$899/mo",
        strengths: "Client selections, schedule sharing, photo logs, less complexity than Procore",
        weaknesses: "Monthly cost adds up; still need AI layer for bid drafting and comms",
      },
    ],
    recommendedPlatform:
      pmTool === "Google Sheets"
        ? "Start with Google Sheets job tracker + Drive folders for each project. Add n8n automations for Friday client updates and lead response. Graduate to Buildertrend when you exceed 8 concurrent jobs or clients demand a portal."
        : pmTool === "Procore"
          ? "Keep Procore as system of record; add Claude + n8n for bid drafting, client email narratives, and sub RFQ generation — Procore doesn't write your proposals."
          : `Use ${pmTool} for schedule and client portal; layer AI on top for bids and weekly updates rather than replacing your PM tool.`,
    decisionMatrix: [
      {
        criterion: "Team size fit",
        procore: "21+ employees",
        googleSheets: "1–20 employees",
        buildertrend: "6–50 employees",
      },
      {
        criterion: "Monthly cost",
        procore: "$375–$1,000+",
        googleSheets: "$0–$50",
        buildertrend: "$299–$899",
      },
      {
        criterion: "Client portal",
        procore: "Yes (advanced)",
        googleSheets: "Manual/email",
        buildertrend: "Yes (residential)",
      },
      {
        criterion: "AI automation friendly",
        procore: "API available",
        googleSheets: "Excellent (n8n native)",
        buildertrend: "Moderate",
      },
      {
        criterion: "Bid/proposal support",
        procore: "Limited",
        googleSheets: "Custom + Claude",
        buildertrend: "Estimating add-ons",
      },
      {
        criterion: "Setup time",
        procore: "4–8 weeks",
        googleSheets: "1–3 days",
        buildertrend: "2–4 weeks",
      },
    ],
    implementationPriority:
      "Start with client communication — not bids, not Procore migration. Friday progress emails build trust during permit waits and reduce phone tag. Once that runs automatically, add bid drafting prompts, then lead qualification, then sub RFQ templates. Owners who skip straight to estimating tools often abandon AI because clients still feel in the dark.",
    implementationRoadmap:
      "Phase 1 (Week 1–2): Deploy subcontractor message template kit; launch Friday client update automation; baseline owner admin hours.\nPhase 2 (Week 3–5): Bid assistant prompts in daily workflow; lead auto-reply via n8n; Sheets job tracker standardized.\nPhase 3 (Week 6–12): Sub RFQ automation; materials order reminders; evaluate Buildertrend/Procore if job count grows.",
    roiProjections: OWNER_TIME_INSIGHT,
    roiHighlights: [
      "8 hrs/week owner admin × $150/hr × 52 weeks = $62,400/year recovered capacity",
      "50% bid time reduction on 2 bids/week = 4+ hours saved — one extra bid/month can mean $125K+ job",
      "Friday auto-updates cut 'status call' volume 40–60% on active residential jobs",
      "5-minute lead response vs. 4-hour industry average wins remodel inquiries in Granite Bay",
      "Clinovyr Workflow Automation Sprint ($12K) break-even: typically 1 avoided schedule slip or 1 won bid",
    ],
  };
}

function DecisionMatrixTable({
  rows,
}: {
  rows: ConstructionAIReportContent["decisionMatrix"];
}) {
  return (
    <View>
      <View style={pdfStyles.tableHeader}>
        <Text style={[pdfStyles.tableCellHeader, { flex: 1.3 }]}>Criterion</Text>
        <Text style={pdfStyles.tableCellHeader}>Procore</Text>
        <Text style={pdfStyles.tableCellHeader}>Google Sheets</Text>
        <Text style={[pdfStyles.tableCellHeader, { flex: 1.1 }]}>Buildertrend</Text>
      </View>
      {rows.map((row) => (
        <View key={row.criterion} style={pdfStyles.tableRow}>
          <Text style={[pdfStyles.tableCell, { flex: 1.3, fontFamily: "Helvetica-Bold" }]}>
            {row.criterion}
          </Text>
          <Text style={pdfStyles.tableCell}>{row.procore}</Text>
          <Text style={pdfStyles.tableCell}>{row.googleSheets}</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.1 }]}>{row.buildertrend}</Text>
        </View>
      ))}
    </View>
  );
}

function ConstructionAIReportDocument({
  company,
  content,
  contractorType,
  dateStr,
}: {
  company: Company;
  content: ConstructionAIReportContent;
  contractorType: string;
  dateStr: string;
}) {
  return (
    <Document title={`${company.name} — Construction AI Readiness Report`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr · Intelligence, Applied.</Text>
        <Text style={pdfStyles.coverTitle}>AI Readiness Report</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverSubtitle}>
          {contractorType} · {company.size}
        </Text>
        <Text style={pdfStyles.coverMeta}>Prepared {dateStr}</Text>
        <Text style={[pdfStyles.coverMeta, { marginTop: 32, color: BRAND.cream }]}>
          Plain-language AI strategy for Placer and Sacramento County contractors
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>1. Executive Summary</Text>
        <Paragraphs text={content.executiveSummary} />
        <PdfFooter />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>2. The Contractor&apos;s Real Problem</Text>
        <Paragraphs text={content.contractorProblem} />
        <Text style={pdfStyles.subsectionTitle}>What the data shows</Text>
        {content.problemStats.map((stat) => (
          <View key={stat} style={pdfStyles.checkboxRow}>
            <View style={[pdfStyles.checkbox, { backgroundColor: BRAND.accent }]} />
            <Text style={pdfStyles.body}>{stat}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>3. Top 5 AI Use Cases</Text>
        <Text style={[pdfStyles.muted, { marginBottom: 10 }]}>
          Prioritized for {contractorType.toLowerCase()} · plain language, no buzzwords
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
        <Text style={pdfStyles.sectionTitle}>4. Placer County Context</Text>
        <Paragraphs text={content.placerCountyContext} />
        {content.placerHighlights.map((item) => (
          <View key={item} style={pdfStyles.checkboxRow}>
            <View style={[pdfStyles.checkbox, { backgroundColor: BRAND.gold }]} />
            <Text style={pdfStyles.body}>{item}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>5. Procore vs. Google Sheets (Smaller Contractors)</Text>
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
        <Text style={pdfStyles.sectionTitle}>Platform Decision Matrix</Text>
        <DecisionMatrixTable rows={content.decisionMatrix} />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>6. Implementation Priority</Text>
        <Paragraphs text={content.implementationPriority} />
        <Text style={pdfStyles.subsectionTitle}>90-Day Roadmap</Text>
        <Paragraphs text={content.implementationRoadmap} />
        <View style={pdfStyles.timelinePhase}>
          <Text style={pdfStyles.subsectionTitle}>Week 1 — Client communication first</Text>
          <Text style={pdfStyles.body}>
            • Friday progress email automation · Message template kit for subs · Track owner hours
            saved
          </Text>
        </View>
        <View style={pdfStyles.timelinePhase}>
          <Text style={pdfStyles.subsectionTitle}>Weeks 2–5 — Bids & leads</Text>
          <Text style={pdfStyles.body}>
            • Bid assistant prompts in workflow · Lead auto-reply · Standardize job tracker
          </Text>
        </View>
        <View style={pdfStyles.timelinePhase}>
          <Text style={pdfStyles.subsectionTitle}>Weeks 6–12 — Scale</Text>
          <Text style={pdfStyles.body}>
            • Sub RFQ automation · Materials reminders · Evaluate PM platform upgrade if needed
          </Text>
        </View>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>7. ROI Projections</Text>
        <Paragraphs text={content.roiProjections} />
        {content.roiHighlights.map((item) => (
          <View key={item} style={pdfStyles.checkboxRow}>
            <View style={[pdfStyles.checkbox, { backgroundColor: BRAND.gold }]} />
            <Text style={pdfStyles.body}>{item}</Text>
          </View>
        ))}
        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Clinovyr implements AI for Placer and Sacramento County contractors — starting with the communication
            workflows that protect your reputation. clinovyr@gmail.com · clinovyr.com
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export async function renderConstructionAIReportPdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const fallback = buildReportFallback(company, formData);
  const context = buildConstructionContextBlock(company, survey, formData);

  const { data: content } = await callClaudeJson<ConstructionAIReportContent>({
    system: CONSTRUCTION_AI_SYSTEM,
    prompt: `${context}

Output ONLY valid JSON matching this structure:
{
  "executiveSummary": "2-3 paragraphs plain language",
  "contractorProblem": "2 paragraphs on bids, scheduling, communication drains",
  "problemStats": ["5 bullet stats"],
  "useCases": [{"rank":1,"name":"...","description":"...","tools":"..."}, ...5 items: bid estimation, sub coordination, progress reports, lead qual, materials tracking],
  "placerCountyContext": "2 paragraphs on ADU boom, Bosch, permit timelines",
  "placerHighlights": ["5 local bullets"],
  "platformRecommendations": [{"platform":"Procore|Google Sheets|Buildertrend","bestFor":"...","monthlyCost":"...","strengths":"...","weaknesses":"..."}],
  "recommendedPlatform": "1 paragraph for this company size",
  "decisionMatrix": [{"criterion":"...","procore":"...","googleSheets":"...","buildertrend":"..."}, ...6 rows],
  "implementationPriority": "1-2 paragraphs — client communication FIRST",
  "implementationRoadmap": "Phase 1-3 over 90 days",
  "roiProjections": "paragraph with $150/hr owner time math",
  "roiHighlights": ["5 ROI bullets including $62,400/year for 8 hrs/week"]
}`,
    maxTokens: 4500,
    fallback,
    validate: (v) => Boolean(v.executiveSummary && v.useCases?.length >= 3),
  });

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <ConstructionAIReportDocument
      company={company}
      content={content}
      contractorType={getContractorTypeLabel(company, formData)}
      dateStr={dateStr}
    />,
  );
}
