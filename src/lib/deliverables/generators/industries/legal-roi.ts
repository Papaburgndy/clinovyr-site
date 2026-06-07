import XLSX from "xlsx-js-style";
import type { Company, Survey } from "@prisma/client";
import type { AssessmentFormData } from "@/types/assessment";
import {
  BILLING_HOURS_INSIGHT,
  type LegalFileResult,
  companySlug,
  defaultBillableRate,
  estimateNonBillableHours,
} from "@/lib/deliverables/generators/industries/legal-shared";

const COLORS = {
  input: { fgColor: { rgb: "FFF9E6" } },
  calculated: { fgColor: { rgb: "E8F5E9" } },
  summary: { fgColor: { rgb: "E0F2F1" } },
  header: { fgColor: { rgb: "EDE9E2" }, font: { bold: true } },
  insight: { fgColor: { rgb: "FFF3E0" } },
  disclaimer: { fgColor: { rgb: "F5F2ED" } },
};

const CURRENCY = '"$"#,##0';

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

function defaultAttorneyCount(employees: string | undefined): number {
  if (employees === "1–5") return 2;
  if (employees === "6–20") return 6;
  if (employees === "21–50") return 15;
  if (employees === "51–200") return 35;
  return 50;
}

function hoursFromDrain(formData: AssessmentFormData | null, pattern: RegExp, defaultHrs: number): number {
  const drains = formData?.timeDrainsRanked ?? [];
  const rank = drains.findIndex((d) => pattern.test(d));
  if (rank === 0) return defaultHrs * 1.4;
  if (rank === 1) return defaultHrs * 1.2;
  if (rank >= 0) return defaultHrs;
  return defaultHrs * 0.7;
}

// Sheet "Inputs" refs.
const ATT = "Inputs!B3";
const RATE = "Inputs!B4";
const NONBILL = "Inputs!B5";
const INTAKE = "Inputs!B6";
const STATUS = "Inputs!B7";
const BILLINGR = "Inputs!B8";
const AUTORATE = "Inputs!B9";

