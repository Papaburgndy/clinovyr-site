import XLSX from "xlsx-js-style";
import type { Company, Survey } from "@prisma/client";
import type { AssessmentFormData } from "@/types/assessment";
import {
  WELLNESS_RETENTION_INSIGHT,
  type WellnessFileResult,
  companySlug,
  defaultActiveClients,
  defaultAvgTreatmentValue,
  defaultRebookingRate,
  defaultVisitsPerYear,
} from "@/lib/deliverables/generators/industries/wellness-shared";

const COLORS = {
  input: { fgColor: { rgb: "FFF9E6" } },
  calculated: { fgColor: { rgb: "E8F5E9" } },
  summary: { fgColor: { rgb: "E0F2F1" } },
  header: { fgColor: { rgb: "EDE9E2" }, font: { bold: true } },
  insight: { fgColor: { rgb: "FFF3E0" } },
};

const CURRENCY = '"$"#,##0';
const PERCENT = "0%";

function cellStyle(fill: { fgColor: { rgb: string }; font?: { bold: boolean } }, bold = false) {
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

type Cell = {
  v?: string | number;
  t?: string;
  f?: string;
  z?: string;
  s?: ReturnType<typeof cellStyle>;
};

function styledCell(value: string | number, style: ReturnType<typeof cellStyle>): Cell {
  return { v: value, t: typeof value === "number" ? "n" : "s", s: style };
}

function numCell(value: number, style: ReturnType<typeof cellStyle>, z?: string): Cell {
  return { v: value, t: "n", z, s: style };
}

function fCell(
  formula: string,
  cached: number,
  style: ReturnType<typeof cellStyle>,
  z?: string,
): Cell {
  return { f: formula, v: cached, t: "n", z, s: style };
}

function buildSheetFromRows(rows: Cell[][]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  rows.forEach((row, r) => {
    row.forEach((cell, c) => {
      ws[XLSX.utils.encode_cell({ r, c })] = cell;
    });
  });
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: rows.length - 1, c: Math.max(...rows.map((row) => row.length)) - 1 },
  });
  return ws;
}

// Sheet "Inputs" refs.
const CLIENTS = "Inputs!B3";
const TREAT = "Inputs!B4";
const REBOOK = "Inputs!B5";
const VISITS = "Inputs!B6";
const RATE = "Inputs!B7";
const SOCIAL = "Inputs!B8";

