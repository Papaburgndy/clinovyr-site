import XLSX from "xlsx-js-style";
import type { Company, Survey } from "@prisma/client";
import type { AssessmentFormData } from "@/types/assessment";
import {
  PLACER_COMMISSION_INSIGHT,
  type RealEstateFileResult,
  companySlug,
} from "@/lib/deliverables/generators/industries/real-estate-shared";

const COLORS = {
  input: { fgColor: { rgb: "FFF9E6" } },
  calculated: { fgColor: { rgb: "E8F5E9" } },
  summary: { fgColor: { rgb: "E0F2F1" } },
  header: { fgColor: { rgb: "EDE9E2" }, font: { bold: true } },
  insight: { fgColor: { rgb: "FFF3E0" } },
};

const CURRENCY = '"$"#,##0';
const PERCENT = "0.0%";

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

function defaultAgentCount(employees: string | undefined): number {
  if (employees === "1–5") return 3;
  if (employees === "6–20") return 8;
  if (employees === "21–50") return 25;
  if (employees === "51–200") return 60;
  return 100;
}

function defaultLeadsPerMonth(employees: string | undefined): number {
  if (employees === "1–5") return 40;
  if (employees === "6–20") return 120;
  if (employees === "21–50") return 350;
  return 800;
}

function defaultCloseRate(employees: string | undefined): number {
  if (employees === "1–5") return 0.08;
  if (employees === "6–20") return 0.06;
  return 0.05;
}

// Sheet "Team Metrics" input refs.
const TM = "'Team Metrics'";
const COMMISSION = `${TM}!B4`;
const LEADS = `${TM}!B5`;
const CLOSE = `${TM}!B6`;
const PRICE = `${TM}!B7`;
const LIFT = 1.35; // 1 + 0.35 conversion lift
const GCI = `${PRICE}*${COMMISSION}`; // GCI per close

