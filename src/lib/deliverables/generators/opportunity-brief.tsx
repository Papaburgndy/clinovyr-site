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
import { enrichTopOpportunities } from "@/lib/opportunities";
import type { AssessmentFormData } from "@/types/assessment";

type OpportunityBriefContent = {
  headline: string;
  summary: string;
  whyFirst: string;
  howItWorks: string[];
  successCriteria: string[];
  timeline: string;
  roiRange: string;
};

function buildFallback(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): OpportunityBriefContent {
  const opportunities = enrichTopOpportunities(
    survey.topOpportunities,
    company.industry,
    survey.estimatedROI,
  );
  const primary = opportunities[0];
  const topDrain = formData?.timeDrainsRanked?.[0] ?? "daily operations";
  return {
    headline: primary?.name ?? survey.biggestOpportunity ?? "Workflow automation",
    summary:
      primary?.description ??
      survey.executiveSummary ??
      `A high-impact automation aligned to ${company.name}'s assessment, targeting ${topDrain.toLowerCase()}.`,
    whyFirst: `Your assessment indicates ${
      survey.readinessStatement ??
      "strong potential to capture quick wins without disrupting core operations"
    }. Starting here minimizes risk while proving ROI for a broader rollout.`,
    howItWorks: [
      `Map the current ${topDrain.toLowerCase()} process and baseline the hours it consumes`,
      "Configure the automation in a sandbox using tools you already own",
      "Pilot with 2–3 team members and measure hours saved",
      "Document the SOP and roll out to the full team",
    ],
    successCriteria: [
      `Measurable hours saved on ${topDrain.toLowerCase()} within 30 days`,
      "Documented SOP and staff training completion",
      "Leadership review with an updated ROI worksheet",
    ],
    timeline: primary?.timeToImplement ?? "4–8 weeks",
    roiRange: primary?.roiRange ?? survey.estimatedROI ?? "Contact Clinovyr",
  };
}

function OpportunityBriefDocument({
  company,
  survey,
  content,
}: {
  company: Company;
  survey: Survey;
  content: OpportunityBriefContent;
}) {
  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return (
    <Document title={`${company.name} — Opportunity Brief`}>
      <BrandedPage>
        <Text style={pdfStyles.coverKicker}>Clinovyr Opportunity Brief</Text>
        <Text style={pdfStyles.sectionTitle}>{company.name}</Text>
        <Text style={pdfStyles.body}>
          {company.industry} · {company.size} · Readiness {survey.score ?? "—"}/100
          ({survey.tier ?? "TBD"}) · {dateStr}
        </Text>

        <Text style={[pdfStyles.subsectionTitle, { marginTop: 12 }]}>
          Primary opportunity
        </Text>
        <Text style={[pdfStyles.cardTitle, { fontSize: 14, color: "#1a6b5a" }]}>
          {content.headline}
        </Text>
        <Text style={[pdfStyles.body, { marginTop: 4 }]}>{content.summary}</Text>

        <View style={[pdfStyles.card, { marginTop: 6 }]}>
          <Text style={pdfStyles.muted}>
            Timeline: {content.timeline} · ROI range: {content.roiRange}
          </Text>
        </View>

        <Text style={pdfStyles.subsectionTitle}>Why this first</Text>
        <Text style={pdfStyles.body}>{content.whyFirst}</Text>

        <Text style={pdfStyles.subsectionTitle}>How it works</Text>
        {content.howItWorks.map((step, i) => (
          <Text key={step} style={pdfStyles.body}>
            {i + 1}. {step}
          </Text>
        ))}

        <Text style={pdfStyles.subsectionTitle}>Success criteria</Text>
        {content.successCriteria.map((c) => (
          <View key={c} style={pdfStyles.checkboxRow}>
            <View style={pdfStyles.checkbox} />
            <Text style={pdfStyles.body}>{c}</Text>
          </View>
        ))}

        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Recommended engagement:{" "}
            {survey.recommendedPkg ?? "AI Opportunity Audit ($1,500)"}. Book a call
            to confirm scope and owners.
          </Text>
        </View>

        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export const generateOpportunityBrief: DeliverableGenerator = async ({
  company,
  survey,
  formData,
}) => {
  const fallback = buildFallback(company, survey, formData);

  const { data: content } = await callClaudeJson<OpportunityBriefContent>({
    system:
      "You are a Clinovyr AI consultant writing a one-page opportunity brief for a small-business owner. Output ONLY valid JSON matching: { headline: string, summary: string (2-3 sentences), whyFirst: string (2-3 sentences), howItWorks: string[] (4 concrete steps), successCriteria: string[] (3 measurable items), timeline: string, roiRange: string }. Be specific to the business and industry. No placeholders, no brackets.",
    prompt: `Company: ${company.name}
Industry: ${company.industry}
Size: ${company.size} · Revenue: ${company.revenue}
Readiness score: ${survey.score ?? "—"}/100 (${survey.tier ?? "TBD"})
Top time drains: ${formData?.timeDrainsRanked?.slice(0, 3).join(", ") ?? "N/A"}
Biggest opportunity (from scoring): ${survey.biggestOpportunity ?? "N/A"}
Estimated ROI: ${survey.estimatedROI ?? "N/A"}
Biggest concern: ${formData?.biggestConcern ?? "N/A"}
Recommended package: ${survey.recommendedPkg ?? "AI Opportunity Audit"}

Write the single highest-ROI opportunity brief for this business.`,
    maxTokens: 1100,
    fallback,
    validate: (v) =>
      typeof v.headline === "string" &&
      Array.isArray(v.howItWorks) &&
      v.howItWorks.length >= 3 &&
      Array.isArray(v.successCriteria),
  });

  const buffer = await renderPdfDocument(
    <OpportunityBriefDocument
      company={company}
      survey={survey}
      content={content}
    />,
  );
  return pdfOutput("opportunity-brief", buffer, {
    filename: "opportunity-brief.pdf",
    displayName: "Opportunity Brief",
  });
};
