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
  const secondDrain = formData?.timeDrainsRanked?.[1] ?? "manual data entry";
  const tierDesc = TIER_INFO[score.tier]?.description ?? "";
  const sorted = Object.entries(score.categoryScores).sort((a, b) => b[1] - a[1]);
  const weakest = Object.entries(score.categoryScores).sort((a, b) => a[1] - b[1]);
  const strongLabel = CATEGORY_LABELS[sorted[0]?.[0] as keyof typeof CATEGORY_LABELS] ?? "Process Maturity";
  const weakLabel = CATEGORY_LABELS[weakest[0]?.[0] as keyof typeof CATEGORY_LABELS] ?? "Adoption Readiness";
  const opps = score.topOpportunities ?? [];
  const primaryOpp = opps[0] ?? "automating customer follow-up";

  const interpret = (key: keyof typeof CATEGORY_LABELS, v: number): string => {
    const band = v >= 70 ? "strong" : v >= 45 ? "developing" : "an early-stage gap";
    const actions: Record<string, string> = {
      techStack: "connect your existing CRM, email, and scheduling tools with an automation layer (Make.com or Zapier) before buying anything new",
      processMaturity: "document your top 3 repeatable workflows as written SOPs so they can be automated reliably",
      dataReadiness: "clean and standardize your contact/customer records so AI has accurate context to work from",
      adoptionReadiness: "run a short, hands-on staff training and name an internal AI champion to drive day-to-day use",
      roi_potential: "start with the single highest-volume task to prove measurable hours saved within 30 days",
    };
    return `${CATEGORY_LABELS[key]} — ${v}/100 (${band}). To improve: ${actions[key] ?? "prioritize a focused pilot"}.`;
  };

  const categoryInsights =
    `Across five readiness dimensions, your strongest area is ${strongLabel} and your biggest opportunity is ${weakLabel}. Here is what each score means and the specific next move for a ${company.industry} business of ${company.size}:\n\n` +
    (Object.entries(score.categoryScores) as Array<[keyof typeof CATEGORY_LABELS, number]>)
      .map(([k, v]) => `• ${interpret(k, v)}`)
      .join("\n");

  const deeperAnalysis =
    `${company.name} sits in the ${score.tier} tier at ${score.overallScore}/100. ${tierDesc} In practical terms, that means the fastest, lowest-risk wins come from automating high-volume, rules-based work — beginning with ${topDrain.toLowerCase()} and ${secondDrain.toLowerCase()} — rather than complex, judgment-heavy tasks.\n\n` +
    `Where AI fits your operation: the goal is not to replace staff but to remove the repetitive load around ${topDrain.toLowerCase()}. A realistic first phase is an AI-assisted workflow that drafts, routes, and follows up automatically while a team member approves anything client-facing. Most ${company.industry.toLowerCase()} businesses your size recover several hours per week per person from this alone, which is the basis of the ROI estimate in your calculator.\n\n` +
    `Sequencing and risk: prove value on one workflow before expanding. Keep a human-review gate on every client-facing output, use business-tier AI tools (never personal accounts for customer data), and track hours saved weekly so the investment is defensible. Once the first automation is stable and adopted, layer in the next opportunity — ${opps[1] ?? "the second-ranked opportunity from your assessment"}.`;

  const roadmap90Day =
    `Days 1–30 — Foundation: Document your current ${topDrain.toLowerCase()} process step by step. Assign an internal AI champion (1–2 hrs/week). Connect your existing tools with Make.com or Zapier. Clean your contact data so records are consistent.\n` +
    `Days 31–60 — Pilot: Launch one automation targeting ${primaryOpp} with 2–3 team members. Add a human-approval step for anything client-facing. Track hours saved and reply rates weekly; tune the timing and copy from real results.\n` +
    `Days 61–90 — Scale: Roll the proven automation out to the full team with role-based cheat sheets. Add the next opportunity (${opps[1] ?? "second-ranked workflow"}). Hold a monthly ROI review and decide on an ongoing optimization cadence.`;

  return { categoryInsights, deeperAnalysis, roadmap90Day };
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
      "You are a Clinovyr AI consultant writing the core sections of a paid AI Readiness Report. Be specific to the client's industry, data, and scores — cite their actual numbers and tools. Output plain text with three sections separated by ---SECTION--- markers. No markdown headers. " +
      "Depth required: categoryInsights interprets each of their 5 category scores and what specifically to do about the weakest ones. deeperAnalysis (3 substantial paragraphs) covers where AI fits their operation, realistic ROI math, and risks/sequencing. roadmap90Day gives concrete named actions per phase (Days 1-30, 31-60, 61-90) with tools and owners. Write for a smart owner who wants specifics, not platitudes.",
    prompt: `Company: ${company.name} (${company.industry}, ${company.size})
Score: ${score.overallScore}/100 (${score.tier})
Category scores: tech ${score.categoryScores.techStack}, process ${score.categoryScores.processMaturity}, data ${score.categoryScores.dataReadiness}, adoption ${score.categoryScores.adoptionReadiness}, ROI ${score.categoryScores.roi_potential}
Top drains: ${formData?.timeDrainsRanked?.slice(0, 3).join(", ") ?? topDrain}
Opportunities: ${score.topOpportunities.join("; ")}
Quick wins: ${score.quickWins.join("; ")}
Executive summary: ${survey.executiveSummary ?? "N/A"}

Write categoryInsights (1-2 paragraphs), deeperAnalysis (3 paragraphs), roadmap90Day (Days 1-30, 31-60, 61-90 with specific named actions). Separate with ---SECTION---`,
    maxTokens: 4000,
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

  const computed = resolveScore(formData, survey);
  if (!computed) return null;

  // Single source of truth: the values the customer already saw on their
  // results page (persisted on the survey) win. We only keep the recomputed
  // category breakdown + quick wins, which aren't stored on the survey. This
  // guarantees the paid report's score, tier, ROI, and opportunities always
  // match the rest of the customer experience.
  const score: AIReadinessScore = {
    ...computed,
    overallScore: survey.score ?? computed.overallScore,
    tier: (survey.tier as AIReadinessScore["tier"]) ?? computed.tier,
    topOpportunities:
      Array.isArray(survey.topOpportunities) && survey.topOpportunities.length > 0
        ? (survey.topOpportunities as string[])
        : computed.topOpportunities,
    estimatedAnnualROI: survey.estimatedROI ?? computed.estimatedAnnualROI,
  };

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