export function buildLegalRoiWorkbook(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Buffer {
  const employees = formData?.employees ?? company.size;
  const attorneys = defaultAttorneyCount(employees);
  const billableRate = defaultBillableRate(formData);
  const totalNonBillableHrs = estimateNonBillableHours(formData);

  const intakeHrs = hoursFromDrain(formData, /intake|onboard|new client/i, 2.5);
  const statusHrs = hoursFromDrain(formData, /status|update|follow.?up|client comm/i, 2);
  const billingHrs = hoursFromDrain(formData, /billing|time entry|invoice/i, 1.5);
  const automatablePct = 0.65;
  const automatableHrsWeek = Math.round((intakeHrs + statusHrs + billingHrs) * automatablePct * 10) / 10;
  const recoveredHrsWeekAttorney = automatableHrsWeek;
  const recoveredHrsWeekFirm = Math.round(recoveredHrsWeekAttorney * attorneys * 10) / 10;
  const annualRevenuePerAttorney = Math.round(recoveredHrsWeekAttorney * billableRate * 52);
  const annualRevenueFirm = annualRevenuePerAttorney * attorneys;
  const aiInvestment = 12_000;
  const currentBillablePct = 0.62;
  const aiAssistedBillablePct = 0.72;
  const otherAdmin = Math.round((totalNonBillableHrs - intakeHrs - statusHrs - billingHrs) * 10) / 10;
  const paybackMonths = Math.max(
    1,
    Math.round((aiInvestment / (annualRevenueFirm / 12)) * 10) / 10,
  );

  const sheet1 = buildSheetFromRows([
    [
      styledCell(`${company.name} — Billable Hours Inputs`, cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Field (yellow = edit)", cellStyle(COLORS.header, true)),
      styledCell("Value", cellStyle(COLORS.header, true)),
      styledCell("Notes", cellStyle(COLORS.header, true)),
    ],
    [
      styledCell("Number of attorneys", cellStyle(COLORS.input)),
      numCell(attorneys, cellStyle(COLORS.input)), // B3
      styledCell("Partners + associates billing time", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Billable hourly rate ($)", cellStyle(COLORS.input)),
      numCell(billableRate, cellStyle(COLORS.input), CURRENCY), // B4
      styledCell("Blended rate — adjust per attorney", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Non-billable admin hrs/week (per attorney)", cellStyle(COLORS.input)),
      numCell(totalNonBillableHrs, cellStyle(COLORS.input)), // B5
      styledCell("From survey time drains — illustrative", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Intake hrs/week (per attorney)", cellStyle(COLORS.input)),
      numCell(intakeHrs, cellStyle(COLORS.input)), // B6
      styledCell("New client processing, forms, screening", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Status update hrs/week (per attorney)", cellStyle(COLORS.input)),
      numCell(statusHrs, cellStyle(COLORS.input)), // B7
      styledCell("Client emails, calls, matter updates", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Billing entry hrs/week (per attorney)", cellStyle(COLORS.input)),
      numCell(billingHrs, cellStyle(COLORS.input)), // B8
      styledCell("Time entry narratives, invoice prep", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Automation recovery rate", cellStyle(COLORS.input)),
      numCell(automatablePct, cellStyle(COLORS.input)), // B9
      styledCell("Decimal: 0.65 = 65% of admin automatable", cellStyle(COLORS.input)),
    ],
    [
      styledCell("", cellStyle(COLORS.disclaimer)),
      styledCell("", cellStyle(COLORS.disclaimer)),
      styledCell(
        "DISCLAIMER: Illustrative estimates derived from survey responses. Actual recovery varies by firm workflow, practice area, and adoption.",
        cellStyle(COLORS.disclaimer),
      ),
    ],
  ]);
  sheet1["!cols"] = [{ wch: 38 }, { wch: 14 }, { wch: 44 }];

  const sheet2 = buildSheetFromRows([
    [
      styledCell("Automatable Hours & Revenue", cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Metric", cellStyle(COLORS.header, true)),
      styledCell("Value", cellStyle(COLORS.header, true)),
    ],
    [
      styledCell("Automatable hrs/week (per attorney)", cellStyle(COLORS.calculated)),
      fCell(`(${INTAKE}+${STATUS}+${BILLINGR})*${AUTORATE}`, automatableHrsWeek, cellStyle(COLORS.calculated)), // B3
    ],
    [
      styledCell("Recovered billable hrs/week (per attorney)", cellStyle(COLORS.calculated)),
      fCell("B3", recoveredHrsWeekAttorney, cellStyle(COLORS.calculated)), // B4
    ],
    [
      styledCell("Recovered hrs/week (firm total)", cellStyle(COLORS.calculated)),
      fCell(`B4*${ATT}`, recoveredHrsWeekFirm, cellStyle(COLORS.calculated)), // B5
    ],
    [
      styledCell("Annual revenue potential (per attorney)", cellStyle(COLORS.calculated)),
      fCell(`B4*${RATE}*52`, annualRevenuePerAttorney, cellStyle(COLORS.calculated), CURRENCY), // B6
    ],
    [
      styledCell("Annual revenue potential (firm total)", cellStyle(COLORS.summary)),
      fCell(`B6*${ATT}`, annualRevenueFirm, cellStyle(COLORS.summary, true), CURRENCY), // B7
    ],
    [
      styledCell("Formula", cellStyle(COLORS.insight)),
      styledCell("hrs recovered × billable rate × 52 weeks", cellStyle(COLORS.insight)),
    ],
    [
      styledCell("", cellStyle(COLORS.disclaimer)),
      styledCell(
        "DISCLAIMER: Revenue potential assumes recovered admin time converts to billable work. Not all recovered hours may be billable in practice.",
        cellStyle(COLORS.disclaimer),
      ),
    ],
  ]);
  sheet2["!cols"] = [{ wch: 42 }, { wch: 28 }];

  const sheet3 = buildSheetFromRows([
    [
      styledCell("Time Allocation — Current vs AI-Assisted", cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Category", cellStyle(COLORS.header, true)),
      styledCell("Current (hrs/wk)", cellStyle(COLORS.header, true)),
      styledCell("AI-Assisted (hrs/wk)", cellStyle(COLORS.header, true)),
    ],
    [
      styledCell("Billable client work", cellStyle(COLORS.input)),
      numCell(Math.round(25 * currentBillablePct), cellStyle(COLORS.input)),
      numCell(Math.round(25 * aiAssistedBillablePct), cellStyle(COLORS.input)),
    ],
    [
      styledCell("Client intake & screening", cellStyle(COLORS.input)),
      fCell(INTAKE, intakeHrs, cellStyle(COLORS.input)), // B4
      fCell(`${INTAKE}*(1-${AUTORATE})`, Math.round(intakeHrs * (1 - automatablePct) * 10) / 10, cellStyle(COLORS.calculated)), // C4
    ],
    [
      styledCell("Status updates & client comms", cellStyle(COLORS.input)),
      fCell(STATUS, statusHrs, cellStyle(COLORS.input)), // B5
      fCell(`${STATUS}*(1-${AUTORATE})`, Math.round(statusHrs * (1 - automatablePct) * 10) / 10, cellStyle(COLORS.calculated)), // C5
    ],
    [
      styledCell("Billing & time entry", cellStyle(COLORS.input)),
      fCell(BILLINGR, billingHrs, cellStyle(COLORS.input)), // B6
      fCell(`${BILLINGR}*(1-${AUTORATE})`, Math.round(billingHrs * (1 - automatablePct) * 10) / 10, cellStyle(COLORS.calculated)), // C6
    ],
    [
      styledCell("Other non-billable admin", cellStyle(COLORS.input)),
      fCell(`${NONBILL}-${INTAKE}-${STATUS}-${BILLINGR}`, otherAdmin, cellStyle(COLORS.input)), // B7
      fCell(`(${NONBILL}-${INTAKE}-${STATUS}-${BILLINGR})*0.9`, Math.round(otherAdmin * 0.9 * 10) / 10, cellStyle(COLORS.input)), // C7
    ],
    [
      styledCell("Chart tip", cellStyle(COLORS.insight, true)),
      styledCell("", cellStyle(COLORS.insight)),
      styledCell("", cellStyle(COLORS.insight)),
    ],
    [
      styledCell(
        "Insert a stacked bar chart: select rows 3–7, columns B–C. Current (cream) vs AI-Assisted (teal) shows the shift from non-billable admin to billable client work.",
        cellStyle(COLORS.insight),
      ),
      styledCell("", cellStyle(COLORS.insight)),
      styledCell("", cellStyle(COLORS.insight)),
    ],
    [
      styledCell("", cellStyle(COLORS.disclaimer)),
      styledCell("", cellStyle(COLORS.disclaimer)),
      styledCell(
        "DISCLAIMER: Allocation estimates from survey time drains. Customize yellow cells to match your firm's actual time study.",
        cellStyle(COLORS.disclaimer),
      ),
    ],
  ]);
  sheet3["!cols"] = [{ wch: 36 }, { wch: 18 }, { wch: 22 }];

  const FIRM_REV = "'Revenue Potential'!B7";
  const sheet4 = buildSheetFromRows([
    [
      styledCell("Investment Analysis", cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Line item", cellStyle(COLORS.header, true)),
      styledCell("Amount", cellStyle(COLORS.header, true)),
    ],
    [
      styledCell("Estimated AI automation investment (Year 1)", cellStyle(COLORS.input)),
      numCell(aiInvestment, cellStyle(COLORS.input), CURRENCY), // B3 (input)
    ],
    [
      styledCell("Annual revenue potential (firm)", cellStyle(COLORS.calculated)),
      fCell(FIRM_REV, annualRevenueFirm, cellStyle(COLORS.calculated), CURRENCY), // B4
    ],
    [
      styledCell("Net benefit Year 1 (illustrative)", cellStyle(COLORS.summary)),
      fCell("B4-B3", annualRevenueFirm - aiInvestment, cellStyle(COLORS.summary, true), CURRENCY), // B5
    ],
    [
      styledCell("Payback period (months)", cellStyle(COLORS.calculated)),
      fCell("IF(B4>0,MAX(1,B3/(B4/12)),\"N/A\")", paybackMonths, cellStyle(COLORS.calculated)), // B6
    ],
    [
      styledCell("Insight", cellStyle(COLORS.insight)),
      styledCell(BILLING_HOURS_INSIGHT.slice(0, 120) + "…", cellStyle(COLORS.insight)),
    ],
    [
      styledCell("", cellStyle(COLORS.disclaimer)),
      styledCell(
        "DISCLAIMER: All figures are illustrative modeling based on assessment survey data — not a guarantee of results. Consult your firm administrator before budgeting.",
        cellStyle(COLORS.disclaimer),
      ),
    ],
  ]);
  sheet4["!cols"] = [{ wch: 44 }, { wch: 24 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet1, "Inputs");
  XLSX.utils.book_append_sheet(wb, sheet2, "Revenue Potential");
  XLSX.utils.book_append_sheet(wb, sheet3, "Time Allocation");
  XLSX.utils.book_append_sheet(wb, sheet4, "Investment Analysis");

  const arrayBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return Buffer.from(arrayBuffer);
}

export function buildLegalRoiFileResult(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): LegalFileResult {
  const buffer = buildLegalRoiWorkbook(company, survey, formData);
  const slug = companySlug(company.name);
  return {
    buffer,
    filename: `${slug}-legal-roi-calculator.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    displayName: "Legal Billable Hours ROI Calculator",
  };
}
