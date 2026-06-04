import XLSX from "xlsx-js-style";
import type { Company, Survey } from "@prisma/client";
import type { AssessmentFormData } from "@/types/assessment";
import type { MedicalFileResult } from "@/lib/deliverables/generators/industries/medical-shared";
import { companySlug } from "@/lib/deliverables/generators/industries/medical-shared";

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

type BenchmarkRow = {
  label: string;
  small: string | number;
  medium: string | number;
  large: string | number;
};

const MEDICAL_BENCHMARKS: BenchmarkRow[] = [
  {
    label: "Avg weekly appointments (per provider)",
    small: 45,
    medium: 85,
    large: 120,
  },
  { label: "Typical no-show rate", small: "8%", medium: "12%", large: "15%" },
  {
    label: "Front-desk hours/week on manual tasks",
    small: 18,
    medium: 28,
    large: 42,
  },
  { label: "Blended hourly staff cost", small: "$22", medium: "$28", large: "$35" },
  {
    label: "ROI from appointment reminders",
    small: "$18K/yr",
    medium: "$42K/yr",
    large: "$68K/yr",
  },
  {
    label: "ROI from intake automation",
    small: "$12K/yr",
    medium: "$28K/yr",
    large: "$45K/yr",
  },
];

function sizeColumn(employees: string | undefined): "small" | "medium" | "large" {
  if (employees === "1–5" || employees === "6–20") return "small";
  if (employees === "21–50") return "medium";
  return "large";
}

function defaultAppointments(employees: string | undefined): number {
  const col = sizeColumn(employees);
  const row = MEDICAL_BENCHMARKS[0];
  return col === "small" ? Number(row.small) : col === "medium" ? Number(row.medium) : Number(row.large);
}

function defaultNoShowRate(employees: string | undefined): number {
  const col = sizeColumn(employees);
  const rates = { small: 0.08, medium: 0.12, large: 0.15 };
  return rates[col];
}

