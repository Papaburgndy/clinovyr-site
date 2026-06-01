import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AssessmentFormData } from "@/lib/assessment-types";
import type { AssessmentReport } from "@/lib/report-generator";
import type { AIReadinessScore } from "@/lib/scoring";

export type StoredAssessment = {
  assessmentId: string;
  formData: AssessmentFormData;
  score: AIReadinessScore;
  createdAt: string;
  report?: AssessmentReport;
  reportGeneratedAt?: string;
};

const DATA_ROOT = path.join(process.cwd(), "data");
const ASSESSMENTS_DIR = path.join(DATA_ROOT, "assessments");
const REPORTS_DIR = path.join(DATA_ROOT, "reports");

export function slugifyCompanyName(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

  return slug || "company";
}

export function createAssessmentId(companyName: string): string {
  return `${Date.now()}-${slugifyCompanyName(companyName)}`;
}

async function ensureDataDirs(): Promise<void> {
  await mkdir(ASSESSMENTS_DIR, { recursive: true });
  await mkdir(REPORTS_DIR, { recursive: true });
}

function assessmentFilePath(assessmentId: string): string {
  return path.join(ASSESSMENTS_DIR, `${assessmentId}.json`);
}

function reportPdfPath(assessmentId: string): string {
  return path.join(REPORTS_DIR, `${assessmentId}.pdf`);
}

export async function saveAssessment(record: StoredAssessment): Promise<void> {
  await ensureDataDirs();
  await writeFile(
    assessmentFilePath(record.assessmentId),
    JSON.stringify(record, null, 2),
    "utf-8",
  );
}

export async function loadAssessment(
  assessmentId: string,
): Promise<StoredAssessment | null> {
  await ensureDataDirs();

  try {
    const raw = await readFile(assessmentFilePath(assessmentId), "utf-8");
    return JSON.parse(raw) as StoredAssessment;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }
    throw error;
  }
}

export async function updateAssessmentReport(
  assessmentId: string,
  report: AssessmentReport,
): Promise<StoredAssessment> {
  const existing = await loadAssessment(assessmentId);

  if (!existing) {
    throw new Error(`Assessment not found: ${assessmentId}`);
  }

  const updated: StoredAssessment = {
    ...existing,
    report,
    reportGeneratedAt: new Date().toISOString(),
  };

  await saveAssessment(updated);
  return updated;
}

export async function saveReportPdf(
  assessmentId: string,
  pdfBuffer: Buffer,
): Promise<string> {
  await ensureDataDirs();
  const filePath = reportPdfPath(assessmentId);
  await writeFile(filePath, pdfBuffer);
  return filePath;
}

export function getReportPdfPath(assessmentId: string): string {
  return reportPdfPath(assessmentId);
}
