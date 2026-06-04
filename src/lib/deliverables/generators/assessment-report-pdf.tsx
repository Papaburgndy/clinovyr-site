import React from "react";
import type { Company, Survey } from "@prisma/client";
import { callClaudeText } from "@/lib/deliverables/generators/claude-helper";
import { pdfOutput } from "@/lib/deliverables/generators/shared";
import type { DeliverableGenerator } from "@/lib/deliverables/generators/types";
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
import { resolveScore } from "@/lib/deliverables/artifacts";
import { enrichTopOpportunities, TIER_INFO } from "@/lib/opportunities";
import type { AssessmentFormData } from "@/types/assessment";
import type { AIReadinessScore } from "@/lib/scoring";

const CATEGORY_LABELS: Record<keyof AIReadinessScore["categoryScores"], string> = {
  techStack: "Tech Stack",
  processMaturity: "Process Maturity",
  dataReadiness: "Data Readiness",
  adoptionReadiness: "Adoption Readiness",
  roi_potential: "ROI Potential",
};

type AssessmentAnalysis = {
  categoryInsights: string;
  roadmap90Day: string;
  deeperAnalysis: string;
};

function buildAnalysisFallback(
  company: Company,
  score: AIReadinessScore,
  formData: AssessmentFormData | null,
): AssessmentAnalysis {
  const topDrain = formData?.timeDrainsRanked?.[0] ?? "operational workflows";
  const tierDesc = TIER_INFO[score.tier]?.description ?? "";
  const sorted = Object.entries(score.categoryScores).sort((a, b) => b[1] - a[1]);
  const weakest = Object.entries(score.categoryScores).sort((a, b) => a[1] - b[1]);

  return {
    categoryInsights: `Your strongest area is ${CATEGORY_LABELS[sorted[0]?.[0] as keyof typeof CATEGORY_LABELS] ?? "process maturity"}, while ${CATEGORY_LABELS[weakest[0]?.[0] as keyof typeof CATEGORY_LABELS] ?? "adoption readiness"} presents the greatest opportunity for improvement. For a ${company.industry} business of ${company.size}, closing these gaps will directly reduce time spent on ${topDrain.toLowerCase()}.`,
    deeperAnalysis: `${company.name} is in the ${score.tier} tier with an overall score of ${score.overallScore}/100. ${tierDesc} Your tech stack and process documentation are the foundation — prioritize connecting existing tools before adding new platforms.`,
    roadmap90Day: `Days 1–30: Document current ${topDrain.toLowerCase()} workflow and assign an internal AI champion.\nDays 31–60: Launch pilot automation on your highest-ROI opportunity with 2–3 team members.\nDays 61–90: Measure hours saved, refine SOPs, and plan full-team rollout with Clinovyr support.`,
  };
}

async function fetchAssessmentAnalysis(
  company: Company,
  survey: Survey,
  score: AIReadinessScore,
  formData: AssessmentFormData | null,
): Promise<AssessmentAnalysis> {
  const fallback = buildAnalysisFallback(company, score, formData);
  const topDrain = formData?.timeDrainsRanked?.[0] ?? "operational workflows";

  const { text } = await callClaudeText({
    system:
      "You are a Clinovyr AI consultant writing assessment report sections. Be specific to the client's industry and data. Output plain text with three sections separated by ---SECTION--- markers. No markdown headers.",
    prompt: `Company: ${company.name} (${company.industry}, ${company.size})
Score: ${score.overallScore}/100 (${score.tier})
Category scores: tech ${score.categoryScores.techStack}, process ${score.categoryScores.processMaturity}, data ${score.categoryScores.dataReadiness}, adoption ${score.categoryScores.adoptionReadiness}, ROI ${score.categoryScores.roi_potential}
Top drains: ${formData?.timeDrainsRanked?.slice(0, 3).join(", ") ?? topDrain}
Opportunities: ${score.topOpportunities.join("; ")}
Quick wins: ${score.quickWins.join("; ")}
Executive summary: ${survey.executiveSummary ?? "N/A"}

Write categoryInsights (1 paragraph), deeperAnalysis (2 paragraphs), roadmap90Day (Days 1-30, 31-60, 61-90). Separate with ---SECTION---`,
    maxTokens: 1400,
    fallback: `${fallback.categoryInsights}\n---SECTION---\n${fallback.deeperAnalysis}\n---SECTION---\n${fallback.roadmap90Day}`,
  });

  const parts = text.split("---SECTION---").map((p) => p.trim());
  if (parts.length >= 3) {
    return {
      categoryInsights: parts[0] || fallback.categoryInsights,
      deeperAnalysis: parts[1] || fallback.deeperAnalysis,
      roadmap90Day: parts[2] || fallback.roadmap90Day,
    };
  }

  return fallback;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ marginBottom: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 9 }}>{label}</Text>
        <Text style={{ fontSize: 9, color: BRAND.accent }}>{value}/100</Text>
      </View>
      <View style={pdfStyles.barTrack}>
        <View style={[pdfStyles.barFill, { width: `${Math.min(value, 100)}%` }]} />
      </View>
    </View>
  );
}

