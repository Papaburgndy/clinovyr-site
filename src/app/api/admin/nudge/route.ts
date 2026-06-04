import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { sendAdminNudgeEmail } from "@/lib/admin-nudge-email";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = (await request.json()) as { companyId?: string };
  const companyId = body.companyId?.trim();

  if (!companyId) {
    return NextResponse.json({ error: "companyId required" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { user: true, survey: true, order: true },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const result = await sendAdminNudgeEmail(company);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
