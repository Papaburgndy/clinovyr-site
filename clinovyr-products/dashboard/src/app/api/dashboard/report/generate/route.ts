import { auth } from "@/lib/auth";
import { resolveClientId } from "@/lib/clients";
import { generateMonthlyReport } from "@/lib/monthly-report";
import fs from "fs/promises";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const clientId = await resolveClientId(
    session.user.email,
    body.clientId ?? null
  );

  if (!clientId) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const now = new Date();
  const month =
    typeof body.month === "number" ? body.month : now.getMonth() + 1;
  const year = typeof body.year === "number" ? body.year : now.getFullYear();

  try {
    const result = await generateMonthlyReport(clientId, month, year);
    const stats = await fs.stat(result.pdfPath);
    const filename = `${year}-${String(month).padStart(2, "0")}.pdf`;

    return NextResponse.json({
      report: {
        id: `report-${year}-${String(month).padStart(2, "0")}`,
        month: result.metrics.monthName,
        year,
        filename,
        generatedAt: new Date().toISOString(),
        sizeKb: Math.max(1, Math.round(stats.size / 1024)),
      },
      metrics: result.metrics,
      narrative: result.narrative,
      emailSent: result.emailSent,
      pdfPath: result.pdfPath,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate report",
      },
      { status: 500 }
    );
  }
}
