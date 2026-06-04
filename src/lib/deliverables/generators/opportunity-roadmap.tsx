import React from "react";
import { callClaudeJson } from "@/lib/deliverables/generators/claude-helper";
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
import { enrichTopOpportunities } from "@/lib/opportunities";

type PhaseMilestone = { title: string; items: string[] };
type RoadmapPhases = { phase1: PhaseMilestone; phase2: PhaseMilestone; phase3: PhaseMilestone };

const PRIORITY_STYLES = [pdfStyles.priorityHigh, pdfStyles.priorityMedium, pdfStyles.priorityLow];
const PRIORITY_LABELS = ["High Priority", "Medium Priority", "Growth Priority"];

function buildPhaseFallback(
  industry: string,
  opportunities: ReturnType<typeof enrichTopOpportunities>,
): RoadmapPhases {
  const [first, second, third] = opportunities;
  return {
    phase1: {
      title: "Phase 1 — Foundation (Days 1–30)",
      items: [
        `Map ${first?.name ?? "priority workflow"} end-to-end`,
        "Assign internal AI champion and document baseline hours",
        "Configure sandbox environment for pilot testing",
        `Staff kickoff communication for ${industry}`,
      ],
    },
    phase2: {
      title: "Phase 2 — Pilot & Deploy (Days 31–60)",
      items: [
        `Launch pilot: ${first?.name ?? "top automation"}`,
        second ? `Begin design for ${second.name}` : "Expand automation rules from pilot feedback",
        "Weekly ROI tracking and staff feedback sessions",
        "Refine SOPs and escalation rules",
      ],
    },
    phase3: {
      title: "Phase 3 — Scale & Optimize (Days 61–90+)",
      items: [
        third ? `Roll out ${third.name}` : "Full-team rollout of proven automations",
        "Monthly ROI review with leadership",
        "Knowledge base update and training refresh",
        "Plan AI Operations Retainer for ongoing optimization",
      ],
    },
  };
}

function OpportunityRoadmapDocument({
  companyName,
  industry,
  opportunities,
  phases,
  score,
  tier,
}: {
  companyName: string;
  industry: string;
  opportunities: ReturnType<typeof enrichTopOpportunities>;
  phases: RoadmapPhases;
  score: number | null;
  tier: string | null;
}) {
  const phaseList = [phases.phase1, phases.phase2, phases.phase3];

  return (
    <Document title={`${companyName} — AI Opportunity Map`}>
      <BrandedPage>
        <Text style={pdfStyles.coverKicker}>Clinovyr Opportunity Map</Text>
        <Text style={pdfStyles.sectionTitle}>Your AI Opportunity Map</Text>
        <Text style={pdfStyles.body}>
          {companyName} · {industry}
          {score != null ? ` · Score ${score}/100 (${tier})` : ""}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12 }}>
          {opportunities.slice(0, 3).map((opp, i) => (
            <View
              key={opp.name}
              style={[
                pdfStyles.card,
                PRIORITY_STYLES[i] ?? pdfStyles.priorityLow,
                { width: "30%", marginRight: 8, marginBottom: 8 },
              ]}
            >
              <Text style={[pdfStyles.muted, { marginBottom: 4 }]}>{PRIORITY_LABELS[i]}</Text>
              <Text style={pdfStyles.cardTitle}>{opp.name}</Text>
              <Text style={[pdfStyles.body, { fontSize: 8 }]}>{opp.description}</Text>
              <Text style={pdfStyles.muted}>Timeline: {opp.timeToImplement}</Text>
            </View>
          ))}
        </View>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Phased Implementation Timeline</Text>
        <Text style={[pdfStyles.body, { marginBottom: 16 }]}>
          Industry-specific milestones for {industry}.
        </Text>
        {phaseList.map((phase) => (
          <View key={phase.title} style={pdfStyles.timelinePhase}>
            <Text style={pdfStyles.subsectionTitle}>{phase.title}</Text>
            {phase.items.map((item) => (
              <View key={item} style={pdfStyles.checkboxRow}>
                <View style={[pdfStyles.checkbox, { borderColor: BRAND.accentLight }]} />
                <Text style={pdfStyles.body}>{item}</Text>
              </View>
            ))}
          </View>
        ))}
        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Clinovyr guides each phase with hands-on implementation and ROI tracking.
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export const generateOpportunityRoadmap: DeliverableGenerator = async ({ company, survey }) => {
  const opportunities = enrichTopOpportunities(
    survey.topOpportunities,
    company.industry,
    survey.estimatedROI,
  );
  const fallback = buildPhaseFallback(company.industry, opportunities);

  const { data: phases } = await callClaudeJson<RoadmapPhases>({
    system:
      "You are a Clinovyr implementation strategist. Output ONLY valid JSON with phase1, phase2, phase3. Each has title and items (3-4 strings). Be industry-specific.",
    prompt: `Company: ${company.name}, Industry: ${company.industry}, Size: ${company.size}
Opportunities: ${opportunities.map((o) => o.name).join("; ") || "workflow automation"}
JSON: { "phase1": { "title": "...", "items": [] }, "phase2": {...}, "phase3": {...} }`,
    maxTokens: 900,
    fallback,
    validate: (v) =>
      Boolean(v.phase1?.items?.length && v.phase2?.items?.length && v.phase3?.items?.length),
  });

  const buffer = await renderPdfDocument(
    <OpportunityRoadmapDocument
      companyName={company.name}
      industry={company.industry}
      opportunities={opportunities}
      phases={phases}
      score={survey.score}
      tier={survey.tier}
    />,
  );

  return pdfOutput("opportunity-roadmap", buffer);
};
