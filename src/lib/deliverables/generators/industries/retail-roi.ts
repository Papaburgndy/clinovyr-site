import XLSX from "xlsx-js-style";
import type { Company, Survey } from "@prisma/client";
import type { AssessmentFormData } from "@/types/assessment";
import {
  RETAIL_WINBACK_INSIGHT,
  type RetailFileResult,
  companySlug,
  defaultAvgTransaction,
  defaultCustomerCount,
  defaultEmailListSize,
  defaultEmailOpenRate,
  defaultGoogleRating,
  defaultMonthlyRevenue,
  getRetailSubType,
} from "@/lib/deliverables/generators/industries/retail-shared";

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
const MREV = "Inputs!B3";
const CUST = "Inputs!B4";
const AOV = "Inputs!B5";
const RATING = "Inputs!B8";

export function buildRetailRoiWorkbook(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Buffer {
  const employees = formData?.employees ?? company.size;
  const subType = getRetailSubType(company, formData);
  const monthlyRevenue = defaultMonthlyRevenue(employees);
  const customerCount = defaultCustomerCount(employees);
  const avgTransaction = defaultAvgTransaction(subType);
  const emailList = defaultEmailListSize(employees);
  const openRate = defaultEmailOpenRate();
  const currentRating = defaultGoogleRating();
  const targetRating = 4.4;
  const lapsedPct = 0.35;
  const winBackRate = 0.05;
  const emailLiftPct = 0.04;
  const staffingHoursSaved = 4;
  const hourlyValue = 28;
  const aiInvestment = 12_000;

  const lapsedCustomers = Math.round(customerCount * lapsedPct);
  const winBackRevenue = Math.round(lapsedCustomers * winBackRate * avgTransaction);
  const reviewLiftPct = 0.18;
  const reviewRevenue = Math.round(monthlyRevenue * 12 * reviewLiftPct * 0.15);
  const emailRevenue = Math.round(monthlyRevenue * 12 * emailLiftPct);
  const staffingAnnual = staffingHoursSaved * 52 * hourlyValue;
  const totalAnnual = winBackRevenue + reviewRevenue + emailRevenue + staffingAnnual;

  const sheet1 = buildSheetFromRows([
    [
      styledCell(`${company.name} — Retail ROI Inputs`, cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Field (yellow = edit)", cellStyle(COLORS.header, true)),
      styledCell("Value", cellStyle(COLORS.header, true)),
      styledCell("Notes", cellStyle(COLORS.header, true)),
    ],
    [
      styledCell("Monthly revenue ($)", cellStyle(COLORS.input)),
      numCell(monthlyRevenue, cellStyle(COLORS.input), CURRENCY), // B3
      styledCell("Gross sales", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Customer count (annual unique)", cellStyle(COLORS.input)),
      numCell(customerCount, cellStyle(COLORS.input)), // B4
      styledCell("POS / CRM estimate", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Average transaction ($)", cellStyle(COLORS.input)),
      numCell(avgTransaction, cellStyle(COLORS.input), CURRENCY), // B5
      styledCell(`Default for ${subType}`, cellStyle(COLORS.input)),
    ],
    [
      styledCell("Email list size", cellStyle(COLORS.input)),
      numCell(emailList, cellStyle(COLORS.input)), // B6
      styledCell("Subscribed contacts", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Email open rate (decimal)", cellStyle(COLORS.input)),
      numCell(openRate, cellStyle(COLORS.input), PERCENT), // B7
      styledCell("e.g. 0.22 = 22%", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Current Google rating", cellStyle(COLORS.input)),
      numCell(currentRating, cellStyle(COLORS.input)), // B8
      styledCell("Target: 4.4 in review module", cellStyle(COLORS.input)),
    ],
  ]);
  sheet1["!cols"] = [{ wch: 36 }, { wch: 18 }, { wch: 36 }];

  // Sheet 2 — ROI Modules. Value column = B.
  const sheet2 = buildSheetFromRows([
    [
      styledCell("Win-Back Module", cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Lapsed customers (est.)", cellStyle(COLORS.calculated)),
      fCell(`ROUND(${CUST}*${lapsedPct},0)`, lapsedCustomers, cellStyle(COLORS.calculated)), // B2
      styledCell(`${(lapsedPct * 100).toFixed(0)}% of base`, cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Win-back reactivation rate", cellStyle(COLORS.input)),
      numCell(winBackRate, cellStyle(COLORS.input), PERCENT), // B3 (input)
      styledCell("Conservative 5%", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Recovered annual revenue", cellStyle(COLORS.summary, true)),
      fCell(`B2*B3*${AOV}`, winBackRevenue, cellStyle(COLORS.summary, true), CURRENCY), // B4
      styledCell("Lapsed × rate × AOV", cellStyle(COLORS.summary, true)),
    ],
    [
      styledCell("Review Impact (4.1 → 4.4)", cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Current rating", cellStyle(COLORS.calculated)),
      fCell(RATING, currentRating, cellStyle(COLORS.calculated)), // B6
      styledCell("", cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Target rating", cellStyle(COLORS.input)),
      numCell(targetRating, cellStyle(COLORS.input)), // B7 (input)
      styledCell("Maps conversion lift ~15–25%", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Est. annual revenue from review lift", cellStyle(COLORS.summary, true)),
      fCell(`${MREV}*12*${reviewLiftPct}*0.15`, reviewRevenue, cellStyle(COLORS.summary, true), CURRENCY), // B8
      styledCell("15% of annual rev × lift factor", cellStyle(COLORS.summary, true)),
    ],
    [
      styledCell("Email Personalization (3–5%)", cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Personalization lift %", cellStyle(COLORS.input)),
      numCell(emailLiftPct, cellStyle(COLORS.input), PERCENT), // B10 (input)
      styledCell("Midpoint 4%", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Annual email revenue lift", cellStyle(COLORS.summary, true)),
      fCell(`${MREV}*12*B10`, emailRevenue, cellStyle(COLORS.summary, true), CURRENCY), // B11
      styledCell("On annual revenue base", cellStyle(COLORS.summary, true)),
    ],
    [
      styledCell("Staffing optimization (hrs/wk saved)", cellStyle(COLORS.input)),
      numCell(staffingHoursSaved, cellStyle(COLORS.input)), // B12 (input)
      styledCell("AI daily briefs", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Staffing value (annual)", cellStyle(COLORS.calculated)),
      fCell(`B12*52*${hourlyValue}`, staffingAnnual, cellStyle(COLORS.calculated), CURRENCY), // B13
      styledCell(`$${hourlyValue}/hr loaded`, cellStyle(COLORS.calculated)),
    ],
  ]);
  sheet2["!cols"] = [{ wch: 38 }, { wch: 20 }, { wch: 32 }];

  // Sheet 3 — Summary. Value column = B; pulls from "ROI Modules".
  const M = "'ROI Modules'";
  const sheet3 = buildSheetFromRows([
    [
      styledCell("Summary — Total Annual Impact", cellStyle(COLORS.summary, true)),
      styledCell("", cellStyle(COLORS.summary, true)),
    ],
    [
      styledCell("Win-back recovered revenue", cellStyle(COLORS.calculated)),
      fCell(`${M}!B4`, winBackRevenue, cellStyle(COLORS.calculated), CURRENCY), // B2
    ],
    [
      styledCell("Review rating lift revenue", cellStyle(COLORS.calculated)),
      fCell(`${M}!B8`, reviewRevenue, cellStyle(COLORS.calculated), CURRENCY), // B3
    ],
    [
      styledCell("Email personalization lift", cellStyle(COLORS.calculated)),
      fCell(`${M}!B11`, emailRevenue, cellStyle(COLORS.calculated), CURRENCY), // B4
    ],
    [
      styledCell("Staffing optimization value", cellStyle(COLORS.calculated)),
      fCell(`${M}!B13`, staffingAnnual, cellStyle(COLORS.calculated), CURRENCY), // B5
    ],
    [
      styledCell("Total estimated annual benefit", cellStyle(COLORS.summary, true)),
      fCell("SUM(B2:B5)", totalAnnual, cellStyle(COLORS.summary, true), CURRENCY), // B6
    ],
    [
      styledCell("Clinovyr Sprint investment", cellStyle(COLORS.input)),
      numCell(aiInvestment, cellStyle(COLORS.input), CURRENCY), // B7 (input)
    ],
    [
      styledCell("Break-even", cellStyle(COLORS.summary, true)),
      styledCell(
        totalAnnual >= aiInvestment ? "Yes — Year 1" : `${Math.ceil(aiInvestment / totalAnnual)}× benefit needed`,
        cellStyle(COLORS.summary, true),
      ),
    ],
    [
      styledCell("Assessment ROI estimate", cellStyle(COLORS.summary)),
      styledCell(survey.estimatedROI ?? "See AI report", cellStyle(COLORS.summary)),
    ],
    [
      styledCell("Industry insight", cellStyle(COLORS.insight, true)),
      styledCell(RETAIL_WINBACK_INSIGHT, cellStyle(COLORS.insight)),
    ],
  ]);
  sheet3["!cols"] = [{ wch: 42 }, { wch: 52 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet1, "Inputs");
  XLSX.utils.book_append_sheet(wb, sheet2, "ROI Modules");
  XLSX.utils.book_append_sheet(wb, sheet3, "Summary");

  const arrayBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return Buffer.from(arrayBuffer);
}

export function buildRetailRoiFileResult(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): RetailFileResult {
  const buffer = buildRetailRoiWorkbook(company, survey, formData);
  const slug = companySlug(company.name);
  return {
    buffer,
    filename: `${slug}-retail-roi-calculator.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    displayName: "Retail & Hospitality ROI Calculator",
  };
}
