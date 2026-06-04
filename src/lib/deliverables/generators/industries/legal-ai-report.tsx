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
  BILLING_HOURS_INSIGHT,
  LEGAL_AI_SYSTEM,
  buildLegalContextBlock,
  getFirmTypeLabel,
  isRiaContext,
} from "@/lib/deliverables/generators/industries/legal-shared";
import type { AssessmentFormData } from "@/types/assessment";

export type LegalUseCase = {
  rank: number;
  name: string;
  description: string;
  tools: string;
  guardrails: string[];
};

export type LegalToolRecommendation = {
  useCase: string;
  tools: string;
  ethicsCompatibility: string;
};

export type LegalAIReportContent = {
  executiveSummary: string;
  aiAndPracticeOfLaw: string;
  abaGuidance: string[];
  californiaBarGuidance: string[];
  billingHoursProblem: string;
  billingStats: string[];
  useCases: LegalUseCase[];
  toolRecommendations: LegalToolRecommendation[];
  implementationRoadmap: string;
  roiProjections: string;
  roiHighlights: string[];
};

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\n+/).map((para) => (
        <Text key={para.slice(0, 40)} style={[pdfStyles.body, { marginBottom: 8 }]}>
          {para.trim()}
        </Text>
      ))}
    </>
  );
}

