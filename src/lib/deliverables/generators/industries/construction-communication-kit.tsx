import React from "react";
import type { Company, Survey } from "@prisma/client";
import { callClaudeJson } from "@/lib/deliverables/generators/claude-helper";
import {
  BrandedPage,
  Document,
  PdfFooter,
  Text,
  View,
  pdfStyles,
  renderPdfDocument,
} from "@/lib/deliverables/generators/pdf-brand";
import {
  CONSTRUCTION_COMMUNICATION_SYSTEM,
  DEFAULT_CONSTRUCTION_TEMPLATES,
  buildConstructionContextBlock,
  type ConstructionMessageTemplate,
} from "@/lib/deliverables/generators/industries/construction-shared";
import type { AssessmentFormData } from "@/types/assessment";

type CommunicationKitContent = {
  intro: string;
  templates: ConstructionMessageTemplate[];
};

function buildCommunicationKitFallback(): CommunicationKitContent {
  return {
    intro:
      "Ten copy-paste message templates for subcontractor and client coordination. No software required — use from your phone or email today. Replace every [BRACKET] with job-specific details. Each template includes when to use it and how to customize.",
    templates: DEFAULT_CONSTRUCTION_TEMPLATES,
  };
}

function TemplateCard({
  template,
  index,
}: {
  template: ConstructionMessageTemplate;
  index: number;
}) {
  return (
    <View wrap={false} style={[pdfStyles.card, { marginBottom: 10 }]}>
      <Text style={pdfStyles.cardTitle}>
        {index + 1}. {template.title}
      </Text>
      <Text style={[pdfStyles.subsectionTitle, { fontSize: 9, marginTop: 2 }]}>
        When to use
      </Text>
      <Text style={[pdfStyles.body, { fontSize: 9, marginBottom: 6 }]}>
        {template.situation}
      </Text>
      <Text style={[pdfStyles.subsectionTitle, { fontSize: 9 }]}>Message (copy below)</Text>
      <Text
        style={[
          pdfStyles.body,
          {
            fontFamily: "Courier",
            fontSize: 7.5,
            backgroundColor: "#f5f2ed",
            padding: 8,
            lineHeight: 1.35,
          },
        ]}
      >
        {template.message}
      </Text>
      <Text style={[pdfStyles.subsectionTitle, { fontSize: 9, marginTop: 4 }]}>
        Customization note
      </Text>
      <Text style={[pdfStyles.muted, { fontSize: 8 }]}>{template.customizationNote}</Text>
    </View>
  );
}

function CommunicationKitDocument({
  company,
  content,
  dateStr,
}: {
  company: Company;
  content: CommunicationKitContent;
  dateStr: string;
}) {
  const chunks: ConstructionMessageTemplate[][] = [];
  const chunkSize = 3;
  for (let i = 0; i < content.templates.length; i += chunkSize) {
    chunks.push(content.templates.slice(i, i + chunkSize));
  }

  return (
    <Document title={`${company.name} — Subcontractor Communication Kit`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr Operations Kit</Text>
        <Text style={pdfStyles.coverTitle}>Subcontractor & Client Message Templates</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverMeta}>{dateStr}</Text>
        <Text style={[pdfStyles.coverMeta, { marginTop: 24 }]}>
          10 ready-to-send templates · No tech setup required
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>How to Use This Kit</Text>
        <Text style={pdfStyles.body}>{content.intro}</Text>
        <Text style={pdfStyles.subsectionTitle}>Template index</Text>
        {content.templates.map((t, i) => (
          <View key={t.title} style={{ flexDirection: "row", marginBottom: 3 }}>
            <Text style={[pdfStyles.body, { width: 24, fontSize: 9 }]}>{i + 1}.</Text>
            <Text style={[pdfStyles.body, { flex: 1, fontSize: 9 }]}>{t.title}</Text>
          </View>
        ))}
        <PdfFooter label="clinovyr.com · Placer County contractors" />
      </BrandedPage>

      {chunks.map((chunk, chunkIdx) => (
        <BrandedPage key={`chunk-${chunkIdx}`}>
          <Text style={pdfStyles.sectionTitle}>
            Templates {chunkIdx * chunkSize + 1}–{chunkIdx * chunkSize + chunk.length}
          </Text>
          {chunk.map((t, i) => (
            <TemplateCard key={t.title} template={t} index={chunkIdx * chunkSize + i} />
          ))}
          {chunkIdx === chunks.length - 1 && (
            <View style={pdfStyles.ctaBox}>
              <Text style={pdfStyles.ctaText}>
                Automate Friday client updates and lead replies with n8n — included in Clinovyr
                Automation Sprints. clinovyr@gmail.com
              </Text>
            </View>
          )}
          <PdfFooter />
        </BrandedPage>
      ))}
    </Document>
  );
}

export async function renderConstructionCommunicationKitPdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const fallback = buildCommunicationKitFallback();
  const context = buildConstructionContextBlock(company, survey, formData);

  const { data: content } = await callClaudeJson<CommunicationKitContent>({
    system: CONSTRUCTION_COMMUNICATION_SYSTEM,
    prompt: `${context}

Output ONLY valid JSON:
{
  "intro": "1-2 paragraphs",
  "templates": [
    {"title":"...","situation":"when to use","message":"full email/SMS text with [BRACKETS]","customizationNote":"..."},
    ...10 templates covering: initial scope request, COI follow-up, schedule confirmation, change order, payment reminder, performance issue, client progress update, inspection readiness, lead qualification, close-out/referral
  ]
}`,
    maxTokens: 5000,
    fallback,
    validate: (v) => Boolean(v.templates?.length >= 8),
  });

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <CommunicationKitDocument company={company} content={content} dateStr={dateStr} />,
  );
}
