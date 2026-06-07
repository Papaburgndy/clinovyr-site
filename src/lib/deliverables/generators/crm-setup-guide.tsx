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

type FieldGroup = { object: string; fields: string[] };
type Automation = { name: string; trigger: string; steps: string[]; tools: string };
type Phase = { title: string; steps: string[] };

type CrmGuideContent = {
  crmName: string;
  intro: string;
  customFields: FieldGroup[];
  pipelineStages: { stage: string; definition: string }[];
  automations: Automation[];
  leadScoring: string[];
  reporting: string[];
  dataHygiene: string[];
  rollout: Phase[];
  metrics: string[];
};

const KNOWN_CRMS = ["hubspot", "salesforce", "gohighlevel", "go high level", "zoho", "pipedrive", "keap", "clio", "dubsado"];

function resolveCrm(formData: AssessmentFormData | null): string {
  const picked = formData?.crm?.find((c) => KNOWN_CRMS.includes(c.toLowerCase()));
  if (picked) return picked;
  const first = formData?.crm?.[0];
  if (first && first.toLowerCase() !== "none" && first.toLowerCase() !== "other") return first;
  return "HubSpot";
}

/** Detailed, genuinely useful fallback (used when Claude is unavailable). */
function buildFallback(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): CrmGuideContent {
  const crm = resolveCrm(formData);
  const topDrain = formData?.timeDrainsRanked?.[0] ?? "customer follow-up";
  const dealObject = /salesforce/i.test(crm) ? "Opportunities" : "Deals";

  return {
    crmName: crm,
    intro: `This guide configures ${crm} for ${company.name} (${company.industry}) so it captures clean data, drives consistent follow-up on ${topDrain.toLowerCase()}, and is ready for AI assistance. Work through it top to bottom — each section builds on the last. Budget about a day for setup and a week of light tuning.`,
    customFields: [
      {
        object: "Contacts",
        fields: [
          "Lead Source (dropdown: Referral, Website, Google, Walk-in, Social, Repeat) — required on create",
          "Lifecycle Stage (New, Contacted, Consult Booked, Active, Inactive, Lost)",
          "Last Contacted Date (date) — auto-stamped by workflow",
          "Preferred Contact Method (Call, Text, Email)",
          "AI Summary (multi-line text) — where AI writes a 2-sentence account recap",
        ],
      },
      {
        object: dealObject,
        fields: [
          "Service / Package (dropdown matching your offerings)",
          "Estimated Value ($) — required to enter the pipeline",
          "Expected Close Date (date)",
          "Stuck Reason (dropdown) — captured when a deal sits >14 days",
        ],
      },
      {
        object: "Companies / Accounts",
        fields: [
          "Account Owner (user) — single point of accountability",
          "Referral Partner (text) — track who sends you business",
        ],
      },
    ],
    pipelineStages: [
      { stage: "New Inquiry", definition: "Lead captured; not yet contacted. Goal: first touch within 1 business hour." },
      { stage: "Contacted", definition: "Two-way conversation started. Owner assigned." },
      { stage: "Consult / Quote", definition: "Appointment booked or quote sent." },
      { stage: "Proposal / Treatment Plan", definition: "Formal offer presented; awaiting decision." },
      { stage: "Won", definition: "Customer committed. Triggers onboarding + review request later." },
      { stage: "Lost / Nurture", definition: "No for now. Drops into a long-term nurture sequence." },
    ],
    automations: [
      {
        name: "Instant lead response",
        trigger: `New contact created with Lead Source set (form, call, or chat)`,
        steps: [
          "Send an immediate branded text + email acknowledging the inquiry",
          "Create a task for the owner: 'Call within 1 hour'",
          "Set Lifecycle Stage = Contacted only after a logged call/reply",
        ],
        tools: `${crm} Workflows + your SMS provider (e.g. Twilio)`,
      },
      {
        name: `${topDrain} sequence`,
        trigger: "Deal enters 'Consult / Quote' and no activity for 2 days",
        steps: [
          "Day 2: friendly check-in email with a booking link",
          "Day 4: SMS reminder",
          "Day 7: final value-add email, then move to Nurture if no response",
        ],
        tools: `${crm} sequences / workflows`,
      },
      {
        name: "Win to review + referral",
        trigger: "Deal marked Won",
        steps: [
          "Wait 3 days, then send a review request (Google link)",
          "After a 4-5 star review, send a referral offer",
          "Create an annual recall/check-in task",
        ],
        tools: `${crm} Workflows`,
      },
    ],
    leadScoring: [
      "+10 Lead Source = Referral or Repeat",
      "+10 booked a consult/appointment",
      "+5 opened 2+ emails or replied to a text",
      "-10 no response after 3 touches (route to nurture)",
      "Auto-notify the owner when a contact crosses 20 points",
    ],
    reporting: [
      "Pipeline by stage (count + $ value) — spot bottlenecks weekly",
      "Lead response time (avg minutes to first touch) — your #1 conversion lever",
      "Conversion rate by Lead Source — double down on what works",
      "Deals stuck >14 days — your follow-up worklist",
    ],
    dataHygiene: [
      "Make Lead Source, Owner, and Estimated Value required fields",
      "Merge duplicate contacts weekly (most CRMs have a built-in tool)",
      "Standardize phone/name formatting with a validation rule or workflow",
      "Archive contacts with no activity in 24 months to keep AI context clean",
    ],
    rollout: [
      {
        title: "Week 1 — Configure",
        steps: [
          `Create the custom fields and pipeline stages above in ${crm}`,
          "Import/clean existing contacts; set Lead Source on each",
          "Build the three automations in a test workflow first",
        ],
      },
      {
        title: "Week 2 — Pilot",
        steps: [
          "Turn on automations for one owner or location",
          "Log every lead for one week; review the pipeline daily",
          "Tune timing/copy based on real replies",
        ],
      },
      {
        title: "Weeks 3–4 — Roll out & train",
        steps: [
          "Enable for the whole team; share role-based cheat sheets",
          "30-minute training: how to log activity and read the pipeline",
          "Set a standing weekly 15-minute pipeline review",
        ],
      },
    ],
    metrics: [
      `Hours/week saved on ${topDrain.toLowerCase()}`,
      "Average lead response time (target: under 1 hour)",
      "Lead-to-customer conversion rate by source",
      "% of deals with complete data (owner, source, value)",
    ],
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 12 }} wrap={false}>
      <Text style={pdfStyles.subsectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function CrmGuideDocument({ company, content }: { company: Company; content: CrmGuideContent }) {
  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return (
    <Document title={`${company.name} — CRM Setup Guide`}>
      <BrandedPage>
        <Text style={pdfStyles.coverKicker}>Clinovyr CRM Setup Guide</Text>
        <Text style={pdfStyles.sectionTitle}>{company.name}</Text>
        <Text style={pdfStyles.body}>
          {company.industry} · {content.crmName} · {dateStr}
        </Text>
        <Text style={[pdfStyles.body, { marginTop: 8, marginBottom: 10 }]}>{content.intro}</Text>

        <Section title="1. Custom fields to create">
          {content.customFields.map((g) => (
            <View key={g.object} style={{ marginBottom: 6 }}>
              <Text style={[pdfStyles.body, { fontFamily: "Helvetica-Bold", marginBottom: 2 }]}>{g.object}</Text>
              {g.fields.map((f) => (
                <Text key={f} style={[pdfStyles.body, { marginBottom: 2 }]}>• {f}</Text>
              ))}
            </View>
          ))}
        </Section>

        <Section title="2. Pipeline stages">
          {content.pipelineStages.map((s, i) => (
            <Text key={s.stage} style={[pdfStyles.body, { marginBottom: 3 }]}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{i + 1}. {s.stage} — </Text>
              {s.definition}
            </Text>
          ))}
        </Section>

        <Section title="3. Automations to build">
          {content.automations.map((a) => (
            <View key={a.name} style={[pdfStyles.card, { marginBottom: 8 }]}>
              <Text style={pdfStyles.cardTitle}>{a.name}</Text>
              <Text style={[pdfStyles.muted, { marginBottom: 3 }]}>Trigger: {a.trigger}</Text>
              {a.steps.map((st, i) => (
                <Text key={st} style={[pdfStyles.body, { marginBottom: 1 }]}>{i + 1}. {st}</Text>
              ))}
              <Text style={[pdfStyles.muted, { marginTop: 3 }]}>Build with: {a.tools}</Text>
            </View>
          ))}
        </Section>

        <Section title="4. Lead scoring rules">
          {content.leadScoring.map((r) => (
            <Text key={r} style={[pdfStyles.body, { marginBottom: 2 }]}>• {r}</Text>
          ))}
        </Section>

        <Section title="5. Reports & dashboards to set up">
          {content.reporting.map((r) => (
            <Text key={r} style={[pdfStyles.body, { marginBottom: 2 }]}>• {r}</Text>
          ))}
        </Section>

        <Section title="6. Data hygiene rules">
          {content.dataHygiene.map((r) => (
            <Text key={r} style={[pdfStyles.body, { marginBottom: 2 }]}>• {r}</Text>
          ))}
        </Section>

        <Section title="7. Rollout plan">
          {content.rollout.map((p) => (
            <View key={p.title} style={{ marginBottom: 6 }}>
              <Text style={[pdfStyles.body, { fontFamily: "Helvetica-Bold", marginBottom: 2 }]}>{p.title}</Text>
              {p.steps.map((st, i) => (
                <Text key={st} style={[pdfStyles.body, { marginBottom: 1 }]}>{i + 1}. {st}</Text>
              ))}
            </View>
          ))}
        </Section>

        <Section title="8. Success metrics">
          {content.metrics.map((m) => (
            <View key={m} style={pdfStyles.checkboxRow}>
              <View style={pdfStyles.checkbox} />
              <Text style={pdfStyles.body}>{m}</Text>
            </View>
          ))}
        </Section>

        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Want this built for you? Clinovyr configures {content.crmName} end to end —
            fields, pipeline, automations, and live AI follow-up — in a working session.
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export const generateCrmSetupGuide: DeliverableGenerator = async ({ company, survey, formData }) => {
  const fallback = buildFallback(company, survey, formData);
  const crm = resolveCrm(formData);

  const { data: content } = await callClaudeJson<CrmGuideContent>({
    system:
      "You are a senior Clinovyr CRM consultant writing a detailed, immediately-actionable CRM setup guide a small-business owner can follow without help. Output ONLY valid JSON matching this exact shape: { crmName: string, intro: string, customFields: [{object: string, fields: string[]}], pipelineStages: [{stage: string, definition: string}], automations: [{name: string, trigger: string, steps: string[], tools: string}], leadScoring: string[], reporting: string[], dataHygiene: string[], rollout: [{title: string, steps: string[]}], metrics: string[] }. " +
      "Requirements: be SPECIFIC to the company's actual CRM and industry — name real fields, real pipeline stages, and concrete automation recipes (exact trigger + step-by-step actions) the owner can replicate in their CRM's workflow builder. Provide 3 field groups (Contacts, Deals/Opportunities, Companies) with 3-5 fields each including field type and why; 5-6 pipeline stages with one-line definitions; 3-4 automations with a clear trigger and 3 numbered steps each; 4-5 lead-scoring rules; 4-5 reports; 4 data-hygiene rules; a 3-phase rollout; and 4 success metrics. No placeholders, no brackets, no vague filler — every line must be usable.",
    prompt: `Company: ${company.name}
Industry: ${company.industry}
Size: ${company.size}
CRM in use: ${crm}
Other tools: ${[...(formData?.emailTools ?? []), ...(formData?.scheduling ?? [])].join(", ") || "n/a"}
Top time drains: ${formData?.timeDrainsRanked?.slice(0, 3).join(", ") ?? "N/A"}
Readiness tier: ${survey.tier ?? "Developing"}

Write a complete, ${crm}-specific, ${company.industry}-specific CRM setup guide.`,
    maxTokens: 3500,
    fallback,
    validate: (v) =>
      Array.isArray(v.customFields) && v.customFields.length >= 2 &&
      Array.isArray(v.automations) && v.automations.length >= 2 &&
      Array.isArray(v.pipelineStages) && v.pipelineStages.length >= 3,
  });

  const buffer = await renderPdfDocument(<CrmGuideDocument company={company} content={content} />);
  return pdfOutput("crm-setup-guide", buffer, {
    filename: "crm-setup-guide.pdf",
    displayName: "CRM Setup Guide",
  });
};
