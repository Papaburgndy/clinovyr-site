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

function styledCell(value: string | number, style: ReturnType<typeof cellStyle>) {
  return { v: value, t: typeof value === "number" ? "n" : "s", s: style };
}

function buildSheetFromRows(
  rows: Array<Array<{ v: string | number; t?: string; s?: ReturnType<typeof cellStyle> }>>,
): XLSX.WorkSheet {
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

export function buildWellnessRoiWorkbook(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Buffer {
  const employees = formData?.employees ?? company.size;
  const activeClients = defaultActiveClients(employees);
  const avgTreatment = defaultAvgTreatmentValue(employees);
  const rebookingRate = defaultRebookingRate();
  const visitsPerYear = defaultVisitsPerYear();
  const hourlyRate = 175;
  const socialHoursSaved = 8;
  const acquisitionCost = 275;
  const retentionCost = 55;
  const acquisitionMultiplier = 5;

  const annualRevenueBaseline = Math.round(activeClients * avgTreatment * visitsPerYear);
  const rebook10 = rebookingRate + 0.1;
  const rebook20 = rebookingRate + 0.2;
  const additionalRevenue10 = Math.round(
    activeClients * avgTreatment * (rebook10 - rebookingRate),
  );
  const additionalRevenue20 = Math.round(
    activeClients * avgTreatment * (rebook20 - rebookingRate),
  );
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
      styledCell(activeClients, cellStyle(COLORS.input)),
      styledCell("Clients with visit in last 12 months", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Average treatment value ($)", cellStyle(COLORS.input)),
      styledCell(avgTreatment, cellStyle(COLORS.input)),
      styledCell("Per visit revenue", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Rebooking rate (decimal)", cellStyle(COLORS.input)),
      styledCell(rebookingRate, cellStyle(COLORS.input)),
      styledCell("e.g. 0.42 = 42% rebook within 90 days", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Visits per year (avg)", cellStyle(COLORS.input)),
      styledCell(visitsPerYear, cellStyle(COLORS.input)),
      styledCell("Across all active clients", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Owner hourly rate ($)", cellStyle(COLORS.input)),
      styledCell(hourlyRate, cellStyle(COLORS.input)),
      styledCell("For social content ROI calc", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Social content hours saved/week", cellStyle(COLORS.input)),
      styledCell(socialHoursSaved, cellStyle(COLORS.input)),
      styledCell("With AI content batching", cellStyle(COLORS.input)),
    ],
  ]);
  sheet1["!cols"] = [{ wch: 36 }, { wch: 18 }, { wch: 36 }];

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
      styledCell(`${(rebookingRate * 100).toFixed(0)}%`, cellStyle(COLORS.calculated)),
      styledCell("—", cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("+10% rebooking improvement", cellStyle(COLORS.summary, true)),
      styledCell(`${(rebook10 * 100).toFixed(0)}%`, cellStyle(COLORS.summary, true)),
      styledCell(`$${additionalRevenue10.toLocaleString()}`, cellStyle(COLORS.summary, true)),
    ],
    [
      styledCell("+20% rebooking improvement", cellStyle(COLORS.summary, true)),
      styledCell(`${(rebook20 * 100).toFixed(0)}%`, cellStyle(COLORS.summary, true)),
      styledCell(`$${additionalRevenue20.toLocaleString()}`, cellStyle(COLORS.summary, true)),
    ],
    [
      styledCell("Baseline annual revenue (est.)", cellStyle(COLORS.calculated)),
      styledCell("—", cellStyle(COLORS.calculated)),
      styledCell(`$${annualRevenueBaseline.toLocaleString()}`, cellStyle(COLORS.calculated)),
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
      styledCell(`$${acquisitionCost}`, cellStyle(COLORS.input)),
    ],
    [
      styledCell("Cost to retain/rebook existing client", cellStyle(COLORS.input)),
      styledCell(`$${retentionCost}`, cellStyle(COLORS.input)),
    ],
    [
      styledCell("Retention vs acquisition ratio", cellStyle(COLORS.calculated, true)),
      styledCell(`${acquisitionMultiplier}× cheaper to retain`, cellStyle(COLORS.calculated, true)),
    ],
    [
      styledCell("Social content ROI (annual)", cellStyle(COLORS.calculated)),
      styledCell(
        `$${socialRoiAnnual.toLocaleString()} (${socialHoursSaved}h/wk × $${hourlyRate}/hr × 52)`,
        cellStyle(COLORS.calculated),
      ),
    ],
    [
      styledCell("Clinovyr Sprint investment", cellStyle(COLORS.input)),
      styledCell(`$${aiInvestment.toLocaleString()}`, cellStyle(COLORS.input)),
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
