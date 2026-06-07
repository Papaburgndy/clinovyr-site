import React from "react";
import type { Company } from "@prisma/client";
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
import { enrichTopOpportunities } from "@/lib/opportunities";
import type { AssessmentFormData } from "@/types/assessment";

type ChecklistSection = { title: string; items: string[] };
type ChecklistContent = { sections: ChecklistSection[]; intro: string };

function buildChecklistFallback(
  company: Company,
  formData: AssessmentFormData | null,
  topOpportunity: string,
  recommendedPkg: string | null,
): ChecklistContent {
  const drain = formData?.timeDrainsRanked?.[0]?.toLowerCase() ?? "your priority workflow";
  const crm = formData?.crm?.[0] ?? "your CRM";
  return {
    intro: `Printable implementation checklist for ${company.name} (${company.industry}, ${company.size}). Primary focus: ${topOpportunity}. Work through it in order and check off each item — most teams complete the pilot in about six weeks.`,
    sections: [
      {
        title: "Week 1 — Discovery & Alignment",
        items: [
          `Confirm your top 3 time drains with department leads and pick one to automate first (${drain}).`,
          `Inventory your current tools (${crm}, email, scheduling) and note where data is re-typed by hand.`,
          "Name an internal AI champion (1–2 hrs/week) accountable for setup and adoption.",
          `Time the current ${drain} process for a few days to capture a baseline (minutes per task, tasks per week).`,
          `Schedule the Clinovyr kickoff for ${recommendedPkg ?? "your engagement"}.`,
        ],
      },
      {
        title: "Weeks 2–3 — Design & Build",
        items: [
          `Write the target workflow as a step-by-step SOP, marking which steps AI will draft vs. a human will approve.`,
          `Stand up a business-tier AI workspace (Claude Team or ChatGPT Team) — never personal accounts for customer data.`,
          `Build the automation in a Make.com or Zapier test scenario connected to ${crm}.`,
          "Create 2–3 approved prompt/message templates so output is consistent and on-brand.",
          "Define escalation rules: what the AI must hand to a person, and how.",
        ],
      },
      {
        title: "Weeks 4–6 — Pilot & Measure",
        items: [
          "Turn the automation on for 2–3 users (or one location) with the human-approval step active.",
          "Hold a 15-minute daily standup the first week to catch issues fast.",
          "Track hours saved, response/reply rate, and error rate against your baseline.",
          "Iterate prompts, timing, and rules from real results.",
          "Decide go/no-go for full rollout based on the numbers.",
        ],
      },
      {
        title: "Rollout",
        items: [
          "Enable for the whole team with role-based cheat sheets.",
          "Run a 30-minute training: how to log activity, approve output, and escalate.",
          "Set a standing weekly 15-minute review of the pipeline and metrics.",
        ],
      },
      {
        title: "Ongoing optimization",
        items: [
          "Monthly ROI review with leadership using tracked numbers.",
          "Refresh SOPs and prompt templates as processes change.",
          "Document lessons learned and scope the next automation.",
        ],
      },
    ],
  };
}

function ChecklistDocument({
  companyName,
  industry,
  content,
}: {
  companyName: string;
  industry: string;
  content: ChecklistContent;
}) {
  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });

  return (
    <Document title={`${companyName} — Implementation Checklist`}>
      <BrandedPage>
        <Text style={pdfStyles.coverKicker}>Clinovyr Implementation Checklist</Text>
        <Text style={pdfStyles.sectionTitle}>{companyName}</Text>
        <Text style={pdfStyles.body}>{industry} · Generated {dateStr}</Text>
        <Text style={[pdfStyles.body, { marginTop: 8, marginBottom: 16 }]}>{content.intro}</Text>

        {content.sections.map((section) => (
          <View key={section.title} style={{ marginBottom: 14 }}>
            <Text style={pdfStyles.subsectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <View key={item} style={pdfStyles.checkboxRow}>
                <View style={pdfStyles.checkbox} />
                <Text style={pdfStyles.body}>{item}</Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={pdfStyles.muted}>
          Tip: Print this checklist and check off items as you complete them. Bring questions to
          your Clinovyr working sessions.
        </Text>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export const generateImplementationChecklist: DeliverableGenerator = async ({
  company,
  survey,
  formData,
}) => {
  const opportunities = enrichTopOpportunities(
    survey.topOpportunities,
    company.industry,
    survey.estimatedROI,
  );
  const topOpportunity = opportunities[0]?.name ?? survey.biggestOpportunity ?? "workflow automation";
  const fallback = buildChecklistFallback(
    company,
    formData,
    topOpportunity,
    survey.recommendedPkg,
  );

  const { data: content } = await callClaudeJson<ChecklistContent>({
    system:
      "You are a Clinovyr implementation consultant. Output ONLY valid JSON: { intro: string, sections: [{ title, items: string[] }] }. Create 4-5 sections with 5 actionable checklist items each. " +
      "Each item must be a concrete, checkable task naming the tool and the specific output (e.g. 'Build the appointment-reminder workflow in Make.com: 72h/24h/2h SMS via Twilio'), tailored to the company's industry and top opportunity. No vague items.",
    prompt: `Company: ${company.name}
Industry: ${company.industry}
Size: ${company.size} (${formData?.employees ?? "unknown"} employees)
Top opportunity: ${topOpportunity}
Top time drains: ${formData?.timeDrainsRanked?.slice(0, 3).join(", ") ?? "N/A"}
Recommended package: ${survey.recommendedPkg ?? "AI Readiness Assessment"}
Biggest concern: ${formData?.biggestConcern ?? "N/A"}

Create a tailored printable implementation checklist.`,
    maxTokens: 2500,
    fallback,
    validate: (v) => Array.isArray(v.sections) && v.sections.length >= 3,
  });

  const buffer = await renderPdfDocument(
    <ChecklistDocument companyName={company.name} industry={company.industry} content={content} />,
  );

  return pdfOutput("implementation-checklist", buffer);
};
