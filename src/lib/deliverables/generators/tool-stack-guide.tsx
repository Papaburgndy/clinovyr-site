import React from "react";
import type { Company } from "@prisma/client";
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

type StackRow = { label: string; value: string };
type Recommendation = {
  category: string;
  tools: string;
  rationale: string;
};

function buildStackRows(formData: AssessmentFormData | null): StackRow[] {
  if (!formData) {
    return [
      { label: "Current stack", value: "Complete your assessment for a detailed stack map." },
    ];
  }
  const join = (arr: string[] | undefined, fallback: string) =>
    arr && arr.length > 0 ? arr.join(", ") : fallback;
  return [
    { label: "CRM", value: join(formData.crm, "None listed") },
    { label: "Email / marketing", value: join(formData.emailTools, "Email only") },
    { label: "Scheduling", value: join(formData.scheduling, "Manual") },
    { label: "Project management", value: join(formData.pm, "Spreadsheets") },
    { label: "Accounting", value: join(formData.accounting, "Not specified") },
    { label: "AI tool usage today", value: formData.aiTools || "Not specified" },
  ];
}

function buildRecommendations(
  company: Company,
  formData: AssessmentFormData | null,
): Recommendation[] {
  const crm = formData?.crm?.[0] ?? "your CRM";
  const industry = company.industry.toLowerCase();
  return [
    {
      category: "1. Automation connector",
      tools: "Make.com or Zapier",
      rationale: `Connect ${crm}, email, and scheduling before buying new platforms. Most quick wins come from linking tools you already own.`,
    },
    {
      category: "2. AI assistant layer",
      tools: "Claude or ChatGPT with company playbooks",
      rationale: `Ground AI in your FAQs, intake forms, and SOPs for ${industry} workflows so output is accurate and on-brand.`,
    },
    {
      category: "3. Knowledge base",
      tools: "Notion or structured Google Drive",
      rationale:
        "A single source of truth improves AI accuracy, speeds onboarding, and keeps automations maintainable.",
    },
    {
      category: "4. Quality monitoring",
      tools: "Airtable or Google Sheets automation log",
      rationale:
        "Track triggers, failures, and hours saved weekly so you can prove ROI and catch issues early.",
    },
  ];
}

function ToolStackDocument({
  company,
  formData,
}: {
  company: Company;
  formData: AssessmentFormData | null;
}) {
  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  const stackRows = buildStackRows(formData);
  const recommendations = buildRecommendations(company, formData);

  return (
    <Document title={`${company.name} — AI Tool Stack Guide`}>
      <BrandedPage>
        <Text style={pdfStyles.coverKicker}>Clinovyr AI Tool Stack Guide</Text>
        <Text style={pdfStyles.sectionTitle}>{company.name}</Text>
        <Text style={pdfStyles.body}>
          {company.industry} · Generated {dateStr}
        </Text>
        <Text style={[pdfStyles.body, { marginTop: 8, marginBottom: 14 }]}>
          This guide maps your current software stack and recommends an
          AI-ready layer, prioritized so you add capability without ripping out
          what already works.
        </Text>

        <Text style={pdfStyles.subsectionTitle}>Current stack snapshot</Text>
        <View style={pdfStyles.tableHeader}>
          <Text style={[pdfStyles.tableCellHeader, { flex: 0.8 }]}>System</Text>
          <Text style={pdfStyles.tableCellHeader}>In use today</Text>
        </View>
        {stackRows.map((row) => (
          <View key={row.label} style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { flex: 0.8, fontFamily: "Helvetica-Bold" }]}>
              {row.label}
            </Text>
            <Text style={pdfStyles.tableCell}>{row.value}</Text>
          </View>
        ))}

        <Text style={[pdfStyles.subsectionTitle, { marginTop: 16 }]}>
          Recommended additions (prioritized)
        </Text>
        {recommendations.map((rec) => (
          <View key={rec.category} style={pdfStyles.card}>
            <Text style={pdfStyles.cardTitle}>{rec.category}</Text>
            <Text style={[pdfStyles.muted, { marginBottom: 4 }]}>
              Suggested tools: {rec.tools}
            </Text>
            <Text style={pdfStyles.body}>{rec.rationale}</Text>
          </View>
        ))}

        <Text style={[pdfStyles.subsectionTitle, { marginTop: 8 }]}>
          What to defer
        </Text>
        <Text style={pdfStyles.body}>
          • Full platform replacements until pilot ROI is proven.{"\n"}
          • Custom AI model training before your workflows are documented.{"\n"}
          • Tools that duplicate features already in {formData?.crm?.[0] ?? "your CRM"}.
        </Text>

        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Next step: book a Clinovyr stack review to validate integrations and
            security requirements before you buy anything new.
          </Text>
        </View>

        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export const generateToolStackGuide: DeliverableGenerator = async ({
  company,
  formData,
}) => {
  const buffer = await renderPdfDocument(
    <ToolStackDocument company={company} formData={formData} />,
  );
  return pdfOutput("tool-stack-guide", buffer, {
    filename: "ai-tool-stack-guide.pdf",
    displayName: "AI Tool Stack Guide",
  });
};