function AssessmentReportDocument({
  company,
  survey,
  score,
  analysis,
  opportunities,
  quickWins,
}: {
  company: Company;
  survey: Survey;
  score: AIReadinessScore;
  analysis: AssessmentAnalysis;
  opportunities: ReturnType<typeof enrichTopOpportunities>;
  quickWins: string[];
}) {
  const summary =
    survey.executiveSummary ??
    `${company.name} completed the Clinovyr AI Readiness Assessment.`;
  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });

  return (
    <Document title={`${company.name} — AI Readiness Assessment`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr · Intelligence, Applied.</Text>
        <Text style={pdfStyles.coverTitle}>AI Readiness Assessment</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.industry} · {company.size}</Text>
        <Text style={pdfStyles.coverMeta}>Prepared {dateStr}</Text>
        <View style={{ marginTop: 48, borderTopWidth: 1, borderTopColor: BRAND.accent, paddingTop: 16 }}>
          <Text style={{ fontSize: 48, fontFamily: "Times-Roman", color: BRAND.accentLight }}>
            {score.overallScore}
            <Text style={{ fontSize: 20, color: BRAND.muted }}>/100</Text>
          </Text>
          <Text style={{ fontSize: 12, color: BRAND.cream, marginTop: 4 }}>{score.tier} Tier</Text>
        </View>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Score Overview</Text>
        <Text style={pdfStyles.scoreLabel}>Overall readiness</Text>
        <Text style={pdfStyles.scoreHero}>{score.overallScore}/100</Text>
        <Text style={pdfStyles.body}>
          Tier: {score.tier} · Est. annual ROI: {score.estimatedAnnualROI}
        </Text>
        <Text style={pdfStyles.body}>{TIER_INFO[score.tier]?.description}</Text>
        <Text style={[pdfStyles.sectionTitle, { marginTop: 16 }]}>Executive Summary</Text>
        <Text style={pdfStyles.body}>{summary}</Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Category Breakdown</Text>
        {(Object.keys(score.categoryScores) as Array<keyof typeof score.categoryScores>).map(
          (key) => (
            <ScoreBar key={key} label={CATEGORY_LABELS[key]} value={score.categoryScores[key]} />
          ),
        )}
        <Text style={[pdfStyles.body, { marginTop: 12 }]}>{analysis.categoryInsights}</Text>
        <Text style={pdfStyles.sectionTitle}>Strategic Analysis</Text>
        <Text style={pdfStyles.body}>{analysis.deeperAnalysis}</Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Top Opportunities</Text>
        {opportunities.slice(0, 3).map((opp, i) => (
          <View key={opp.name} style={pdfStyles.card}>
            <Text style={pdfStyles.cardTitle}>{i + 1}. {opp.name}</Text>
            <Text style={pdfStyles.body}>{opp.description}</Text>
            <Text style={pdfStyles.muted}>Timeline: {opp.timeToImplement} · ROI: {opp.roiRange}</Text>
          </View>
        ))}
        <Text style={pdfStyles.sectionTitle}>Quick Wins</Text>
        {quickWins.slice(0, 3).map((win, i) => (
          <View key={win} style={pdfStyles.checkboxRow}>
            <View style={pdfStyles.checkbox} />
            <Text style={pdfStyles.body}>{i + 1}. {win}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>90-Day Roadmap</Text>
        <Text style={pdfStyles.body}>{analysis.roadmap90Day}</Text>
        <Text style={pdfStyles.sectionTitle}>Recommended Next Steps</Text>
        <Text style={pdfStyles.body}>
          {survey.nextStep ??
            `We recommend ${score.recommendedPackage} — a focused engagement to deploy your top automation within 30 days.`}
        </Text>
        {survey.biggestOpportunity ? (
          <>
            <Text style={pdfStyles.subsectionTitle}>Biggest Opportunity</Text>
            <Text style={pdfStyles.body}>{survey.biggestOpportunity}</Text>
          </>
        ) : null}
        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Ready to move forward? Clinovyr helps {company.industry} businesses implement AI that
            saves time and drives measurable ROI. Email clinovyr@gmail.com or visit clinovyr.com.
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export const generateAssessmentReportPdf: DeliverableGenerator = async (ctx) => {
  const { company, survey, formData } = ctx;
  if (survey.status !== "complete") return null;

  const score = resolveScore(formData, survey);
  if (!score) return null;

  const opportunities = enrichTopOpportunities(
    survey.topOpportunities,
    company.industry,
    survey.estimatedROI,
  );
  const quickWins =
    score.quickWins.length > 0 ? score.quickWins : opportunities.slice(0, 3).map((o) => o.name);

  const analysis = await fetchAssessmentAnalysis(company, survey, score, formData);
  const buffer = await renderPdfDocument(
    <AssessmentReportDocument
      company={company}
      survey={survey}
      score={score}
      analysis={analysis}
      opportunities={opportunities}
      quickWins={quickWins}
    />,
  );

  return pdfOutput("assessment-report-pdf", buffer);
};