function defaultManualHours(employees: string | undefined): number {
  const col = sizeColumn(employees);
  const row = MEDICAL_BENCHMARKS[2];
  return col === "small" ? Number(row.small) : col === "medium" ? Number(row.medium) : Number(row.large);
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

export function buildMedicalRoiWorkbook(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Buffer {
  const employees = formData?.employees ?? company.size;
  const weeklyAppts = defaultAppointments(employees);
  const noShowRate = defaultNoShowRate(employees);
  const manualHours = defaultManualHours(employees);
  const hourlyWage = 28;
  const noShowReduction = 0.35;
  const hoursAutomatedPct = 0.3;

  const recoveredApptsWeek = Math.round(weeklyAppts * noShowRate * noShowReduction * 10) / 10;
  const apptValue = 185;
  const noShowSavingsWeek = Math.round(recoveredApptsWeek * apptValue);
  const hoursSavedWeek = Math.round(manualHours * hoursAutomatedPct * 10) / 10;
  const laborSavingsWeek = Math.round(hoursSavedWeek * hourlyWage);
  const totalWeeklySavings = noShowSavingsWeek + laborSavingsWeek;
  const annualSavings = totalWeeklySavings * 52;
  const packageCost = 12_000;
  const breakEvenMonths =
    totalWeeklySavings > 0
      ? Math.ceil(packageCost / ((totalWeeklySavings * 52) / 12))
      : 0;

  const sheet1 = buildSheetFromRows([
    [
      styledCell(`${company.name} — Your Numbers`, cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Field", cellStyle(COLORS.header, true)),
      styledCell("Value", cellStyle(COLORS.header, true)),
      styledCell("Source", cellStyle(COLORS.header, true)),
    ],
    [
      styledCell("Employees (team size)", cellStyle(COLORS.input)),
      styledCell(employees, cellStyle(COLORS.input)),
      styledCell("Survey / company profile", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Revenue range", cellStyle(COLORS.input)),
      styledCell(formData?.revenue ?? company.revenue ?? "—", cellStyle(COLORS.input)),
      styledCell("Assessment", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Readiness tier", cellStyle(COLORS.input)),
      styledCell(survey.tier ?? "—", cellStyle(COLORS.input)),
      styledCell("Clinovyr assessment", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Weekly appointments", cellStyle(COLORS.input)),
      styledCell(weeklyAppts, cellStyle(COLORS.input)),
      styledCell("Edit to match practice volume", cellStyle(COLORS.input)),
    ],
    [
      styledCell("No-show rate (decimal)", cellStyle(COLORS.input)),
      styledCell(noShowRate, cellStyle(COLORS.input)),
      styledCell("e.g. 0.12 = 12%", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Staff hours/week on manual tasks", cellStyle(COLORS.input)),
      styledCell(manualHours, cellStyle(COLORS.input)),
      styledCell("Front desk + billing estimate", cellStyle(COLORS.input)),
    ],
    [
      styledCell("Blended hourly wage ($)", cellStyle(COLORS.input)),
      styledCell(hourlyWage, cellStyle(COLORS.input)),
      styledCell("Adjust for your market", cellStyle(COLORS.input)),
    ],
  ]);
  sheet1["!cols"] = [{ wch: 32 }, { wch: 18 }, { wch: 28 }];

  const sheet2 = buildSheetFromRows([
    [
      styledCell("Automation Savings", cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Automation", cellStyle(COLORS.header, true)),
      styledCell("Hours saved/week", cellStyle(COLORS.header, true)),
      styledCell("Annual $ value", cellStyle(COLORS.header, true)),
    ],
    [
      styledCell("Appointment reminders (no-show reduction)", cellStyle(COLORS.calculated)),
      styledCell(recoveredApptsWeek, cellStyle(COLORS.calculated)),
      styledCell(noShowSavingsWeek * 52, cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Intake & admin automation", cellStyle(COLORS.calculated)),
      styledCell(hoursSavedWeek * 0.5, cellStyle(COLORS.calculated)),
      styledCell(Math.round(hoursSavedWeek * 0.5 * hourlyWage * 52), cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Follow-up & recall sequences", cellStyle(COLORS.calculated)),
      styledCell(hoursSavedWeek * 0.3, cellStyle(COLORS.calculated)),
      styledCell(Math.round(hoursSavedWeek * 0.3 * hourlyWage * 52), cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Review generation workflow", cellStyle(COLORS.calculated)),
      styledCell(hoursSavedWeek * 0.2, cellStyle(COLORS.calculated)),
      styledCell(Math.round(hoursSavedWeek * 0.2 * hourlyWage * 52), cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Total hours recovered/week", cellStyle(COLORS.summary, true)),
      styledCell(hoursSavedWeek + recoveredApptsWeek * 0.25, cellStyle(COLORS.summary, true)),
      styledCell(annualSavings, cellStyle(COLORS.summary, true)),
    ],
  ]);
  sheet2["!cols"] = [{ wch: 38 }, { wch: 16 }, { wch: 16 }];

  const sheet3 = buildSheetFromRows([
    [
      styledCell("Investment vs Return", cellStyle(COLORS.header, true)),
      styledCell("", cellStyle(COLORS.header)),
    ],
    [
      styledCell("Clinovyr Workflow Automation Sprint", cellStyle(COLORS.input)),
      styledCell(`$${packageCost.toLocaleString()}`, cellStyle(COLORS.input)),
    ],
    [
      styledCell("Estimated annual savings (from Sheet 2)", cellStyle(COLORS.calculated)),
      styledCell(`$${annualSavings.toLocaleString()}`, cellStyle(COLORS.calculated)),
    ],
    [
      styledCell("Clinovyr assessment ROI estimate", cellStyle(COLORS.summary)),
      styledCell(survey.estimatedROI ?? "See assessment", cellStyle(COLORS.summary)),
    ],
    [
      styledCell("Break-even (months)", cellStyle(COLORS.summary, true)),
      styledCell(breakEvenMonths || "N/A", cellStyle(COLORS.summary, true)),
    ],
    [
      styledCell("3-year net benefit (illustrative)", cellStyle(COLORS.calculated)),
      styledCell(`$${(annualSavings * 3 - packageCost).toLocaleString()}`, cellStyle(COLORS.calculated)),
    ],
  ]);
  sheet3["!cols"] = [{ wch: 40 }, { wch: 22 }];

  const col = sizeColumn(employees);
  const sheet4 = buildSheetFromRows([
    [
      styledCell("Industry Benchmarks — Medical/Dental", cellStyle(COLORS.header, true)),
      styledCell("1–20 staff", cellStyle(COLORS.header, true)),
      styledCell("21–50 staff", cellStyle(COLORS.header, true)),
      styledCell("51+ staff", cellStyle(COLORS.header, true)),
    ],
    ...MEDICAL_BENCHMARKS.map((row) => [
      styledCell(row.label, cellStyle(COLORS.header)),
      styledCell(row.small, cellStyle(col === "small" ? COLORS.summary : COLORS.calculated)),
      styledCell(row.medium, cellStyle(col === "medium" ? COLORS.summary : COLORS.calculated)),
      styledCell(row.large, cellStyle(col === "large" ? COLORS.summary : COLORS.calculated)),
    ]),
    [
      styledCell("Your size band", cellStyle(COLORS.summary, true)),
      styledCell(
        col === "small" ? "◀ Your practice" : "—",
        cellStyle(COLORS.summary, true),
      ),
      styledCell(
        col === "medium" ? "◀ Your practice" : "—",
        cellStyle(COLORS.summary, true),
      ),
      styledCell(
        col === "large" ? "◀ Your practice" : "—",
        cellStyle(COLORS.summary, true),
      ),
    ],
  ]);
  sheet4["!cols"] = [{ wch: 36 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet1, "Your Numbers");
  XLSX.utils.book_append_sheet(wb, sheet2, "Automation Savings");
  XLSX.utils.book_append_sheet(wb, sheet3, "Investment vs Return");
  XLSX.utils.book_append_sheet(wb, sheet4, "Industry Benchmarks");

  const arrayBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return Buffer.from(arrayBuffer);
}

export function buildMedicalRoiFileResult(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): MedicalFileResult {
  const buffer = buildMedicalRoiWorkbook(company, survey, formData);
  const slug = companySlug(company.name);
  return {
    buffer,
    filename: `${slug}-medical-roi-calculator.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    displayName: "Medical Practice ROI Calculator",
  };
}
