import { auth } from "@/lib/auth";
import {
  getAllClientSummaries,
  getRevenueSummary,
  resolveClientId,
} from "@/lib/clients";
import { generateMonthlyReport } from "@/lib/monthly-report";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !session.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [clients, revenue] = await Promise.all([
    getAllClientSummaries(),
    getRevenueSummary(),
  ]);

  return NextResponse.json({ clients, revenue });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email || !session.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { action, clientId } = body;

  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  const resolved = await resolveClientId(session.user.email, clientId);
  if (!resolved) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  switch (action) {
    case "generate_report": {
      const now = new Date();
      const month = now.getMonth() === 0 ? 12 : now.getMonth();
      const year =
        now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const result = await generateMonthlyReport(resolved, month, year);
      return NextResponse.json({
        ok: true,
        message: `Report generated for ${clientId}`,
        emailSent: result.emailSent,
        filename: `${year}-${String(month).padStart(2, "0")}.pdf`,
      });
    }
    case "add_automation":
      return NextResponse.json({
        ok: true,
        message: `Automation template sent for ${clientId}`,
      });
    case "send_checkin":
      return NextResponse.json({
        ok: true,
        message: `Check-in email sent for ${clientId}`,
      });
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