function buildReportFallback(
  company: Company,
  formData: AssessmentFormData | null,
): LegalAIReportContent {
  const firmType = getFirmTypeLabel(company, formData);
  const topDrain = formData?.timeDrainsRanked?.[0] ?? "client intake and admin";
  const rate = formData ? (formData.revenue?.includes("500") ? 550 : 400) : 400;
  const ria = isRiaContext(company, formData);

  return {
    executiveSummary: `${company.name} is a ${firmType.toLowerCase()} with ${company.size} team members serving clients in California. Your assessment identifies ${topDrain.toLowerCase()} as the primary non-billable drain — time that cannot be invoiced at your $${rate}+ hourly rates. California attorneys face a dual mandate: adopt technology to remain competitive (ABA Model Rule 1.1 comment on competence) while maintaining strict confidentiality and supervision standards (Rules 1.6 and 5.3). This report maps five high-ROI, ethics-compatible AI use cases with guardrails for each, plus tool recommendations aligned with State Bar guidance.`,
    aiAndPracticeOfLaw:
      "Artificial intelligence is not a substitute for legal judgment — but refusing to use vetted AI tools for administrative and drafting workflows may itself raise competence questions. The ABA has issued formal guidance that lawyers must understand the benefits and risks of relevant technology. California State Bar ethics opinions emphasize that attorneys remain responsible for all work product, must preserve confidentiality when using third-party tools, and must disclose AI use to clients when material to the representation.",
    abaGuidance: [
      "Model Rule 1.1 (Competence): Lawyers should understand technology they use, including AI limitations",
      "Model Rule 1.6 (Confidentiality): Client data in AI tools requires reasonable security and vendor vetting",
      "Model Rule 5.3 (Supervision): Nonlawyer assistants — including AI — require attorney oversight",
      "ABA Formal Opinion 512 (2024): Generative AI — billing, confidentiality, and communication duties",
      "ABA guidance: Verify AI-generated citations; do not bill for AI time as if it were attorney time without disclosure",
    ],
    californiaBarGuidance: [
      "State Bar Practical Guidance: Attorney responsibility for AI-generated content remains with the lawyer",
      "Confidentiality: Evaluate whether AI vendor terms prohibit training on client data and require encryption",
      "Fee agreements: Disclose if AI reduces costs in ways material to the fee arrangement",
      "Advertising: AI-generated marketing content must comply with Rules 7.1–7.5 (truthfulness)",
      "Trust accounting: AI does not replace compliance with Rules 1.15 and 1.15A (IOLTA)",
    ],
    billingHoursProblem:
      "Law firm economics depend on converting attorney time to billable hours. Yet partners and associates routinely lose 8–15 hours per week to intake processing, client status updates, billing narrative writing, and administrative coordination — work that cannot be billed at $300–$600/hr. At a conservative 5 non-billable hours weekly, a single attorney forfeits $78,000–$156,000 in annual billable capacity. Multiply across your team and the revenue gap becomes existential.",
    billingStats: [
      "Average small-firm attorney: 1,700 billable hours/year target; 60–70% realization is common",
      "Non-billable admin consumes 30–40% of attorney time in firms without automation (Clio Legal Trends)",
      "Intake-to-consultation cycle: 3–5 hours of unbillable work per new matter without automation",
      "Billing narrative entry: 15–20 min/day per attorney at month-end crunch",
      "Client status requests: 5–10 emails/week per active matter handled manually",
    ],
    useCases: [
      {
        rank: 1,
        name: "Automated client intake & matter summarization",
        description:
          "Typeform/JotForm → Zapier → Claude summarizes intake → conflict pre-screen flags → Clio matter draft → attorney routing by practice area. Reduces intake from 45 min to 10 min attorney review.",
        tools: "Clio, Typeform, Zapier, Claude API (Enterprise)",
        guardrails: [
          "Attorney reviews every summary before client contact",
          "Formal conflict check in Clio — AI pre-screen is supplemental only",
          "No privileged details in consumer AI tools without confidentiality agreement",
        ],
      },
      {
        rank: 2,
        name: "First-draft document generation",
        description:
          "Engagement letters, demand letters, discovery requests, and correspondence first drafts from structured prompts. Attorney edits, verifies citations, and approves before delivery.",
        tools: "Claude, Microsoft Copilot (M365), Harvey (enterprise), Spellbook",
        guardrails: [
          "Mark all AI drafts as DRAFT — attorney review required",
          "Verify every citation against primary sources",
          "Do not file AI-generated pleadings without line-by-line review",
        ],
      },
      {
        rank: 3,
        name: "Time entry & billing narrative automation",
        description:
          "End-of-day notes → Claude formats UTBMS narratives → Clio time entry suggestions. Cuts billing admin by 60% and improves realization through timely entry.",
        tools: "Clio, Claude, TimeSolv/Bill4Time integrations",
        guardrails: [
          "Attorney certifies accuracy of all billable time",
          "Do not inflate hours — AI suggests, attorney confirms",
          "Separate billable vs. non-billable flags in review step",
        ],
      },
      {
        rank: 4,
        name: "Client communication drafts",
        description:
          "Status updates, FAQ responses, retainer notices, and closing letters drafted from matter notes. Paralegal or attorney reviews before send; logged in practice management system.",
        tools: "Clio, Claude, firm email templates",
        guardrails: [
          "Model Rule 1.4 — material developments require attorney judgment",
          "No strategy disclosure client should not see",
          "Privilege review before any external send",
        ],
      },
      {
        rank: 5,
        name: "Legal research summarization",
        description:
          "Internal memo drafts from Westlaw/Lexis excerpts. AI organizes issue, rule, application structure — attorney verifies all citations and analysis before reliance.",
        tools: "Claude, Westlaw Precision AI, Lexis+ AI, CoCounsel",
        guardrails: [
          "Never cite a case without reading it — AI hallucinates citations",
          "Shepardize/KeyCite all authorities",
          "Label output as draft research memo, not legal advice",
        ],
      },
    ],
    toolRecommendations: [
      {
        useCase: "Practice management + intake",
        tools: "Clio Manage + Clio Grow",
        ethicsCompatibility:
          "SOC 2 certified; widely used in CA firms. Pair with Zapier for AI layer. Verify DPA covers AI subprocessors.",
      },
      {
        useCase: "Enterprise AI drafting",
        tools: "Claude for Enterprise, Harvey, Microsoft Copilot",
        ethicsCompatibility:
          "Enterprise tiers offer no-training-on-data and BAAs. Required for any client-confidential content.",
      },
      {
        useCase: "Legal-specific AI research",
        tools: "Westlaw Precision AI, Lexis+ AI, CoCounsel",
        ethicsCompatibility:
          "Built on verified legal databases — lower hallucination risk than general LLMs for citations.",
      },
      {
        useCase: "Workflow automation",
        tools: "Zapier, Make.com",
        ethicsCompatibility:
          "Connects approved tools only. Map data flows; avoid routing privileged content to unapproved endpoints.",
      },
      {
        useCase: "Contract analysis",
        tools: "Spellbook, Ironclad (if in-house)",
        ethicsCompatibility:
          "Attorney review required. Suitable for first-pass clause identification, not final advice.",
      },
    ],
    implementationRoadmap:
      "Phase 1 (Weeks 1–2): Ethics policy draft, vendor review, intake automation pilot on one practice area. Phase 2 (Weeks 3–6): Prompt library rollout, time entry workflow, staff training on approved tools. Phase 3 (Weeks 7–12): Document drafting templates, research memo workflow, ROI measurement against billable hour recovery.",
    roiProjections: ria
      ? "For RIAs, recovered advisor time translates to additional client-facing hours and AUM growth. At $400/hr equivalent advisory time, recovering 5 hours/week yields $104,000 in annual capacity — before counting improved client retention from faster response times."
      : `For ${company.name}, recovering 5 non-billable hours per attorney weekly at $${rate}/hr yields $${(rate * 5 * 52).toLocaleString()} per attorney annually. ${BILLING_HOURS_INSIGHT}`,
    roiHighlights: [
      "Intake automation: 30–35 min saved per new matter",
      "Billing narratives: 15–20 min saved daily per attorney",
      "Status updates: 10 min saved per active matter weekly",
      "Research memos: 30–45 min saved per issue (with citation verification)",
      "First drafts: 1–2 hours saved per document (attorney edit time still required)",
    ],
  };
}