export function buildWellnessRoiWorkbook(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Buffer {
  const employees = formData?.employees ?? company.size;
  const m = formData?.industryMetrics ?? {};
  const activeClients = m.well_activeClients ?? defaultActiveClients(employees);
  const avgTreatment = m.well_avgTreatmentValue ?? defaultAvgTreatmentValue(employees);
  const rebookingRate =
    m.well_rebookingRatePct != null ? m.well_rebookingRatePct / 100 : defaultRebookingRate();
  const visitsPerYear = m.well_visitsPerYear ?? defaultVisitsPerYear();
  const hourlyRate = 175;
  const socialHoursSaved = 8;
  const acquisitionCost = 275;
  const retentionCost = 55;
  const acquisitionMultiplier = Math.round(acquisitionCost / retentionCost);

  const annualRevenueBaseline = Math.round(activeClients * avgTreatment * visitsPerYear);
  const rebook10 = rebookingRate + 0.1;
  const rebook20 = rebookingRate + 0.2;
  const additionalRevenue10 = Math.round(activeClients * avgTreatment * 0.1);
  const additionalRevenue20 = Math.round(activeClients * avgTreatment * 0.2);
  const socialRoiAnnual = socialHoursSaved * 52 * hourlyRate;
  const aiInvestment = 12_000;
  const highlightRevenue = 200 * 250 * 0.1;

  const sheet1 = buildSheetFromRows([
    [
      styledCell(`${company.name} — Retention Inputs`, cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Field (yellow = edit)", cellStyle(COLORS.header, true)),
      styledCell("Value", cellStyle(COLORS.header, true)),
      styledCell("Notes", cellStyle(COLORS.header, true)),
    ],
    [
      styledCell("Active clients", cellStyle(COLORS.input)),
      numCell(activeClients, cellStyle(COLORS.input)), // B3
      styledCell("Clients with visit in last 12 months", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Average treatment value ($)", cellStyle(COLORS.input)),
      numCell(avgTreatment, cellStyle(COLORS.input), CURRENCY), // B4
      styledCell("Per visit revenue", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Rebooking rate (decimal)", cellStyle(COLORS.input)),
      numCell(rebookingRate, cellStyle(COLORS.input), PERCENT), // B5
      styledCell("e.g. 0.42 = 42% rebook within 90 days", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Visits per year (avg)", cellStyle(COLORS.input)),
      numCell(visitsPerYear, cellStyle(COLORS.input)), // B6
      styledCell("Across all active clients", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Owner hourly rate ($)", cellStyle(COLORS.input)),
      numCell(hourlyRate, cellStyle(COLORS.input), CURRENCY), // B7
      styledCell("For social content ROI calc", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Social content hours saved/week", cellStyle(COLORS.input)),
      numCell(socialHoursSaved, cellStyle(COLORS.input)), // B8
      styledCell("With AI content batching", cellStyle(COLORS.input)),
    ],
  ]);
  sheet1["!cols"] = [{ wch: 36 }, { wch: 18 }, { wch: 36 }];

  // Sheet 2 — Rebooking Impact. Col A scenario, B rate, C additional revenue.
  const sheet2 = buildSheetFromRows([
    [
      styledCell("Rebooking Impact Scenarios", cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Scenario", cellStyle(COLORS.header, true)),
      styledCell("Rebooking rate", cellStyle(COLORS.header, true)),
      styledCell("Additional annual revenue", cellStyle(COLORS.header, true)),
    ],
    [
      styledCell("Current baseline", cellStyle(COLORS.calculated)),
      fCell(REBOOK, rebookingRate, cellStyle(COLORS.calculated), PERCENT), // B3
      styledCell("—", cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("+10% rebooking improvement", cellStyle(COLORS.summary, true)),
      fCell(`${REBOOK}+0.1`, rebook10, cellStyle(COLORS.summary, true), PERCENT), // B4
      fCell(`${CLIENTS}*${TREAT}*0.1`, additionalRevenue10, cellStyle(COLORS.summary, true), CURRENCY), // C4
    ],
    [
      styledCell("+20% rebooking improvement", cellStyle(COLORS.summary, true)),
      fCell(`${REBOOK}+0.2`, rebook20, cellStyle(COLORS.summary, true), PERCENT), // B5
      fCell(`${CLIENTS}*${TREAT}*0.2`, additionalRevenue20, cellStyle(COLORS.summary, true), CURRENCY), // C5
    ],
    [
      styledCell("Baseline annual revenue (est.)", cellStyle(COLORS.calculated)),
      styledCell("—", cellStyle(COLORS.calculated)),
      fCell(`${CLIENTS}*${TREAT}*${VISITS}`, annualRevenueBaseline, cellStyle(COLORS.calculated), CURRENCY), // C6
    ],
    [
      styledCell("Highlight: 200 × $250 × 10%", cellStyle(COLORS.insight, true)),
      styledCell("Benchmark example", cellStyle(COLORS.insight, true)),
      styledCell(`$${highlightRevenue.toLocaleString()} additional/year`, cellStyle(COLORS.insight, true)),
    ],
  ]);
  sheet2["!cols"] = [{ wch: 32 }, { wch: 18 }, { wch: 28 }];

  const sheet3 = buildSheetFromRows([
    [
      styledCell("Acquisition vs Retention Economics", cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Cost to acquire new client", cellStyle(COLORS.input)),
      numCell(acquisitionCost, cellStyle(COLORS.input), CURRENCY), // B2 (input)
    ],
    [
      styledCell("Cost to retain/rebook existing client", cellStyle(COLORS.input)),
      numCell(retentionCost, cellStyle(COLORS.input), CURRENCY), // B3 (input)
    ],
    [
      styledCell("Retention vs acquisition ratio", cellStyle(COLORS.calculated, true)),
      fCell("B2/B3", acquisitionMultiplier, cellStyle(COLORS.calculated, true), '0"× cheaper to retain"'), // B4
    ],
    [
      styledCell("Social content ROI (annual)", cellStyle(COLORS.calculated)),
      fCell(`${SOCIAL}*${RATE}*52`, socialRoiAnnual, cellStyle(COLORS.calculated), CURRENCY), // B5
    ],
    [
      styledCell("Clinovyr Sprint investment", cellStyle(COLORS.input)),
      numCell(aiInvestment, cellStyle(COLORS.input), CURRENCY), // B6 (input)
    ],
    [
      styledCell("Assessment ROI estimate", cellStyle(COLORS.summary)),
      styledCell(survey.estimatedROI ?? "See assessment report", cellStyle(COLORS.summary)),
    ],
    [
      styledCell("Break-even (+10% rebooking)", cellStyle(COLORS.summary, true)),
      styledCell(
        additionalRevenue10 >= aiInvestment
          ? "Yes — within Year 1"
          : `${((aiInvestment / additionalRevenue10) * 100).toFixed(0)}% of +10% lift needed`,
        cellStyle(COLORS.summary, true),
      ),
    ],
    [
      styledCell("Industry insight", cellStyle(COLORS.insight, true)),
      styledCell(WELLNESS_RETENTION_INSIGHT, cellStyle(COLORS.insight)),
    ],
  ]);
  sheet3["!cols"] = [{ wch: 42 }, { wch: 52 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet1, "Inputs");
  XLSX.utils.book_append_sheet(wb, sheet2, "Rebooking Impact");
  XLSX.utils.book_append_sheet(wb, sheet3, "Retention Economics");

  const arrayBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return Buffer.from(arrayBuffer);
}

export function buildWellnessRoiFileResult(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): WellnessFileResult {
  const buffer = buildWellnessRoiWorkbook(company, survey, formData);
  const slug = companySlug(company.name);
  return {
    buffer,
    filename: `${slug}-wellness-retention-roi-calculator.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    displayName: "Wellness Retention ROI Calculator",
  };
}
