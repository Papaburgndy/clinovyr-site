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
  MEDICAL_AI_SYSTEM,
  buildMedicalContextBlock,
  getPracticeTypeLabel,
} from "@/lib/deliverables/generators/industries/medical-shared";
import type { AssessmentFormData } from "@/types/assessment";

export type MedicalUseCase = {
  rank: number;
  name: string;
  description: string;
  tools: string;
};

export type MedicalAIReportContent = {
  executiveSummary: string;
  hipaaPrinciples: string[];
  hipaaNarrative: string;
  currentState: string;
  useCases: MedicalUseCase[];
  toolRecommendations: Array<{ useCase: string; tools: string; notes: string }>;
  priorityMatrix: Array<{
    name: string;
    roi: "high" | "low";
    complexity: "high" | "low";
  }>;
  timeline90Day: string;
  successMetrics: string[];
};

function buildReportFallback(
  company: Company,
  formData: AssessmentFormData | null,
): MedicalAIReportContent {
  const practice = getPracticeTypeLabel(company, formData);
  const topDrain = formData?.timeDrainsRanked?.[0] ?? "appointment scheduling";
  const scheduling = formData?.scheduling?.join(", ") ?? "practice management software";

  return {
    executiveSummary: `${company.name} is a ${practice.toLowerCase()} with ${company.size} team members. Your assessment highlights ${topDrain.toLowerCase()} as the primary operational drain. With disciplined, HIPAA-aware automation, you can recover front-desk capacity, reduce no-shows, and improve patient experience without replacing your EHR. Clinovyr recommends a phased 90-day rollout starting with appointment reminders and expanding to intake and recall workflows.`,
    hipaaPrinciples: [
      "Minimum necessary: only send the patient data required for each automated message.",
      "Business Associate Agreements: any vendor that stores or transmits PHI must sign a BAA.",
      "Human oversight: staff review AI drafts for clinical or billing content before sending.",
    ],
    hipaaNarrative:
      "Before implementing AI that touches scheduling, intake, or follow-up data, confirm BAAs with your EHR, SMS, forms, and automation vendors. Consumer ChatGPT accounts are not HIPAA-compliant for PHI. Use HIPAA-eligible tiers (Twilio Healthcare, Jotform Enterprise with BAA, Anthropic via approved channels) and document your risk analysis.",
    currentState: `Your stack includes ${scheduling} for scheduling and ranked time drains led by ${topDrain}. AI comfort is ${formData?.comfortLevel ?? "moderate"}/10 with concern around ${formData?.biggestConcern ?? "security and adoption"}. This profile suits high-ROI administrative automations before clinical documentation AI.`,
    useCases: [
      {
        rank: 1,
        name: "Automated appointment reminders",
        description:
          "Twilio SMS sequences at 72h, 24h, and 2h before visits integrated with your practice management system. Typical no-show reduction 20–35%.",
        tools: "Twilio (BAA), Make.com, PMS webhook",
      },
      {
        rank: 2,
        name: "AI-powered patient intake",
        description:
          "Jotform AI or Phreesia-style intake with mapped fields into EHR demographics — reduces duplicate entry.",
        tools: "Jotform Enterprise (BAA), Open Dental / Dentrix API",
      },
      {
        rank: 3,
        name: "Post-visit follow-up and recall",
        description:
          "Personalized SMS/email sequences for hygiene recall and treatment plan adherence with human escalation.",
        tools: "Make.com, Claude (no PHI in prompts), Twilio",
      },
      {
        rank: 4,
        name: "Review generation",
        description:
          "Timed Google Reviews and Healthgrades requests after completed visits with HIPAA-safe copy.",
        tools: "Podium, Birdeye, or Make.com + Twilio",
      },
      {
        rank: 5,
        name: "Insurance pre-authorization automation",
        description:
          "Eligibility checks and prior-auth packet assembly with staff review before submission.",
        tools: "Waystar, Availity, EHR clearinghouse modules",
      },
    ],
    toolRecommendations: [
      {
        useCase: "Reminders",
        tools: "Twilio Healthcare, Make.com",
        notes: "Sign BAA; limit SMS to non-clinical content",
      },
      {
        useCase: "Intake",
        tools: "Jotform Enterprise, Phreesia",
        notes: "Map fields to EHR; avoid free-tier forms for PHI",
      },
      {
        useCase: "Follow-up",
        tools: "Make.com + Claude with de-identified prompts",
        notes: "Staff approves messages weekly",
      },
    ],
    priorityMatrix: [
      { name: "Appointment reminders", roi: "high", complexity: "low" },
      { name: "Review requests", roi: "high", complexity: "low" },
      { name: "Patient intake AI", roi: "high", complexity: "high" },
      { name: "Prior auth automation", roi: "low", complexity: "high" },
    ],
    timeline90Day:
      "Days 1–30: BAA review, webhook setup, reminder pilot on one provider schedule.\nDays 31–60: Intake form mapping, follow-up templates, staff training.\nDays 61–90: Recall campaigns, review workflow, KPI dashboard with Office Manager.",
    successMetrics: [
      "No-show rate (%): target 2–4 point reduction within 90 days",
      "Front-desk hours/week on scheduling calls",
      "Google review velocity (reviews per 100 completed visits)",
      "Recall appointment conversion rate",
      "Patient response time to billing inquiries",
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

function PriorityMatrix({
  items,
}: {
  items: MedicalAIReportContent["priorityMatrix"];
}) {
  const quadrants = {
    highLow: items.filter((i) => i.roi === "high" && i.complexity === "low"),
    highHigh: items.filter((i) => i.roi === "high" && i.complexity === "high"),
    lowLow: items.filter((i) => i.roi === "low" && i.complexity === "low"),
    lowHigh: items.filter((i) => i.roi === "low" && i.complexity === "high"),
  };

  const cell = (
    title: string,
    list: typeof items,
    bg: (typeof pdfStyles)["priorityLow"],
  ) => (
    <View style={[pdfStyles.card, bg, { flex: 1, minHeight: 72, margin: 4 }]}>
      <Text style={pdfStyles.cardTitle}>{title}</Text>
      {list.map((item) => (
        <Text key={item.name} style={[pdfStyles.body, { fontSize: 8 }]}>
          • {item.name}
        </Text>
      ))}
    </View>
  );

  return (
    <View>
      <View style={{ flexDirection: "row" }}>
        {cell("Quick wins (High ROI · Low complexity)", quadrants.highLow, pdfStyles.priorityLow)}
        {cell("Strategic builds (High ROI · High complexity)", quadrants.highHigh, pdfStyles.priorityMedium)}
      </View>
      <View style={{ flexDirection: "row", marginTop: 4 }}>
        {cell("Optional (Low ROI · Low complexity)", quadrants.lowLow, pdfStyles.priorityLow)}
        {cell("Defer (Low ROI · High complexity)", quadrants.lowHigh, pdfStyles.priorityHigh)}
      </View>
      <Text style={[pdfStyles.muted, { marginTop: 8 }]}>
        Y-axis: ROI · X-axis: Implementation complexity
      </Text>
    </View>
  );
}

function MedicalAIReportDocument({
  company,
  content,
  practiceType,
  dateStr,
}: {
  company: Company;
  content: MedicalAIReportContent;
  practiceType: string;
  dateStr: string;
}) {
  return (
    <Document title={`${company.name} — Medical AI Readiness Report`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr · Intelligence, Applied.</Text>
        <Text style={pdfStyles.coverTitle}>AI Readiness Report</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverSubtitle}>{practiceType} · {company.size}</Text>
        <Text style={pdfStyles.coverMeta}>Prepared {dateStr}</Text>
        <Text style={[pdfStyles.coverMeta, { marginTop: 32, color: BRAND.cream }]}>
          HIPAA-aware recommendations for medical & dental practices
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>1. Executive Summary</Text>
        <Paragraphs text={content.executiveSummary} />
        <PdfFooter />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>2. HIPAA Considerations for AI</Text>
        <Text style={pdfStyles.subsectionTitle}>Three principles you must follow</Text>
        {content.hipaaPrinciples.map((p, i) => (
          <View key={p} style={pdfStyles.checkboxRow}>
            <View style={pdfStyles.checkbox} />
            <Text style={pdfStyles.body}>
              {i + 1}. {p}
            </Text>
          </View>
        ))}
        <Paragraphs text={content.hipaaNarrative} />
        <Text style={[pdfStyles.muted, { marginTop: 8 }]}>
          Consult your HIPAA compliance officer before go-live.
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>3. Current State Analysis</Text>
        <Paragraphs text={content.currentState} />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>4. Five Highest-ROI AI Use Cases</Text>
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
        <Text style={pdfStyles.sectionTitle}>5. Tool Recommendations</Text>
        <View style={pdfStyles.tableHeader}>
          <Text style={[pdfStyles.tableCellHeader, { flex: 1.2 }]}>Use case</Text>
          <Text style={[pdfStyles.tableCellHeader, { flex: 1.2 }]}>HIPAA-aware tools</Text>
          <Text style={pdfStyles.tableCellHeader}>Notes</Text>
        </View>
        {content.toolRecommendations.map((row) => (
          <View key={row.useCase} style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}>{row.useCase}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}>{row.tools}</Text>
            <Text style={pdfStyles.tableCell}>{row.notes}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>6. Implementation Priority Matrix</Text>
        <PriorityMatrix items={content.priorityMatrix} />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>7. 90-Day Implementation Timeline</Text>
        <Paragraphs text={content.timeline90Day} />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>8. Success Metrics & KPIs</Text>
        {content.successMetrics.map((metric) => (
          <View key={metric} style={pdfStyles.checkboxRow}>
            <View style={[pdfStyles.checkbox, { backgroundColor: BRAND.accent }]} />
            <Text style={pdfStyles.body}>{metric}</Text>
          </View>
        ))}
        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Clinovyr implements HIPAA-aware automations for Placer and Sacramento County medical and dental
            practices. Email clinovyr@gmail.com · clinovyr.com
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export async function renderMedicalAIReportPdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const fallback = buildReportFallback(company, formData);
  const context = buildMedicalContextBlock(company, survey, formData);

  const { data: content } = await callClaudeJson<MedicalAIReportContent>({
    system: MEDICAL_AI_SYSTEM,
    prompt: `${context}

Output ONLY valid JSON:
{
  "executiveSummary": "2-3 paragraphs",
  "hipaaPrinciples": ["...", "...", "..."],
  "hipaaNarrative": "1-2 paragraphs",
  "currentState": "2 paragraphs on their stack and drains",
  "useCases": [{"rank":1,"name":"...","description":"...","tools":"..."}, ...5 items],
  "toolRecommendations": [{"useCase":"...","tools":"...","notes":"..."}],
  "priorityMatrix": [{"name":"...","roi":"high|low","complexity":"high|low"}],
  "timeline90Day": "Days 1-30, 31-60, 61-90",
  "successMetrics": ["...", ...5+]
}`,
    maxTokens: 4000,
    fallback,
    validate: (v) => Boolean(v.executiveSummary && v.useCases?.length >= 3),
  });

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <MedicalAIReportDocument
      company={company}
      content={content}
      practiceType={getPracticeTypeLabel(company, formData)}
      dateStr={dateStr}
    />,
  );
}
