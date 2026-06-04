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
  DEFAULT_COMPLIANCE_ITEMS,
  LEGAL_COMPLIANCE_SYSTEM,
  buildLegalContextBlock,
  getFirmTypeLabel,
  isRiaContext,
} from "@/lib/deliverables/generators/industries/legal-shared";
import type { AssessmentFormData } from "@/types/assessment";

export type ComplianceItem = {
  item: string;
  topic: string;
};

export type ComplianceChecklistContent = {
  title: string;
  intro: string;
  items: ComplianceItem[];
  closingNote: string;
};

function buildComplianceFallback(
  company: Company,
  formData: AssessmentFormData | null,
): ComplianceChecklistContent {
  const ria = isRiaContext(company, formData);
  const firmType = getFirmTypeLabel(company, formData);

  return {
    title: ria
      ? "Before You Deploy AI in Your Advisory Practice"
      : "Before You Deploy AI in Your Practice",
    intro: ria
      ? `Use this checklist before deploying AI at ${company.name} (${firmType}). SEC recordkeeping, Marketing Rule compliance, and fiduciary duty require documented supervisory review of AI-assisted workflows. Complete every item — consult compliance counsel where noted.`
      : `Use this checklist before deploying AI at ${company.name} (${firmType}). California State Bar ethics rules require attorney supervision of all AI-generated work product. Complete every item — consult ethics counsel where noted.`,
    items: ria ? DEFAULT_COMPLIANCE_ITEMS.ria : DEFAULT_COMPLIANCE_ITEMS.lawFirm,
    closingNote:
      "Retain a signed copy of this completed checklist in your compliance files. Re-run before each new AI tool deployment or vendor change.",
  };
}

function ComplianceChecklistDocument({
  company,
  content,
  firmType,
  dateStr,
  ria,
}: {
  company: Company;
  content: ComplianceChecklistContent;
  firmType: string;
  dateStr: string;
  ria: boolean;
}) {
  const topics = [...new Set(content.items.map((i) => i.topic))];

  return (
    <Document title={`${company.name} — AI Compliance Checklist`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr Compliance Guide</Text>
        <Text style={pdfStyles.coverTitle}>{content.title}</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverSubtitle}>{firmType}</Text>
        <Text style={pdfStyles.coverMeta}>{dateStr}</Text>
        <Text style={[pdfStyles.coverMeta, { marginTop: 24, color: BRAND.cream }]}>
          {ria ? "SEC & fiduciary compliance variant" : "ABA & California State Bar aligned"}
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Introduction</Text>
        <Text style={pdfStyles.body}>{content.intro}</Text>
        <Text style={pdfStyles.subsectionTitle}>Topics covered</Text>
        <Text style={pdfStyles.body}>{topics.join(" · ")}</Text>
        <Text style={[pdfStyles.muted, { marginTop: 12 }]}>
          For each item: mark Yes / No / N/A and note the date completed and responsible attorney.
        </Text>
        <PdfFooter />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Compliance Checklist</Text>
        {content.items.map((entry, idx) => (
          <View key={entry.item} style={{ marginBottom: 10 }}>
            <Text style={[pdfStyles.muted, { fontSize: 8, marginBottom: 2 }]}>
              {idx + 1}. {entry.topic}
            </Text>
            <View style={pdfStyles.checkboxRow}>
              <View style={pdfStyles.checkbox} />
              <Text style={[pdfStyles.body, { flex: 1, fontSize: 9 }]}>{entry.item}</Text>
            </View>
            <View style={{ flexDirection: "row", marginLeft: 22, marginTop: 4, gap: 16 }}>
              <Text style={[pdfStyles.muted, { fontSize: 8 }]}>Yes ☐</Text>
              <Text style={[pdfStyles.muted, { fontSize: 8 }]}>No ☐</Text>
              <Text style={[pdfStyles.muted, { fontSize: 8 }]}>N/A ☐</Text>
              <Text style={[pdfStyles.muted, { fontSize: 8 }]}>Date: __________</Text>
            </View>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Sign-Off</Text>
        <Text style={pdfStyles.body}>{content.closingNote}</Text>
        <View style={{ marginTop: 24 }}>
          <Text style={pdfStyles.body}>
            Managing Partner / Compliance Officer: ___________________________
          </Text>
          <Text style={[pdfStyles.body, { marginTop: 16 }]}>
            Date: ___________________________
          </Text>
        </View>
        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Clinovyr helps California law firms and RIAs deploy AI with ethics-first guardrails.
            Need a compliance review workshop? clinovyr@gmail.com · clinovyr.com
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export async function renderLegalComplianceChecklistPdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const fallback = buildComplianceFallback(company, formData);
  const context = buildLegalContextBlock(company, survey, formData);
  const ria = isRiaContext(company, formData);

  const { data: content } = await callClaudeJson<ComplianceChecklistContent>({
    system: LEGAL_COMPLIANCE_SYSTEM,
    prompt: `${context}

Output ONLY valid JSON:
{
  "title": "Before You Deploy AI in Your Practice",
  "intro": "1-2 paragraphs",
  "items": [{"item":"yes/no checklist statement","topic":"category"}, ...exactly 12 items],
  "closingNote": "1 paragraph on retention and re-review"
}
${ria ? "Use SEC/RIA compliance variant: recordkeeping, Marketing Rule review, client disclosure, fiduciary duty, supervisory review." : "Use law firm variant: privacy, confidentiality, attorney oversight, vendor agreements, disclosure, malpractice."}
Topics must include: privacy, confidentiality, attorney oversight, vendor agreements, disclosure, malpractice (or SEC equivalents for RIA).`,
    maxTokens: 2500,
    fallback,
    validate: (v) => Array.isArray(v.items) && v.items.length >= 10,
  });

  const items =
    content.items.length >= 12
      ? content.items.slice(0, 12)
      : [
          ...content.items,
          ...(ria ? DEFAULT_COMPLIANCE_ITEMS.ria : DEFAULT_COMPLIANCE_ITEMS.lawFirm),
        ].slice(0, 12);

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <ComplianceChecklistDocument
      company={company}
      content={{ ...content, items }}
      firmType={getFirmTypeLabel(company, formData)}
      dateStr={dateStr}
      ria={ria}
    />,
  );
}