function LegalAIReportDocument({
  company,
  content,
  firmType,
  dateStr,
  ria,
}: {
  company: Company;
  content: LegalAIReportContent;
  firmType: string;
  dateStr: string;
  ria: boolean;
}) {
  return (
    <Document title={`${company.name} — Legal AI Readiness Report`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr · Intelligence, Applied.</Text>
        <Text style={pdfStyles.coverTitle}>AI Readiness Report</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverSubtitle}>
          {firmType} · {company.size}
        </Text>
        <Text style={pdfStyles.coverMeta}>Prepared {dateStr}</Text>
        <Text style={[pdfStyles.coverMeta, { marginTop: 32, color: BRAND.cream }]}>
          {ria
            ? "Compliance-aware AI strategy for RIAs & legal practices"
            : "Ethics-aware AI strategy for California law firms"}
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>1. Executive Summary</Text>
        <Paragraphs text={content.executiveSummary} />
        <PdfFooter />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>2. AI and the Practice of Law</Text>
        <Paragraphs text={content.aiAndPracticeOfLaw} />
        <Text style={pdfStyles.subsectionTitle}>ABA Guidance Highlights</Text>
        {content.abaGuidance.map((item) => (
          <View key={item} style={pdfStyles.checkboxRow}>
            <View style={[pdfStyles.checkbox, { backgroundColor: BRAND.accent }]} />
            <Text style={pdfStyles.body}>{item}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.subsectionTitle}>California State Bar Considerations</Text>
        {content.californiaBarGuidance.map((item) => (
          <View key={item} style={pdfStyles.checkboxRow}>
            <View style={pdfStyles.checkbox} />
            <Text style={pdfStyles.body}>{item}</Text>
          </View>
        ))}
        <Text style={[pdfStyles.muted, { marginTop: 10 }]}>
          Consult California State Bar ethics hotline or your malpractice carrier before deploying AI
          on client-confidential workflows.
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>3. The Billing Hours Problem</Text>
        <Paragraphs text={content.billingHoursProblem} />
        <Text style={pdfStyles.subsectionTitle}>Industry benchmarks</Text>
        {content.billingStats.map((stat) => (
          <View key={stat} style={pdfStyles.checkboxRow}>
            <View style={[pdfStyles.checkbox, { backgroundColor: BRAND.gold }]} />
            <Text style={pdfStyles.body}>{stat}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>4. Top 5 Safe AI Use Cases</Text>
        <Text style={[pdfStyles.muted, { marginBottom: 10 }]}>
          Prioritized for {firmType.toLowerCase()} · each includes ethical guardrails
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
        <Text style={pdfStyles.sectionTitle}>5. Ethical Guardrails by Use Case</Text>
        {content.useCases.slice(0, 5).map((uc) => (
          <View key={`g-${uc.name}`} style={[pdfStyles.card, { marginBottom: 8 }]}>
            <Text style={pdfStyles.cardTitle}>{uc.name}</Text>
            {uc.guardrails.map((g) => (
              <View key={g} style={pdfStyles.checkboxRow}>
                <Text style={[pdfStyles.body, { color: BRAND.accent }]}>⚖</Text>
                <Text style={[pdfStyles.body, { flex: 1, fontSize: 9 }]}>{g}</Text>
              </View>
            ))}
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>6. Tool Recommendations</Text>
        <Text style={[pdfStyles.muted, { marginBottom: 8 }]}>
          Bar ethics compatibility notes — verify vendor DPAs before client data flows
        </Text>
        <View style={pdfStyles.tableHeader}>
          <Text style={[pdfStyles.tableCellHeader, { flex: 1.1 }]}>Use case</Text>
          <Text style={[pdfStyles.tableCellHeader, { flex: 1 }]}>Tools</Text>
          <Text style={pdfStyles.tableCellHeader}>Ethics compatibility</Text>
        </View>
        {content.toolRecommendations.map((row) => (
          <View key={row.useCase} style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { flex: 1.1 }]}>{row.useCase}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{row.tools}</Text>
            <Text style={pdfStyles.tableCell}>{row.ethicsCompatibility}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>7. Implementation Roadmap</Text>
        <Paragraphs text={content.implementationRoadmap} />
        <View style={pdfStyles.timelinePhase}>
          <Text style={pdfStyles.subsectionTitle}>Quick wins (Week 1)</Text>
          <Text style={pdfStyles.body}>
            • Approve AI ethics policy draft · Deploy intake summarization pilot · Distribute prompt
            library · Baseline non-billable hours metric
          </Text>
        </View>
        <View style={pdfStyles.timelinePhase}>
          <Text style={pdfStyles.subsectionTitle}>Foundation (Weeks 2–6)</Text>
          <Text style={pdfStyles.body}>
            • Time entry automation · Client status templates · Staff training on approved tools ·
            Vendor DPA review
          </Text>
        </View>
        <View style={pdfStyles.timelinePhase}>
          <Text style={pdfStyles.subsectionTitle}>Scale (Weeks 7–12)</Text>
          <Text style={pdfStyles.body}>
            • Document drafting workflows · Research memo process · Billable hour recovery tracking ·
            Ethics counsel review
          </Text>
        </View>
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
            Clinovyr implements ethics-aware AI automations for California law firms and RIAs.
            Recover billable hours without compromising client confidentiality. clinovyr@gmail.com ·
            clinovyr.com
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export async function renderLegalAIReportPdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const fallback = buildReportFallback(company, formData);
  const context = buildLegalContextBlock(company, survey, formData);
  const ria = isRiaContext(company, formData);

  const { data: content } = await callClaudeJson<LegalAIReportContent>({
    system: LEGAL_AI_SYSTEM,
    prompt: `${context}

Output ONLY valid JSON:
{
  "executiveSummary": "2-3 paragraphs",
  "aiAndPracticeOfLaw": "2 paragraphs on ABA and CA State Bar",
  "abaGuidance": ["5 ABA/ethics bullet points"],
  "californiaBarGuidance": ["5 CA State Bar points"],
  "billingHoursProblem": "2 paragraphs on $300-600/hr and non-billable admin",
  "billingStats": ["5 industry stats"],
  "useCases": [{"rank":1,"name":"...","description":"...","tools":"...","guardrails":["...","...","..."]}, ...5 items: intake, first-draft docs, time entry, client comms, research summarization],
  "toolRecommendations": [{"useCase":"...","tools":"...","ethicsCompatibility":"..."}, ...5 rows],
  "implementationRoadmap": "3 phases over 90 days",
  "roiProjections": "paragraph with billable hour math",
  "roiHighlights": ["5 ROI bullets"]
}
${ria ? "Include SEC/RIA compliance notes where relevant." : "Focus on law firm ethics."}`,
    maxTokens: 5000,
    fallback,
    validate: (v) => Boolean(v.executiveSummary && v.useCases?.length >= 3),
  });

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <LegalAIReportDocument
      company={company}
      content={content}
      firmType={getFirmTypeLabel(company, formData)}
      dateStr={dateStr}
      ria={ria}
    />,
  );
}
