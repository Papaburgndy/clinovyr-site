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
  const conversionLift = 0.35;
  const improvedCloseRate = Math.round((closeRate * (1 + conversionLift)) * 1000) / 1000;
  const additionalClosesPerMonth =
    Math.round(leadsPerMonth * (improvedCloseRate - closeRate) * 10) / 10;
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
      styledCell(agents, cellStyle(COLORS.input)),
      styledCell("Licensed agents producing GCI", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Average commission rate", cellStyle(COLORS.input)),
      styledCell(avgCommissionPct, cellStyle(COLORS.input)),
      styledCell("Decimal: 0.025 = 2.5%", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Inbound leads per month (team)", cellStyle(COLORS.input)),
      styledCell(leadsPerMonth, cellStyle(COLORS.input)),
      styledCell("Zillow, Realtor.com, sphere, open house", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Current close rate (leads → closed)", cellStyle(COLORS.input)),
      styledCell(closeRate, cellStyle(COLORS.input)),
      styledCell("e.g. 0.06 = 6%", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Median sale price ($)", cellStyle(COLORS.input)),
      styledCell(medianSalePrice, cellStyle(COLORS.input)),
      styledCell("Placer County: $750K–$1.2M typical", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Avg lead response time (hours)", cellStyle(COLORS.input)),
      styledCell(avgResponseHours, cellStyle(COLORS.input)),
      styledCell("Industry avg: 4+ hours", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Target response time (minutes)", cellStyle(COLORS.input)),
      styledCell(targetResponseMinutes, cellStyle(COLORS.input)),
      styledCell("AI auto-reply goal", cellStyle(COLORS.input)),
    ],
  ]);
  sheet1["!cols"] = [{ wch: 36 }, { wch: 18 }, { wch: 32 }];

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
      styledCell(`${(closeRate * 100).toFixed(1)}%`, cellStyle(COLORS.calculated)),
      styledCell(`${(improvedCloseRate * 100).toFixed(1)}%`, cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Closes per month (team)", cellStyle(COLORS.calculated)),
      styledCell(Math.round(leadsPerMonth * closeRate * 10) / 10, cellStyle(COLORS.calculated)),
      styledCell(
        Math.round(leadsPerMonth * improvedCloseRate * 10) / 10,
        cellStyle(COLORS.calculated),
      ),
    ],
    [
      styledCell("Additional closes per month", cellStyle(COLORS.summary, true)),
      styledCell("—", cellStyle(COLORS.summary, true)),
      styledCell(additionalClosesPerMonth, cellStyle(COLORS.summary, true)),
    ],
    [
      styledCell("GCI per close (at median price)", cellStyle(COLORS.calculated)),
      styledCell(`$${gciPerClose.toLocaleString()}`, cellStyle(COLORS.calculated)),
      styledCell(`$${gciPerClose.toLocaleString()}`, cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Additional GCI per month", cellStyle(COLORS.summary, true)),
      styledCell("—", cellStyle(COLORS.summary, true)),
      styledCell(`$${additionalGciMonth.toLocaleString()}`, cellStyle(COLORS.summary, true)),
    ],
    [
      styledCell("Additional GCI per year", cellStyle(COLORS.summary, true)),
      styledCell("—", cellStyle(COLORS.summary, true)),
      styledCell(`$${additionalGciYear.toLocaleString()}`, cellStyle(COLORS.summary, true)),
    ],
  ]);
  sheet2["!cols"] = [{ wch: 32 }, { wch: 18 }, { wch: 22 }];

  const sheet3 = buildSheetFromRows([
    [
      styledCell("Investment Analysis", cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Clinovyr Workflow Automation Sprint", cellStyle(COLORS.input)),
      styledCell(`$${aiInvestment.toLocaleString()}`, cellStyle(COLORS.input)),
    ],
    [
      styledCell("Estimated annual GCI lift (Sheet 2)", cellStyle(COLORS.calculated)),
      styledCell(`$${additionalGciYear.toLocaleString()}`, cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Clinovyr assessment ROI estimate", cellStyle(COLORS.summary)),
      styledCell(survey.estimatedROI ?? "See assessment report", cellStyle(COLORS.summary)),
    ],
    [
      styledCell("Break-even (additional closes needed)", cellStyle(COLORS.summary, true)),
      styledCell(
        gciPerClose > 0 ? `${(aiInvestment / gciPerClose).toFixed(1)} closes` : "N/A",
        cellStyle(COLORS.summary, true),
      ),
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
      styledCell(`$${(additionalGciYear * 3 - aiInvestment).toLocaleString()}`, cellStyle(COLORS.calculated)),
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
