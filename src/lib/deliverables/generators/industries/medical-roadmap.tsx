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
  MEDICAL_ROADMAP_SYSTEM,
  buildMedicalContextBlock,
} from "@/lib/deliverables/generators/industries/medical-shared";
import type { AssessmentFormData } from "@/types/assessment";

export type RoadmapWeek = {
  week: number;
  phase: string;
  tasks: Array<{
    task: string;
    owner: string;
    tools: string;
    hours: string;
  }>;
};

export type MedicalRoadmapContent = {
  weeks: RoadmapWeek[];
};

const PHASE_BY_WEEK: Record<number, string> = {
  1: "Discovery & vendor selection",
  2: "Discovery & vendor selection",
  3: "Setup & configuration",
  4: "Setup & configuration",
  5: "Staff training",
  6: "Staff training",
  7: "Pilot (small patient cohort)",
  8: "Pilot (small patient cohort)",
  9: "Full rollout",
  10: "Full rollout",
  11: "Optimization & measurement",
  12: "Optimization & measurement",
};

function buildRoadmapFallback(company: Company): MedicalRoadmapContent {
  const weeks: RoadmapWeek[] = [];
  for (let w = 1; w <= 12; w++) {
    const phase = PHASE_BY_WEEK[w] ?? "Implementation";
    const tasksByWeek: Record<number, RoadmapWeek["tasks"]> = {
      1: [
        {
          task: "Inventory systems and sign BAA checklist with vendors",
          owner: "Practice Administrator",
          tools: "EHR admin, compliance officer",
          hours: "6h",
        },
        {
          task: "Select appointment reminder platform (Twilio + Make.com)",
          owner: "Office Manager",
          tools: "Make.com trial",
          hours: "4h",
        },
      ],
      2: [
        {
          task: "Document webhook fields from PMS/EHR",
          owner: "IT vendor / Clinovyr",
          tools: "API docs, Postman",
          hours: "8h",
        },
      ],
      3: [
        {
          task: "Import Make.com blueprint and connect Twilio",
          owner: "Clinovyr consultant",
          tools: "Make.com, Twilio",
          hours: "6h",
        },
      ],
      4: [
        {
          task: "Configure Google Sheets logging and test payloads",
          owner: "Office Manager",
          tools: "Google Workspace",
          hours: "4h",
        },
      ],
      5: [
        {
          task: "Staff training: HIPAA-safe SMS rules",
          owner: "Office Manager",
          tools: "Training deck",
          hours: "2h session",
        },
        {
          task: "Role-play escalation for patient replies",
          owner: "Lead MA",
          tools: "SOP doc",
          hours: "1h",
        },
      ],
      6: [
        {
          task: "Training agenda: intake AI and follow-up templates",
          owner: "Practice Administrator",
          tools: "LMS / slide deck",
          hours: "3h",
        },
      ],
      7: [
        {
          task: "Pilot reminders with one provider column",
          owner: "Front Desk Lead",
          tools: "PMS schedule filter",
          hours: "ongoing",
        },
      ],
      8: [
        {
          task: "Collect pilot metrics: no-shows, call volume",
          owner: "Office Manager",
          tools: "Sheets dashboard",
          hours: "2h",
        },
      ],
      9: [
        {
          task: "Roll out to all providers and locations",
          owner: "Practice Administrator",
          tools: "Make.com prod",
          hours: "4h",
        },
      ],
      10: [
        {
          task: "Enable review-request and follow-up scenarios",
          owner: "Clinovyr consultant",
          tools: "Make.com blueprints",
          hours: "6h",
        },
      ],
      11: [
        {
          task: "Optimize message timing from pilot data",
          owner: "Office Manager",
          tools: "Analytics sheet",
          hours: "3h",
        },
      ],
      12: [
        {
          task: "90-day ROI review with leadership",
          owner: "Practice Owner",
          tools: "ROI calculator",
          hours: "2h",
        },
      ],
    };
    weeks.push({
      week: w,
      phase,
      tasks: tasksByWeek[w] ?? [
        {
          task: `Continue ${phase.toLowerCase()} for ${company.name}`,
          owner: "Office Manager",
          tools: "Per sprint plan",
          hours: "4h",
        },
      ],
    });
  }
  return { weeks };
}

