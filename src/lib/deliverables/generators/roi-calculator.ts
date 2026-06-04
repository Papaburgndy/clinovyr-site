import XLSX from "xlsx-js-style";
import { spreadsheetOutput } from "@/lib/deliverables/generators/shared";
import type { DeliverableGenerator } from "@/lib/deliverables/generators/types";
import { resolveScore } from "@/lib/deliverables/artifacts";

const HOURLY_RATE = 45;

const COLORS = {
  input: { fgColor: { rgb: "FFF9E6" } },
  calculated: { fgColor: { rgb: "E8F5E9" } },
  summary: { fgColor: { rgb: "E0F2F1" } },
  header: { fgColor: { rgb: "EDE9E2" }, font: { bold: true } },
};

function cellStyle(fill: { fgColor: { rgb: string } }, bold = false) {
  return {
    fill,
    font: bold ? { bold: true } : undefined,
    border: {
      top: { style: "thin", color: { rgb: "D8D3CA" } },
      bottom: { style: "thin", color: { rgb: "D8D3CA" } },
      left: { style: "thin", color: { rgb: "D8D3CA" } },
      right: { style: "thin", color: { rgb: "D8D3CA" } },
    },
  };
}

function styledCell(value: string | number, style: ReturnType<typeof cellStyle>) {
  return { v: value, t: typeof value === "number" ? "n" : "s", s: style };
}

function estimateHoursPerWeek(formData: { timeDrainsRanked?: string[]; employees?: string } | null): number {
  const drainCount = formData?.timeDrainsRanked?.length ?? 3;
  const employees = formData?.employees ?? "6–20";
  const baseBySize: Record<string, number> = {
    "1–5": 6,
    "6–20": 10,
    "21–50": 14,
    "51–200": 20,
    "200+": 28,
  };
  const base = baseBySize[employees] ?? 10;
  return Math.min(base + drainCount, 40);
}

function automationRate(score: number | null): number {
  if (score == null) return 0.25;
  if (score >= 70) return 0.4;
  if (score >= 55) return 0.35;
  if (score >= 40) return 0.3;
  return 0.25;
}

export const generateRoiCalculator: DeliverableGenerator = ({ company, survey, formData }) => {
  const score = resolveScore(formData, survey);
  const hoursPerWeek = estimateHoursPerWeek(formData);
  const autoRate = automationRate(survey.score);
  const autoPct = Math.round(autoRate * 100);
  const hoursSavedWeek = Math.round(hoursPerWeek * autoRate * 10) / 10;
  const monthlySavings = Math.round(hoursSavedWeek * HOURLY_RATE * 4.33);
  const annualSavings = Math.round(hoursSavedWeek * HOURLY_RATE * 52);
  const implementationCost = 5000;
  const breakEvenMonths =
    monthlySavings > 0 ? Math.ceil(implementationCost / monthlySavings) : 0;

  const topDrain = formData?.timeDrainsRanked?.[0] ?? "Priority workflows";
  const ws: XLSX.WorkSheet = {};
  const rows: Array<Array<{ v: string | number; t?: string; s?: ReturnType<typeof cellStyle> }>> = [
    [styledCell(`${company.name} — ROI Calculator`, cellStyle(COLORS.header, true))],
    [styledCell(`Industry: ${company.industry} · Tier: ${survey.tier ?? "TBD"}`, cellStyle(COLORS.header))],
    [styledCell("", cellStyle(COLORS.header))],
    [
      styledCell("Input", cellStyle(COLORS.header, true)),
      styledCell("Value", cellStyle(COLORS.header, true)),
      styledCell("Notes", cellStyle(COLORS.header, true)),
    ],
    [
      styledCell("Priority time drain", cellStyle(COLORS.input)),
      styledCell(topDrain, cellStyle(COLORS.input)),
      styledCell("From assessment", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Hours/week on priority drains", cellStyle(COLORS.input)),
      styledCell(hoursPerWeek, cellStyle(COLORS.input)),
      styledCell("Adjust based on team input", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Blended hourly cost ($/hr)", cellStyle(COLORS.input)),
      styledCell(HOURLY_RATE, cellStyle(COLORS.input)),
      styledCell("Default $45/hr — edit for your team", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Automation capture rate", cellStyle(COLORS.input)),
      styledCell(`${autoPct}%`, cellStyle(COLORS.input)),
      styledCell(`Based on readiness score ${survey.score ?? "—"}`, cellStyle(COLORS.input)),
    ],
    [styledCell("", cellStyle(COLORS.header))],
    [
      styledCell("Calculated", cellStyle(COLORS.header, true)),
      styledCell("Value", cellStyle(COLORS.header, true)),
      styledCell("Formula", cellStyle(COLORS.header, true)),
    ],
    [
      styledCell("Hours saved/week", cellStyle(COLORS.calculated)),
      styledCell(hoursSavedWeek, cellStyle(COLORS.calculated)),
      styledCell(`${hoursPerWeek} × ${autoPct}%`, cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Monthly labor savings", cellStyle(COLORS.calculated)),
      styledCell(monthlySavings, cellStyle(COLORS.calculated)),
      styledCell(`${hoursSavedWeek} hrs × $${HOURLY_RATE} × 4.33`, cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Annual labor savings", cellStyle(COLORS.calculated)),
      styledCell(annualSavings, cellStyle(COLORS.calculated)),
      styledCell(`${hoursSavedWeek} hrs × $${HOURLY_RATE} × 52`, cellStyle(COLORS.calculated)),
    ],
    [styledCell("", cellStyle(COLORS.header))],
    [
      styledCell("Summary", cellStyle(COLORS.summary, true)),
      styledCell("Value", cellStyle(COLORS.summary, true)),
      styledCell("Notes", cellStyle(COLORS.summary, true)),
    ],
    [
      styledCell("Clinovyr assessment estimate", cellStyle(COLORS.summary)),
      styledCell(survey.estimatedROI ?? score?.estimatedAnnualROI ?? "TBD", cellStyle(COLORS.summary)),
      styledCell("From AI Readiness Assessment", cellStyle(COLORS.summary)),
    ],
    [
      styledCell("Est. implementation investment", cellStyle(COLORS.summary)),
      styledCell(`$${implementationCost.toLocaleString()}`, cellStyle(COLORS.summary)),
      styledCell("AI Readiness Assessment baseline", cellStyle(COLORS.summary)),
    ],
    [
      styledCell("Break-even (months)", cellStyle(COLORS.summary)),
      styledCell(breakEvenMonths || "N/A", cellStyle(COLORS.summary)),
      styledCell("Investment ÷ monthly savings", cellStyle(COLORS.summary)),
    ],
  ];

  rows.forEach((row, r) => {
    row.forEach((cell, c) => {
      const ref = XLSX.utils.encode_cell({ r, c });
      ws[ref] = cell;
    });
  });

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length - 1, c: 2 } });
  ws["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 36 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ROI Calculator");

  const arrayBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return spreadsheetOutput("roi-calculator", Buffer.from(arrayBuffer));
};
