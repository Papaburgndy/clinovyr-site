import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth-helpers";
import { parseDeliverableRecords } from "@/lib/deliverables/parse-records";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await requireAuthApi();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { userId },
    include: { order: true },
  });

  if (!company?.order) {
    return NextResponse.json({ error: "No order found" }, { status: 404 });
  }

  const order = company.order;
  const deliverables = parseDeliverableRecords(order.deliverables);

  return NextResponse.json({
    status: order.status,
    deliverablesCount: deliverables.length,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
  });
}
