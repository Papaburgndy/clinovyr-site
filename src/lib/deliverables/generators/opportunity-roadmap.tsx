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
  const f = first?.name ?? "your highest-ROI workflow";
  const s = second?.name ?? "your second-ranked opportunity";
  const t = third?.name ?? "your third opportunity";
  return {
    phase1: {
      title: "Phase 1 — Foundation (Days 1–30)",
      items: [
        `Map "${f}" end-to-end (Owner: AI champion): write each step, who does it, and how long it takes today — this becomes your baseline.`,
        `Name an internal AI champion (1–2 hrs/week) accountable for setup, training, and weekly tracking.`,
        `Connect your existing tools with an automation layer (Make.com or Zapier) so data flows without manual copy-paste.`,
        `Clean and standardize your contact/customer data so AI has accurate context to work from.`,
        `Stand up a free AI workspace (Claude Team or ChatGPT Team) with a written "approved use" policy for ${industry}.`,
        `Send a short staff kickoff: what's changing, why, and the human-review rule for anything client-facing.`,
      ],
    },
    phase2: {
      title: "Phase 2 — Pilot & Deploy (Days 31–60)",
      items: [
        `Build and launch the "${f}" automation in Make.com with 2–3 team members (keep an approval step for client-facing output).`,
        `Track results weekly: hours saved, reply/response rate, and error rate vs. your Day-1 baseline.`,
        `Tune the timing, triggers, and message copy based on real responses — small changes compound.`,
        `Document edge cases and escalation rules into a one-page SOP the whole team can follow.`,
        `Begin design of "${s}" using what you learned from the first automation.`,
      ],
    },
    phase3: {
      title: "Phase 3 — Scale & Optimize (Days 61–90+)",
      items: [
        `Roll "${f}" out to the entire team with role-based cheat sheets and a 30-minute live training.`,
        `Launch "${s}", and scope "${t}" as the next build.`,
        `Hold a monthly ROI review with leadership using your tracked numbers; decide what to automate next.`,
        `Update your knowledge base/SOPs as workflows change so AI output stays accurate.`,
        `Decide on an ongoing optimization cadence (in-house or a Clinovyr retainer) to keep compounding gains.`,
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
      "You are a Clinovyr implementation strategist writing a concrete 90-day execution plan. Output ONLY valid JSON: { phase1: {title, items}, phase2: {title, items}, phase3: {title, items} }. " +
      "Each phase has 5-6 items. Every item must be a SPECIFIC, actionable step — name the tool, the owner role, and the concrete output (e.g. 'Build the lead-response workflow in HubSpot (Ops owner): instant SMS + 1-hour call task'). Reference the company's actual opportunities and industry. No vague filler like 'assign a champion' without saying what they do. Keep each item one sentence.",
    prompt: `Company: ${company.name}
Industry: ${company.industry}
Size: ${company.size}
Top opportunities (in priority order): ${opportunities.map((o) => `${o.name} — ${o.description}`).join("; ") || "workflow automation"}

Write a specific, industry-tailored 90-day roadmap (Phase 1 Days 1-30 foundation, Phase 2 Days 31-60 pilot & deploy, Phase 3 Days 61-90+ scale & optimize). Each item must be something the owner could hand to a team member and they'd know exactly what to do.`,
    maxTokens: 3000,
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
