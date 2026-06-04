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
  LEGAL_INTAKE_SYSTEM,
  MATTER_SUMMARIZATION_PROMPT,
  buildLegalContextBlock,
  getFirmTypeLabel,
} from "@/lib/deliverables/generators/industries/legal-shared";
import type { AssessmentFormData } from "@/types/assessment";

export type IntakeSetupStep = {
  step: number;
  title: string;
  tasks: string[];
};

export type IntakeGuideContent = {
  overview: string;
  optionA: {
    title: string;
    description: string;
    steps: IntakeSetupStep[];
  };
  optionB: {
    title: string;
    description: string;
    steps: IntakeSetupStep[];
  };
  matterSummaryPrompt: string;
  routingRules: string[];
  attorneyReviewChecklist: string[];
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

function buildIntakeGuideFallback(
  company: Company,
  formData: AssessmentFormData | null,
): IntakeGuideContent {
  const firmType = getFirmTypeLabel(company, formData);
  const topDrain = formData?.timeDrainsRanked?.[0] ?? "client intake";

  return {
    overview: `This guide walks ${company.name} (${firmType}) through automating ${topDrain.toLowerCase()} using Clio as your practice management hub. Choose Option A if you want maximum flexibility with Typeform/JotForm, or Option B if you prefer Clio Grow's native intake with Claude integration. Both options require attorney review before any client engagement begins.`,
    optionA: {
      title: "Option A: Clio + Typeform/JotForm → Zapier → Claude",
      description:
        "Best for firms with custom intake questionnaires per practice area. Typeform or JotForm captures structured data → Zapier triggers Claude summarization → summary posts to Clio as a note → attorney receives email/Slack alert for routing.",
      steps: [
        {
          step: 1,
          title: "Design your intake form",
          tasks: [
            "Create Typeform or JotForm with practice-area logic branches",
            "Fields: client name, contact, matter type, opposing parties, urgency, referral source",
            "Add conflict-screening questions: prior representation, related entities",
            "Include consent language for electronic intake and privacy policy link",
            "Test form on mobile — 60%+ of leads complete on phone",
          ],
        },
        {
          step: 2,
          title: "Connect form to Zapier",
          tasks: [
            "Zapier trigger: New Typeform/JotForm submission",
            "Action 1: Format responses as plain text block for Claude",
            "Action 2: HTTP POST to Claude API with matter summarization prompt (see Section 4)",
            "Action 3: Parse Claude response into structured fields",
            "Enable error notification if Claude call fails — fallback to raw form email",
          ],
        },
        {
          step: 3,
          title: "Connect Zapier to Clio",
          tasks: [
            "Clio action: Search for existing contact by email (dedupe)",
            "If no contact: Create Contact with form data",
            "Create Matter in 'Intake — Pending Review' status",
            "Add Claude summary as Matter Note (internal, not client-visible)",
            "Tag matter with practice area and urgency level from summary",
          ],
        },
        {
          step: 4,
          title: "Attorney routing & alerts",
          tasks: [
            "Zapier action: Send Slack/email to intake partner with summary link",
            "Routing rules: map matter type → responsible attorney (see Section 5)",
            "Clio task: 'Review intake — [Client Name]' due within 4 business hours",
            "Attorney runs formal conflict check in Clio before status → 'Consultation Scheduled'",
          ],
        },
        {
          step: 5,
          title: "Test & go live",
          tasks: [
            "Submit 3 test intakes covering different practice areas",
            "Verify Clio contact, matter, note, and alert all fire correctly",
            "Confirm attorney can open matter and see summary without opening Typeform",
            "Document process in firm wiki; train intake coordinator",
          ],
        },
      ],
    },
    optionB: {
      title: "Option B: Clio Grow + Claude Integration",
      description:
        "Best for firms already on Clio Grow or wanting native CRM intake. Clio Grow captures leads → automated follow-up sequences → Claude summarizes intake notes → routes to Clio Manage matter when qualified.",
      steps: [
        {
          step: 1,
          title: "Configure Clio Grow intake",
          tasks: [
            "Enable Clio Grow intake forms per practice area",
            "Customize fields to match your conflict-screening requirements",
            "Set up automated email/SMS acknowledgment within 5 minutes of submission",
            "Configure lead source tracking (website, referral, Google, etc.)",
          ],
        },
        {
          step: 2,
          title: "Connect Claude to Clio Grow",
          tasks: [
            "Use Clio's integration marketplace or Zapier bridge for Claude API",
            "Trigger: New lead marked 'Intake Complete' in Clio Grow",
            "Send intake notes to Claude with matter summarization prompt (Section 4)",
            "Return summary to Clio Grow custom field or Clio Manage matter note",
          ],
        },
        {
          step: 3,
          title: "Qualification workflow",
          tasks: [
            "Clio Grow pipeline: New Lead → Intake Review → Consultation Scheduled → Retained",
            "Auto-move to 'Intake Review' when form submitted",
            "Attorney reviews Claude summary + runs conflict check",
            "One-click convert qualified lead to Clio Manage matter",
          ],
        },
        {
          step: 4,
          title: "Attorney routing",
          tasks: [
            "Assign practice area owners in Clio Grow settings",
            "Round-robin or direct assignment based on matter type",
            "Escalation: if no review within 4 hours, alert managing partner",
            "Declined matters: automated 'unable to assist' template (attorney-approved copy)",
          ],
        },
      ],
    },
    matterSummaryPrompt: MATTER_SUMMARIZATION_PROMPT,
    routingRules: [
      "Litigation → [Litigation Partner Name] — urgency High if filing deadline within 30 days",
      "Business/Corporate → [Corporate Partner Name]",
      "Estate Planning → [Estate Partner Name]",
      "Family Law → [Family Partner Name]",
      "Employment → [Employment Partner Name]",
      "Default / Unknown → Intake partner for manual assignment",
    ],
    attorneyReviewChecklist: [
      "Formal conflict check completed in Clio (independent of AI pre-screen)",
      "Summary facts verified against intake form — no AI hallucinations",
      "Urgency assessment confirmed; calendar hold if needed",
      "Client contact information verified (phone, email)",
      "Engagement letter process initiated if consultation scheduled",
    ],
  };
}

function SetupSteps({ steps }: { steps: IntakeSetupStep[] }) {
  return (
    <>
      {steps.map((s) => (
        <View key={s.step} style={[pdfStyles.card, { marginBottom: 8 }]}>
          <Text style={pdfStyles.cardTitle}>
            Step {s.step}: {s.title}
          </Text>
          {s.tasks.map((task) => (
            <View key={task} style={pdfStyles.checkboxRow}>
              <View style={pdfStyles.checkbox} />
              <Text style={[pdfStyles.body, { fontSize: 9 }]}>{task}</Text>
            </View>
          ))}
        </View>
      ))}
    </>
  );
}

function IntakeGuideDocument({
  company,
  content,
  firmType,
  dateStr,
}: {
  company: Company;
  content: IntakeGuideContent;
  firmType: string;
  dateStr: string;
}) {
  return (
    <Document title={`${company.name} — Client Intake System Setup Guide`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr Implementation Guide</Text>
        <Text style={pdfStyles.coverTitle}>Client Intake System</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverSubtitle}>{firmType}</Text>
        <Text style={pdfStyles.coverMeta}>{dateStr}</Text>
        <Text style={[pdfStyles.coverMeta, { marginTop: 24, color: BRAND.cream }]}>
          Clio + AI intake automation · Step-by-step setup
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Overview</Text>
        <Paragraphs text={content.overview} />
        <Text style={pdfStyles.subsectionTitle}>Which option to choose?</Text>
        <Text style={pdfStyles.body}>
          • Option A — Custom forms, multi-practice-area logic, maximum flexibility{"\n"}
          • Option B — Native Clio Grow workflow, faster setup, less Zapier complexity
        </Text>
        <PdfFooter />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>{content.optionA.title}</Text>
        <Paragraphs text={content.optionA.description} />
        <SetupSteps steps={content.optionA.steps.slice(0, 3)} />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>{content.optionA.title} (continued)</Text>
        <SetupSteps steps={content.optionA.steps.slice(3)} />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>{content.optionB.title}</Text>
        <Paragraphs text={content.optionB.description} />
        <SetupSteps steps={content.optionB.steps} />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Matter Summarization Prompt</Text>
        <Text style={[pdfStyles.muted, { marginBottom: 8 }]}>
          Copy this prompt into your Zapier Claude step or Clio integration. Replace bracketed
          fields with firm-specific values.
        </Text>
        <Text
          style={[
            pdfStyles.body,
            {
              fontFamily: "Courier",
              fontSize: 8,
              backgroundColor: "#f5f2ed",
              padding: 10,
              lineHeight: 1.4,
            },
          ]}
        >
          {content.matterSummaryPrompt}
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Attorney Routing Rules</Text>
        <Text style={[pdfStyles.muted, { marginBottom: 8 }]}>
          Customize for {company.name}. Claude uses these rules in Step 4 of the summarization
          prompt.
        </Text>
        {content.routingRules.map((rule) => (
          <View key={rule} style={pdfStyles.checkboxRow}>
            <View style={[pdfStyles.checkbox, { backgroundColor: BRAND.accent }]} />
            <Text style={pdfStyles.body}>{rule}</Text>
          </View>
        ))}
        <Text style={[pdfStyles.sectionTitle, { marginTop: 16 }]}>
          Attorney Review Checklist
        </Text>
        {content.attorneyReviewChecklist.map((item) => (
          <View key={item} style={pdfStyles.checkboxRow}>
            <View style={pdfStyles.checkbox} />
            <Text style={pdfStyles.body}>{item}</Text>
          </View>
        ))}
        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Clinovyr builds and deploys Clio intake automations for California law firms. Need
            hands-on setup? clinovyr@gmail.com · clinovyr.com
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export async function renderLegalClientIntakeGuidePdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const fallback = buildIntakeGuideFallback(company, formData);
  const context = buildLegalContextBlock(company, survey, formData);

  const { data: content } = await callClaudeJson<IntakeGuideContent>({
    system: LEGAL_INTAKE_SYSTEM,
    prompt: `${context}

Output ONLY valid JSON:
{
  "overview": "1-2 paragraphs",
  "optionA": {"title":"Option A: Clio + Typeform/JotForm → Zapier + Claude","description":"...","steps":[{"step":1,"title":"...","tasks":["..."]}, ...5 steps]},
  "optionB": {"title":"Option B: Clio Grow + Claude Integration","description":"...","steps":[{"step":1,"title":"...","tasks":["..."]}, ...4 steps]},
  "matterSummaryPrompt": "full prompt text with [brackets]",
  "routingRules": ["5-6 routing rules with attorney names as placeholders"],
  "attorneyReviewChecklist": ["5 checklist items"]
}
Include the matter summarization prompt for attorney routing. Tailor to firm practice areas.`,
    maxTokens: 4500,
    fallback,
    validate: (v) => Boolean(v.optionA?.steps?.length >= 3 && v.matterSummaryPrompt),
  });

  if (!content.matterSummaryPrompt?.includes("Conflict")) {
    content.matterSummaryPrompt = MATTER_SUMMARIZATION_PROMPT;
  }

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <IntakeGuideDocument
      company={company}
      content={content}
      firmType={getFirmTypeLabel(company, formData)}
      dateStr={dateStr}
    />,
  );
}
