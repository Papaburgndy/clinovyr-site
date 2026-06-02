import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;
import { renderAssessmentPdfToBuffer } from "@/lib/assessment-pdf";
import { logResendApiKeyLoaded } from "@/lib/env-check";
import { generateAssessmentReport } from "@/lib/report-generator";
import {
  getReportPdfPath,
  loadAssessment,
  saveReportPdf,
  updateAssessmentReport,
} from "@/lib/storage";

export async function POST(request: Request) {
  logResendApiKeyLoaded();

  try {
    const body = (await request.json()) as { assessmentId?: string };
    const assessmentId = body.assessmentId?.trim();

    if (!assessmentId) {
      return NextResponse.json(
        { error: "assessmentId is required." },
        { status: 400 },
      );
    }

    const stored = await loadAssessment(assessmentId);

    if (!stored) {
      return NextResponse.json(
        { error: "Assessment not found." },
        { status: 404 },
      );
    }

    const report = await generateAssessmentReport(stored.formData, stored.score);
    const updated = await updateAssessmentReport(assessmentId, report);
    const generatedAt = updated.reportGeneratedAt ?? new Date().toISOString();

    const pdfBuffer = await renderAssessmentPdfToBuffer({
      formData: stored.formData,
      score: stored.score,
      report,
      assessmentId,
      generatedAt,
    });

    await saveReportPdf(assessmentId, pdfBuffer);

    const fileBytes = await readFile(getReportPdfPath(assessmentId));
    const safeName = stored.formData.companyName
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);

    return new NextResponse(fileBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="clinovyr-ai-readiness-${safeName || "report"}.pdf"`,
        "Content-Length": String(fileBytes.length),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Report generation failed.";
    console.error("[generate-report] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