function GanttBar({
  week,
  totalWeeks,
}: {
  week: number;
  totalWeeks: number;
}) {
  const widthPct = 100 / totalWeeks;
  const leftPct = (week - 1) * widthPct;
  return (
    <View
      style={{
        position: "absolute",
        left: `${leftPct}%`,
        width: `${widthPct - 1}%`,
        height: 10,
        backgroundColor: BRAND.accent,
        borderRadius: 2,
        top: 4,
      }}
    />
  );
}

function GanttChart({ weeks }: { weeks: RoadmapWeek[] }) {
  const phases = [...new Set(weeks.map((w) => w.phase))];
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={pdfStyles.subsectionTitle}>90-Day Gantt Overview</Text>
      <View
        style={{
          height: 14,
          backgroundColor: BRAND.cream,
          borderRadius: 3,
          marginBottom: 8,
          position: "relative",
        }}
      >
        {weeks.map((w) => (
          <GanttBar key={w.week} week={w.week} totalWeeks={weeks.length} />
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {phases.map((phase) => (
          <Text key={phase} style={[pdfStyles.muted, { marginRight: 12, fontSize: 7 }]}>
            ■ {phase}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: "row", marginTop: 6 }}>
        {weeks.map((w) => (
          <Text
            key={w.week}
            style={{ flex: 1, fontSize: 6, textAlign: "center", color: BRAND.muted }}
          >
            W{w.week}
          </Text>
        ))}
      </View>
    </View>
  );
}

function MedicalRoadmapDocument({
  company,
  content,
  dateStr,
}: {
  company: Company;
  content: MedicalRoadmapContent;
  dateStr: string;
}) {
  const weekGroups = [
    content.weeks.slice(0, 4),
    content.weeks.slice(4, 8),
    content.weeks.slice(8, 12),
  ];

  return (
    <Document title={`${company.name} — 90-Day Medical AI Roadmap`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr Implementation Plan</Text>
        <Text style={pdfStyles.coverTitle}>90-Day AI Roadmap</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverMeta}>{dateStr}</Text>
      </BrandedPage>

      <BrandedPage>
        <GanttChart weeks={content.weeks} />
        <Text style={pdfStyles.body}>
          Week-by-week plan with owners, tools, and time estimates. Adjust dates to match
          your go-live calendar.
        </Text>
      </BrandedPage>

      {weekGroups.map((group, gi) => (
        <BrandedPage key={`group-${gi}`}>
          {group.map((week) => (
            <View key={week.week} style={{ marginBottom: 14 }}>
              <Text style={pdfStyles.subsectionTitle}>
                Week {week.week} — {week.phase}
              </Text>
              <View style={pdfStyles.tableHeader}>
                <Text style={[pdfStyles.tableCellHeader, { flex: 2 }]}>Task</Text>
                <Text style={pdfStyles.tableCellHeader}>Owner</Text>
                <Text style={pdfStyles.tableCellHeader}>Tools</Text>
                <Text style={[pdfStyles.tableCellHeader, { flex: 0.6 }]}>Time</Text>
              </View>
              {week.tasks.map((t) => (
                <View key={t.task} style={pdfStyles.tableRow}>
                  <Text style={[pdfStyles.tableCell, { flex: 2 }]}>{t.task}</Text>
                  <Text style={pdfStyles.tableCell}>{t.owner}</Text>
                  <Text style={pdfStyles.tableCell}>{t.tools}</Text>
                  <Text style={[pdfStyles.tableCell, { flex: 0.6 }]}>{t.hours}</Text>
                </View>
              ))}
            </View>
          ))}
          {gi === weekGroups.length - 1 ? <PdfFooter /> : null}
        </BrandedPage>
      ))}
    </Document>
  );
}

export async function renderMedicalRoadmapPdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const fallback = buildRoadmapFallback(company);
  const context = buildMedicalContextBlock(company, survey, formData);

  const { data: content } = await callClaudeJson<MedicalRoadmapContent>({
    system: MEDICAL_ROADMAP_SYSTEM,
    prompt: `${context}

Output ONLY valid JSON with weeks 1-12:
{
  "weeks": [
    {
      "week": 1,
      "phase": "Discovery and vendor selection",
      "tasks": [{"task":"...","owner":"Office Manager","tools":"...","hours":"4h"}]
    }
  ]
}
Include 2-3 tasks per week.`,
    maxTokens: 4500,
    fallback,
    validate: (v) => Boolean(v.weeks?.length >= 10),
  });

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <MedicalRoadmapDocument company={company} content={content} dateStr={dateStr} />,
  );
}
