import XLSX from "xlsx-js-style";
import type { Company, Survey } from "@prisma/client";
import type { AssessmentFormData } from "@/types/assessment";
import {
  OWNER_TIME_INSIGHT,
  type ConstructionFileResult,
  companySlug,
  defaultActiveJobs,
  defaultAvgProjectValue,
  defaultOwnerHourlyRate,
  estimateOwnerAdminHours,
} from "@/lib/deliverables/generators/industries/construction-shared";

const COLORS = {
  input: { fgColor: { rgb: "FFF9E6" } },
  calculated: { fgColor: { rgb: "E8F5E9" } },
  summary: { fgColor: { rgb: "E0F2F1" } },
  header: { fgColor: { rgb: "EDE9E2" }, font: { bold: true } },
  insight: { fgColor: { rgb: "FFF3E0" } },
  highlight: { fgColor: { rgb: "C8E6C9" }, font: { bold: true } },
};

const CURRENCY = '"$"#,##0';

function cellStyle(
  fill: { fgColor: { rgb: string }; font?: { bold: boolean } },
  bold = false,
) {
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
const ADMIN = "Inputs!B3";
const RATE = "Inputs!B6";

export function buildConstructionRoiWorkbook(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Buffer {
  const employees = formData?.employees ?? company.size;
  const ownerRate = defaultOwnerHourlyRate(formData);
  const adminHrsWeek = estimateOwnerAdminHours(formData);
  const activeJobs = defaultActiveJobs(employees);
  const avgProjectValue = defaultAvgProjectValue(employees);
  const bidsPerMonth = employees === "1–5" ? 6 : employees === "6–20" ? 12 : 20;

  const commAutomationHrsSaved = Math.round(adminHrsWeek * 0.35 * 10) / 10;
  const bidTimeReductionHrs = Math.round(adminHrsWeek * 0.25 * 10) / 10;
  const followUpHrsSaved = Math.round(adminHrsWeek * 0.2 * 10) / 10;
  const totalHrsSavedWeek =
    Math.round((commAutomationHrsSaved + bidTimeReductionHrs + followUpHrsSaved) * 10) / 10;

  const commSavingsYear = Math.round(commAutomationHrsSaved * ownerRate * 52);
  const bidSavingsYear = Math.round(bidTimeReductionHrs * ownerRate * 52);
  const followUpSavingsYear = Math.round(followUpHrsSaved * ownerRate * 52);
  const totalSavingsYear = commSavingsYear + bidSavingsYear + followUpSavingsYear;

  const highlightHrs = 8;
  const highlightAnnual = highlightHrs * ownerRate * 52;
  const aiInvestment = 12_000;
  const extraJobValue = avgProjectValue * 0.08;

  const sheet1 = buildSheetFromRows([
    [
      styledCell(`${company.name} — Owner Time ROI`, cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Field (yellow = edit)", cellStyle(COLORS.header, true)),
      styledCell("Value", cellStyle(COLORS.header, true)),
      styledCell("Notes", cellStyle(COLORS.header, true)),
    ],
    [
      styledCell("Owner admin hours/week", cellStyle(COLORS.input)),
      numCell(adminHrsWeek, cellStyle(COLORS.input)), // B3
      styledCell("Bids, client updates, sub coordination, admin", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Active jobs (concurrent)", cellStyle(COLORS.input)),
      numCell(activeJobs, cellStyle(COLORS.input)), // B4
      styledCell("Typical pipeline for your team size", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Average project value ($)", cellStyle(COLORS.input)),
      numCell(avgProjectValue, cellStyle(COLORS.input), CURRENCY), // B5
      styledCell("Placer County remodel/GC typical", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Owner effective hourly rate ($)", cellStyle(COLORS.input)),
      numCell(ownerRate, cellStyle(COLORS.input), CURRENCY), // B6
      styledCell("Opportunity cost — your time on site & sales", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Bids submitted per month (est.)", cellStyle(COLORS.input)),
      numCell(bidsPerMonth, cellStyle(COLORS.input)), // B7
      styledCell("Adjust to your actual pipeline", cellStyle(COLORS.input)),
    ],
  ]);
  sheet1["!cols"] = [{ wch: 36 }, { wch: 18 }, { wch: 38 }];

  // Sheet 2 — Savings. Col A category, B hrs/week, C annual $.
  const sheet2 = buildSheetFromRows([
    [
      styledCell("AI Savings Breakdown", cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Category", cellStyle(COLORS.header, true)),
      styledCell("Hrs saved/week", cellStyle(COLORS.header, true)),
      styledCell("Annual value ($)", cellStyle(COLORS.header, true)),
    ],
    [
      styledCell("Client communication automation", cellStyle(COLORS.calculated)),
      fCell(`${ADMIN}*0.35`, commAutomationHrsSaved, cellStyle(COLORS.calculated)), // B3
      fCell(`B3*${RATE}*52`, commSavingsYear, cellStyle(COLORS.calculated), CURRENCY), // C3
    ],
    [
      styledCell("50% bid prep time reduction", cellStyle(COLORS.calculated)),
      fCell(`${ADMIN}*0.25`, bidTimeReductionHrs, cellStyle(COLORS.calculated)), // B4
      fCell(`B4*${RATE}*52`, bidSavingsYear, cellStyle(COLORS.calculated), CURRENCY), // C4
    ],
    [
      styledCell("Sub & lead follow-up automation", cellStyle(COLORS.calculated)),
      fCell(`${ADMIN}*0.2`, followUpHrsSaved, cellStyle(COLORS.calculated)), // B5
      fCell(`B5*${RATE}*52`, followUpSavingsYear, cellStyle(COLORS.calculated), CURRENCY), // C5
    ],
    [
      styledCell("Total owner time recovered", cellStyle(COLORS.summary, true)),
      fCell("SUM(B3:B5)", totalHrsSavedWeek, cellStyle(COLORS.summary, true)), // B6
      fCell("SUM(C3:C5)", totalSavingsYear, cellStyle(COLORS.summary, true), CURRENCY), // C6
    ],
    [
      styledCell("KEY INSIGHT", cellStyle(COLORS.highlight, true)),
      styledCell(`$${ownerRate}/hr × ${highlightHrs} hrs/week`, cellStyle(COLORS.highlight, true)),
      fCell(`${RATE}*${highlightHrs}*52`, highlightAnnual, cellStyle(COLORS.highlight, true), CURRENCY), // C7
    ],
    [
      styledCell("Insight explanation", cellStyle(COLORS.insight)),
      styledCell(OWNER_TIME_INSIGHT, cellStyle(COLORS.insight)),
      styledCell("", cellStyle(COLORS.insight)),
    ],
  ]);
  sheet2["!cols"] = [{ wch: 34 }, { wch: 20 }, { wch: 22 }];

  const roiEstimate = survey.estimatedROI ?? "See assessment report for company-specific estimate";
  const TOTAL_YEAR = "'Savings'!C6";

  const sheet3 = buildSheetFromRows([
    [
      styledCell("Investment & Revenue Impact", cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Clinovyr Workflow Automation Sprint", cellStyle(COLORS.input)),
      numCell(aiInvestment, cellStyle(COLORS.input), CURRENCY), // B2 (input)
    ],
    [
      styledCell("Estimated annual owner time value (Sheet 2)", cellStyle(COLORS.calculated)),
      fCell(TOTAL_YEAR, totalSavingsYear, cellStyle(COLORS.calculated), CURRENCY), // B3
    ],
    [
      styledCell("Clinovyr assessment ROI estimate", cellStyle(COLORS.summary)),
      styledCell(
        typeof survey.estimatedROI === "string" ? survey.estimatedROI : roiEstimate,
        cellStyle(COLORS.summary),
      ),
    ],
    [
      styledCell("One additional job/year (8% win-rate lift)", cellStyle(COLORS.calculated)),
      styledCell(`$${Math.round(extraJobValue).toLocaleString()} gross margin (illustrative)`, cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Break-even (owner hours to recover investment)", cellStyle(COLORS.summary, true)),
      styledCell(
        `${Math.ceil(aiInvestment / (ownerRate * 52))} hrs/week for 1 year at $${ownerRate}/hr`,
        cellStyle(COLORS.summary, true),
      ),
    ],
    [
      styledCell("Active jobs context", cellStyle(COLORS.insight)),
      styledCell(
        `${activeJobs} jobs × $${avgProjectValue.toLocaleString()} avg = $${(activeJobs * avgProjectValue).toLocaleString()} active backlog`,
        cellStyle(COLORS.insight),
      ),
    ],
    [
      styledCell("DISCLAIMER", cellStyle(COLORS.header, true)),
      styledCell(
        "Illustrative estimates based on assessment survey inputs and industry benchmarks. Actual savings depend on adoption, job mix, and market conditions. Not financial advice.",
        cellStyle(COLORS.insight),
      ),
    ],
    [
      styledCell("Survey estimated ROI reference", cellStyle(COLORS.summary)),
      styledCell(String(survey.estimatedROI ?? "Not provided in assessment"), cellStyle(COLORS.summary)),
    ],
  ]);
  sheet3["!cols"] = [{ wch: 42 }, { wch: 52 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet1, "Inputs");
  XLSX.utils.book_append_sheet(wb, sheet2, "Savings");
  XLSX.utils.book_append_sheet(wb, sheet3, "Investment");

  const arrayBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return Buffer.from(arrayBuffer);
}

export function buildConstructionRoiFileResult(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): ConstructionFileResult {
  const buffer = buildConstructionRoiWorkbook(company, survey, formData);
  const slug = companySlug(company.name);
  return {
    buffer,
    filename: `${slug}-construction-roi-calculator.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    displayName: "Construction ROI Calculator",
  };
}
