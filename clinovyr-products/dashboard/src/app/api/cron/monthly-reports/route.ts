import { listActiveClientIds } from "@/lib/clients";
import {
  generateMonthlyReport,
  getPreviousMonthReference,
} from "@/lib/monthly-report";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { month, year } = getPreviousMonthReference();
  const clientIds = await listActiveClientIds();
  const results: Array<{
    clientId: string;
    ok: boolean;
    emailSent?: boolean;
    error?: string;
  }> = [];

  for (const clientId of clientIds) {
    try {
      const result = await generateMonthlyReport(clientId, month, year);
      results.push({ clientId, ok: true, emailSent: result.emailSent });
    } catch (error) {
      results.push({
        clientId,
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    month,
    year,
    processed: results.length,
    results,
  });
}
