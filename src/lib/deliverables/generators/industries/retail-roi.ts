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
      styledCell(monthlyRevenue, cellStyle(COLORS.input)),
      styledCell("Gross sales", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Customer count (annual unique)", cellStyle(COLORS.input)),
      styledCell(customerCount, cellStyle(COLORS.input)),
      styledCell("POS / CRM estimate", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Average transaction ($)", cellStyle(COLORS.input)),
      styledCell(avgTransaction, cellStyle(COLORS.input)),
      styledCell(`Default for ${subType}`, cellStyle(COLORS.input)),
    ],
    [
      styledCell("Email list size", cellStyle(COLORS.input)),
      styledCell(emailList, cellStyle(COLORS.input)),
      styledCell("Subscribed contacts", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Email open rate (decimal)", cellStyle(COLORS.input)),
      styledCell(openRate, cellStyle(COLORS.input)),
      styledCell("e.g. 0.22 = 22%", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Current Google rating", cellStyle(COLORS.input)),
      styledCell(currentRating, cellStyle(COLORS.input)),
      styledCell("Target: 4.4 in review module", cellStyle(COLORS.input)),
    ],
  ]);
  sheet1["!cols"] = [{ wch: 36 }, { wch: 18 }, { wch: 36 }];

  const sheet2 = buildSheetFromRows([
    [
      styledCell("Win-Back Module", cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Lapsed customers (est.)", cellStyle(COLORS.calculated)),
      styledCell(lapsedCustomers, cellStyle(COLORS.calculated)),
      styledCell(`${(lapsedPct * 100).toFixed(0)}% of base`, cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Win-back reactivation rate", cellStyle(COLORS.input)),
      styledCell(winBackRate, cellStyle(COLORS.input)),
      styledCell("Conservative 5%", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Recovered annual revenue", cellStyle(COLORS.summary, true)),
      styledCell(`$${winBackRevenue.toLocaleString()}`, cellStyle(COLORS.summary, true)),
      styledCell("Lapsed × rate × AOV", cellStyle(COLORS.summary, true)),
    ],
    [
      styledCell("Review Impact (4.1 → 4.4)", cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Current rating", cellStyle(COLORS.calculated)),
      styledCell(currentRating, cellStyle(COLORS.calculated)),
      styledCell("", cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Target rating", cellStyle(COLORS.input)),
      styledCell(targetRating, cellStyle(COLORS.input)),
      styledCell("Maps conversion lift ~15–25%", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Est. annual revenue from review lift", cellStyle(COLORS.summary, true)),
      styledCell(`$${reviewRevenue.toLocaleString()}`, cellStyle(COLORS.summary, true)),
      styledCell("15% of annual rev × lift factor", cellStyle(COLORS.summary, true)),
    ],
    [
      styledCell("Email Personalization (3–5%)", cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Personalization lift %", cellStyle(COLORS.input)),
      styledCell(emailLiftPct, cellStyle(COLORS.input)),
      styledCell("Midpoint 4%", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Annual email revenue lift", cellStyle(COLORS.summary, true)),
      styledCell(`$${emailRevenue.toLocaleString()}`, cellStyle(COLORS.summary, true)),
      styledCell("On annual revenue base", cellStyle(COLORS.summary, true)),
    ],
    [
      styledCell("Staffing optimization (hrs/wk saved)", cellStyle(COLORS.input)),
      styledCell(staffingHoursSaved, cellStyle(COLORS.input)),
      styledCell("AI daily briefs", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Staffing value (annual)", cellStyle(COLORS.calculated)),
      styledCell(`$${staffingAnnual.toLocaleString()}`, cellStyle(COLORS.calculated)),
      styledCell(`$${hourlyValue}/hr loaded`, cellStyle(COLORS.calculated)),
    ],
  ]);
  sheet2["!cols"] = [{ wch: 38 }, { wch: 20 }, { wch: 32 }];

  const sheet3 = buildSheetFromRows([
    [
      styledCell("Summary — Total Annual Impact", cellStyle(COLORS.summary, true)),
      styledCell("", cellStyle(COLORS.summary, true)),
    ],
    [
      styledCell("Win-back recovered revenue", cellStyle(COLORS.calculated)),
      styledCell(`$${winBackRevenue.toLocaleString()}`, cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Review rating lift revenue", cellStyle(COLORS.calculated)),
      styledCell(`$${reviewRevenue.toLocaleString()}`, cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Email personalization lift", cellStyle(COLORS.calculated)),
      styledCell(`$${emailRevenue.toLocaleString()}`, cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Staffing optimization value", cellStyle(COLORS.calculated)),
      styledCell(`$${staffingAnnual.toLocaleString()}`, cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Total estimated annual benefit", cellStyle(COLORS.summary, true)),
      styledCell(`$${totalAnnual.toLocaleString()}`, cellStyle(COLORS.summary, true)),
    ],
    [
      styledCell("Clinovyr Sprint investment", cellStyle(COLORS.input)),
      styledCell(`$${aiInvestment.toLocaleString()}`, cellStyle(COLORS.input)),
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