export function buildRealEstateRoiWorkbook(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Buffer {
  const employees = formData?.employees ?? company.size;
  const agents = defaultAgentCount(employees);
  const leadsPerMonth = defaultLeadsPerMonth(employees);
  const closeRate = defaultCloseRate(employees);
  const avgCommissionPct = 0.025;
  const medianSalePrice = 875_000;
  const gciPerClose = Math.round(medianSalePrice * avgCommissionPct);
  const avgResponseHours = 4;
  const targetResponseMinutes = 5;
  const improvedCloseRate = Math.round(closeRate * LIFT * 1000) / 1000;
  const closesBefore = Math.round(leadsPerMonth * closeRate * 10) / 10;
  const closesAfter = Math.round(leadsPerMonth * improvedCloseRate * 10) / 10;
  const additionalClosesPerMonth = Math.round((closesAfter - closesBefore) * 10) / 10;
  const additionalGciMonth = Math.round(additionalClosesPerMonth * gciPerClose);
  const additionalGciYear = additionalGciMonth * 12;
  const aiInvestment = 12_000;
  const gciLow = 18_750;
  const gciHigh = 30_000;

  const sheet1 = buildSheetFromRows([
    [
      styledCell(`${company.name} — Team Metrics`, cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Field (yellow = edit)", cellStyle(COLORS.header, true)),
      styledCell("Value", cellStyle(COLORS.header, true)),
      styledCell("Notes", cellStyle(COLORS.header, true)),
    ],
    [
      styledCell("Number of agents", cellStyle(COLORS.input)),
      numCell(agents, cellStyle(COLORS.input)), // B3
      styledCell("Licensed agents producing GCI", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Average commission rate", cellStyle(COLORS.input)),
      numCell(avgCommissionPct, cellStyle(COLORS.input), PERCENT), // B4
      styledCell("Decimal: 0.025 = 2.5%", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Inbound leads per month (team)", cellStyle(COLORS.input)),
      numCell(leadsPerMonth, cellStyle(COLORS.input)), // B5
      styledCell("Zillow, Realtor.com, sphere, open house", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Current close rate (leads → closed)", cellStyle(COLORS.input)),
      numCell(closeRate, cellStyle(COLORS.input), PERCENT), // B6
      styledCell("e.g. 0.06 = 6%", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Median sale price ($)", cellStyle(COLORS.input)),
      numCell(medianSalePrice, cellStyle(COLORS.input), CURRENCY), // B7
      styledCell("Placer County: $750K–$1.2M typical", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Avg lead response time (hours)", cellStyle(COLORS.input)),
      numCell(avgResponseHours, cellStyle(COLORS.input)), // B8
      styledCell("Industry avg: 4+ hours", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Target response time (minutes)", cellStyle(COLORS.input)),
      numCell(targetResponseMinutes, cellStyle(COLORS.input)), // B9
      styledCell("AI auto-reply goal", cellStyle(COLORS.input)),
    ],
  ]);
  sheet1["!cols"] = [{ wch: 36 }, { wch: 18 }, { wch: 32 }];

  // Sheet 2 — AI Impact. Col A metric, B before, C after.
  const sheet2 = buildSheetFromRows([
    [
      styledCell("AI Impact on Conversion", cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Metric", cellStyle(COLORS.header, true)),
      styledCell("Before AI", cellStyle(COLORS.header, true)),
      styledCell("After AI (est.)", cellStyle(COLORS.header, true)),
    ],
    [
      styledCell("Lead response time", cellStyle(COLORS.calculated)),
      styledCell(`${avgResponseHours} hours`, cellStyle(COLORS.calculated)),
      styledCell(`${targetResponseMinutes} min (auto-reply)`, cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Close rate", cellStyle(COLORS.calculated)),
      fCell(CLOSE, closeRate, cellStyle(COLORS.calculated), PERCENT), // B4
      fCell(`${CLOSE}*${LIFT}`, improvedCloseRate, cellStyle(COLORS.calculated), PERCENT), // C4
    ],
    [
      styledCell("Closes per month (team)", cellStyle(COLORS.calculated)),
      fCell(`${LEADS}*${CLOSE}`, closesBefore, cellStyle(COLORS.calculated)), // B5
      fCell(`${LEADS}*C4`, closesAfter, cellStyle(COLORS.calculated)), // C5
    ],
    [
      styledCell("Additional closes per month", cellStyle(COLORS.summary, true)),
      styledCell("—", cellStyle(COLORS.summary, true)),
      fCell("C5-B5", additionalClosesPerMonth, cellStyle(COLORS.summary, true)), // C6
    ],
    [
      styledCell("GCI per close (at median price)", cellStyle(COLORS.calculated)),
      fCell(GCI, gciPerClose, cellStyle(COLORS.calculated), CURRENCY), // B7
      fCell(GCI, gciPerClose, cellStyle(COLORS.calculated), CURRENCY), // C7
    ],
    [
      styledCell("Additional GCI per month", cellStyle(COLORS.summary, true)),
      styledCell("—", cellStyle(COLORS.summary, true)),
      fCell("C6*C7", additionalGciMonth, cellStyle(COLORS.summary, true), CURRENCY), // C8
    ],
    [
      styledCell("Additional GCI per year", cellStyle(COLORS.summary, true)),
      styledCell("—", cellStyle(COLORS.summary, true)),
      fCell("C8*12", additionalGciYear, cellStyle(COLORS.summary, true), CURRENCY), // C9
    ],
  ]);
  sheet2["!cols"] = [{ wch: 32 }, { wch: 18 }, { wch: 22 }];

  // Sheet 3 — Investment Analysis. Value column = B.
  const YEARLY = "'AI Impact'!C9";
  const GCI_CLOSE = "'AI Impact'!C7";
  const sheet3 = buildSheetFromRows([
    [
      styledCell("Investment Analysis", cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Clinovyr Workflow Automation Sprint", cellStyle(COLORS.input)),
      numCell(aiInvestment, cellStyle(COLORS.input), CURRENCY), // B2 (input)
    ],
    [
      styledCell("Estimated annual GCI lift (Sheet 2)", cellStyle(COLORS.calculated)),
      fCell(YEARLY, additionalGciYear, cellStyle(COLORS.calculated), CURRENCY), // B3
    ],
    [
      styledCell("Clinovyr assessment ROI estimate", cellStyle(COLORS.summary)),
      styledCell(survey.estimatedROI ?? "See assessment report", cellStyle(COLORS.summary)),
    ],
    [
      styledCell("Break-even (additional closes needed)", cellStyle(COLORS.summary, true)),
      fCell(`IF(${GCI_CLOSE}>0,B2/${GCI_CLOSE},"N/A")`, gciPerClose > 0 ? Math.round((aiInvestment / gciPerClose) * 10) / 10 : 0, cellStyle(COLORS.summary, true)), // B5
    ],
    [
      styledCell("Placer County insight", cellStyle(COLORS.insight, true)),
      styledCell(PLACER_COMMISSION_INSIGHT, cellStyle(COLORS.insight)),
    ],
    [
      styledCell("GCI range per additional close", cellStyle(COLORS.insight)),
      styledCell(`$${gciLow.toLocaleString()} – $${gciHigh.toLocaleString()}`, cellStyle(COLORS.insight)),
    ],
    [
      styledCell("One close funds AI? (at $875K median)", cellStyle(COLORS.calculated)),
      styledCell(
        gciPerClose >= aiInvestment ? "Yes — 1 close covers investment" : "Partial — see range above",
        cellStyle(COLORS.calculated),
      ),
    ],
    [
      styledCell("3-year net GCI benefit (illustrative)", cellStyle(COLORS.calculated)),
      fCell(`${YEARLY}*3-B2`, additionalGciYear * 3 - aiInvestment, cellStyle(COLORS.calculated), CURRENCY), // B9
    ],
  ]);
  sheet3["!cols"] = [{ wch: 42 }, { wch: 48 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet1, "Team Metrics");
  XLSX.utils.book_append_sheet(wb, sheet2, "AI Impact");
  XLSX.utils.book_append_sheet(wb, sheet3, "Investment Analysis");

  const arrayBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return Buffer.from(arrayBuffer);
}

export function buildRealEstateRoiFileResult(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): RealEstateFileResult {
  const buffer = buildRealEstateRoiWorkbook(company, survey, formData);
  const slug = companySlug(company.name);
  return {
    buffer,
    filename: `${slug}-real-estate-roi-calculator.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    displayName: "Real Estate ROI Calculator",
  };
}
