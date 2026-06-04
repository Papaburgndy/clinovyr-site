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
  return {
    intro: `Printable implementation checklist for ${company.name} (${company.industry}, ${company.size}). Focus: ${topOpportunity}.`,
    sections: [
      {
        title: "Week 1 — Discovery & Alignment",
        items: [
          "Confirm top 3 time drains with department leads",
          `Map current tools for ${company.industry} workflows`,
          "Assign internal AI champion",
          `Schedule Clinovyr kickoff for ${recommendedPkg ?? "your engagement"}`,
        ],
      },
      {
        title: "Weeks 2–3 — Design & Pilot",
        items: [
          `Document baseline hours on ${formData?.timeDrainsRanked?.[0] ?? "priority workflow"}`,
          `Select pilot automation: ${topOpportunity}`,
          "Draft staff communication and training outline",
          "Configure test environment (sandbox CRM / email)",
        ],
      },
      {
        title: "Weeks 4–6 — Deploy & Measure",
        items: [
          "Launch pilot with 2–3 users",
          "Track hours saved and error rate weekly",
          "Gather staff feedback; iterate prompts and rules",
          "Plan rollout to full team",
        ],
      },
      {
        title: "Ongoing",
        items: [
          "Monthly ROI review with Clinovyr",
          "Refresh playbooks as processes change",
          "Document lessons learned for next automation",
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
      "You are a Clinovyr implementation consultant. Output ONLY valid JSON: { intro: string, sections: [{ title, items: string[] }] }. Create 4 sections with 4-5 actionable checklist items each. Items should be printable task statements.",
    prompt: `Company: ${company.name}
Industry: ${company.industry}
Size: ${company.size} (${formData?.employees ?? "unknown"} employees)
Top opportunity: ${topOpportunity}
Top time drains: ${formData?.timeDrainsRanked?.slice(0, 3).join(", ") ?? "N/A"}
Recommended package: ${survey.recommendedPkg ?? "AI Readiness Assessment"}
Biggest concern: ${formData?.biggestConcern ?? "N/A"}

Create a tailored printable implementation checklist.`,
    maxTokens: 1000,
    fallback,
    validate: (v) => Array.isArray(v.sections) && v.sections.length >= 3,
  });

  const buffer = await renderPdfDocument(
    <ChecklistDocument companyName={company.name} industry={company.industry} content={content} />,
  );

  return pdfOutput("implementation-checklist", buffer);
};
