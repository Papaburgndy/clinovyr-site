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
  MEDICAL_HIPAA_SYSTEM,
  buildMedicalContextBlock,
  getPracticeTypeLabel,
} from "@/lib/deliverables/generators/industries/medical-shared";
import type { AssessmentFormData } from "@/types/assessment";

export type HipaaGuideContent = {
  whatHipaaMeans: string;
  threeTierRisk: string;
  safeHarborTools: string[];
  toolsToAvoid: string[];
  staffTraining: string;
  documentation: string;
  checklist: string[];
};

function buildHipaaFallback(
  company: Company,
  formData: AssessmentFormData | null,
): HipaaGuideContent {
  const practice = getPracticeTypeLabel(company, formData);
  return {
    whatHipaaMeans: `For ${company.name}, HIPAA requires that any AI or automation handling protected health information (PHI) maintain confidentiality, integrity, and availability. This applies to patient names combined with appointment details, clinical notes, insurance IDs, and billing data processed by third-party tools.`,
    threeTierRisk:
      "Tier 1 (Low): Internal summarization of de-identified operational metrics.\nTier 2 (Medium): Scheduling reminders with minimum necessary PHI via BAA-covered SMS.\nTier 3 (High): Clinical documentation, transcription, or diagnostic suggestions — requires explicit policies, BAAs, and compliance officer approval.",
    safeHarborTools: [
      "Twilio Healthcare / HIPAA-eligible SMS with signed BAA",
      "Google Workspace Enterprise + signed BAA (limited PHI use cases)",
      "Jotform Enterprise with BAA for intake (configured correctly)",
      "Microsoft 365 with BAA for covered email workflows",
      "EHR-native automation modules covered under your EHR BAA",
    ],
    toolsToAvoid: [
      "Consumer ChatGPT, Claude, or Gemini accounts for PHI",
      "Free-tier form builders without BAA",
      "Personal texting apps for clinical or billing details",
      "Social schedulers that store patient stories with identifiers",
    ],
    staffTraining: `Train ${practice} staff on: what counts as PHI, approved tools list, how to escalate AI errors, and prohibition on pasting patient charts into non-BAA AI. Run 45-minute role-based sessions for front desk, clinical, and billing.`,
    documentation:
      "Maintain: BAA inventory, risk assessments per workflow, AI use policy, staff attestation logs, and incident response steps for misdirected messages.",
    checklist: [
      "Vendor signed a Business Associate Agreement (BAA)",
      "Data flow diagram documents where PHI is stored",
      "Minimum necessary fields configured in forms and SMS",
      "Staff training completed with signed acknowledgments",
      "AI outputs reviewed by human before patient-facing send",
      "Audit log enabled for automation platform",
      "Incident response contact listed in SOP",
      "Compliance officer sign-off documented before go-live",
    ],
  };
}

function SectionBlock({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={pdfStyles.subsectionTitle}>{title}</Text>
      {body.split(/\n/).map((line) => (
        <Text key={line.slice(0, 30)} style={pdfStyles.body}>
          {line.trim()}
        </Text>
      ))}
    </View>
  );
}

function HipaaGuideDocument({
  company,
  practiceType,
  content,
  dateStr,
}: {
  company: Company;
  practiceType: string;
  content: HipaaGuideContent;
  dateStr: string;
}) {
  return (
    <Document title={`HIPAA-Safe AI Guide — ${company.name}`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr Compliance Guide</Text>
        <Text style={pdfStyles.coverTitle}>HIPAA-Safe AI Implementation</Text>
        <Text style={pdfStyles.coverSubtitle}>Guide for {practiceType}</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverMeta}>{dateStr}</Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>What HIPAA Means for AI Tools</Text>
        <SectionBlock title="" body={content.whatHipaaMeans} />
        <Text style={pdfStyles.sectionTitle}>Three-Tier Risk Classification</Text>
        <SectionBlock title="" body={content.threeTierRisk} />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Safe Harbor Tools (with BAA)</Text>
        {content.safeHarborTools.map((tool) => (
          <View key={tool} style={pdfStyles.checkboxRow}>
            <View style={[pdfStyles.checkbox, { backgroundColor: "#e8f5f1" }]} />
            <Text style={pdfStyles.body}>{tool}</Text>
          </View>
        ))}
        <Text style={pdfStyles.sectionTitle}>Tools to Avoid</Text>
        {content.toolsToAvoid.map((tool) => (
          <View key={tool} style={pdfStyles.checkboxRow}>
            <View style={[pdfStyles.checkbox, { borderColor: "#b84a4a" }]} />
            <Text style={pdfStyles.body}>{tool}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Staff Training Requirements</Text>
        <SectionBlock title="" body={content.staffTraining} />
        <Text style={pdfStyles.sectionTitle}>Documentation to Keep</Text>
        <SectionBlock title="" body={content.documentation} />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>
          Before You Deploy Any AI Tool, Check These 8 Things
        </Text>
        {content.checklist.map((item, i) => (
          <View key={item} style={pdfStyles.checkboxRow}>
            <View style={pdfStyles.checkbox} />
            <Text style={pdfStyles.body}>
              {i + 1}. {item}
            </Text>
          </View>
        ))}
        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Questions? Clinovyr helps {practiceType.toLowerCase()} teams implement AI with
            compliance-first workflows.
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export async function renderMedicalHipaaGuidePdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const fallback = buildHipaaFallback(company, formData);
  const context = buildMedicalContextBlock(company, survey, formData);
  const practiceType = getPracticeTypeLabel(company, formData);

  const { data: content } = await callClaudeJson<HipaaGuideContent>({
    system: MEDICAL_HIPAA_SYSTEM,
    prompt: `${context}

Practice type label: ${practiceType}

Output ONLY valid JSON:
{
  "whatHipaaMeans": "2 paragraphs",
  "threeTierRisk": "Tier 1/2/3 explanation",
  "safeHarborTools": ["..."],
  "toolsToAvoid": ["..."],
  "staffTraining": "1-2 paragraphs",
  "documentation": "1 paragraph list-style",
  "checklist": ["8 specific items"]
}`,
    maxTokens: 2200,
    fallback,
    validate: (v) => Boolean(v.checklist?.length >= 6),
  });

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <HipaaGuideDocument
      company={company}
      practiceType={practiceType}
      content={content}
      dateStr={dateStr}
    />,
  );
}
