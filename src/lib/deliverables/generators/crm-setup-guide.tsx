import React from "react";
import type { Company, Survey } from "@prisma/client";
import { callClaudeJson } from "@/lib/deliverables/generators/claude-helper";
import { pdfOutput } from "@/lib/deliverables/generators/shared";
import type { DeliverableGenerator } from "@/lib/deliverables/generators/types";
import {
  BrandedPage,
  Document,
  PdfFooter,
  Text,
  View,
  pdfStyles,
  renderPdfDocument,
} from "@/lib/deliverables/generators/pdf-brand";
import type { AssessmentFormData } from "@/types/assessment";

type CrmPhase = { title: string; steps: string[] };
type CrmGuideContent = {
  intro: string;
  crmName: string;
  phases: CrmPhase[];
  metrics: string[];
};

function buildFallback(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): CrmGuideContent {
  const crm = formData?.crm?.[0] ?? "your CRM";
  const topDrain = formData?.timeDrainsRanked?.[0] ?? "priority workflows";
  return {
    crmName: crm,
    intro: `A practical CRM configuration plan for ${company.name} (${company.industry}, readiness tier ${
      survey.tier ?? "TBD"
    }). The goal is an AI-ready ${crm} that drives consistent follow-up and clean data.`,
    phases: [
      {
        title: "Phase 1 — Foundations",
        steps: [
          `Audit current fields, pipelines, and automations in ${crm}`,
          "Define naming conventions for contacts, deals, and tasks",
          "Document 3–5 SOPs your team uses daily",
        ],
      },
      {
        title: "Phase 2 — AI-ready workflows",
        steps: [
          "Add standardized note templates for AI-assisted summaries",
          `Create trigger-based follow-up sequences for ${topDrain.toLowerCase()}`,
          "Enable logging for automation QA (weekly review)",
        ],
      },
      {
        title: "Phase 3 — Team adoption",
        steps: [
          "Run a 30-minute live workshop on safe AI use and escalation rules",
          "Provide role-based cheat sheets (front desk vs. ops vs. leadership)",
          "Hold Clinovyr office hours in weeks 2–4 post-launch",
        ],
      },
    ],
    metrics: [
      `Hours saved per week on ${topDrain.toLowerCase()}`,
      "Response time to new leads / inquiries",
      "Staff confidence score (1–5 survey at day 30)",
    ],
  };
}

function CrmGuideDocument({
  company,
  content,
}: {
  company: Company;
  content: CrmGuideContent;
}) {
  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return (
    <Document title={`${company.name} — CRM Setup Guide`}>
      <BrandedPage>
        <Text style={pdfStyles.coverKicker}>Clinovyr CRM Setup Guide</Text>
        <Text style={pdfStyles.sectionTitle}>{company.name}</Text>
        <Text style={pdfStyles.body}>
          {company.industry} · {content.crmName} · {dateStr}
        </Text>
        <Text style={[pdfStyles.body, { marginTop: 8, marginBottom: 12 }]}>
          {content.intro}
        </Text>

        {content.phases.map((phase) => (
          <View key={phase.title} style={{ marginBottom: 12 }}>
            <Text style={pdfStyles.subsectionTitle}>{phase.title}</Text>
            {phase.steps.map((step, i) => (
              <Text key={step} style={pdfStyles.body}>
                {i + 1}. {step}
              </Text>
            ))}
          </View>
        ))}

        <Text style={pdfStyles.subsectionTitle}>Success metrics</Text>
        {content.metrics.map((m) => (
          <View key={m} style={pdfStyles.checkboxRow}>
            <View style={pdfStyles.checkbox} />
            <Text style={pdfStyles.body}>{m}</Text>
          </View>
        ))}

        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Clinovyr can configure {content.crmName} with you in a working session —
            from field cleanup to live AI follow-up sequences.
          </Text>
        </View>

        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export const generateCrmSetupGuide: DeliverableGenerator = async ({
  company,
  survey,
  formData,
}) => {
  const fallback = buildFallback(company, survey, formData);

  const { data: content } = await callClaudeJson<CrmGuideContent>({
    system:
      "You are a Clinovyr CRM consultant. Output ONLY valid JSON: { intro: string, crmName: string, phases: [{ title, steps: string[] }] (3 phases, 3-4 steps each), metrics: string[] (3 items) }. Be specific to the company's CRM and industry. No placeholders or brackets.",
    prompt: `Company: ${company.name}
Industry: ${company.industry}
Size: ${company.size}
Current CRM: ${formData?.crm?.join(", ") || "not specified"}
Top time drains: ${formData?.timeDrainsRanked?.slice(0, 3).join(", ") ?? "N/A"}
Readiness tier: ${survey.tier ?? "TBD"}

Write a tailored, AI-ready CRM setup guide.`,
    maxTokens: 1100,
    fallback,
    validate: (v) => Array.isArray(v.phases) && v.phases.length >= 2,
  });

  const buffer = await renderPdfDocument(
    <CrmGuideDocument company={company} content={content} />,
  );
  return pdfOutput("crm-setup-guide", buffer, {
    filename: "crm-setup-guide.pdf",
    displayName: "CRM Setup Guide",
  });
};
