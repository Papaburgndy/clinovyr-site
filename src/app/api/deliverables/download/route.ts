import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth-helpers";
import {
  findDeliverableRecord,
  parseDeliverableRecords,
} from "@/lib/deliverables/parse-records";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { userId } = await requireAuthApi();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") ?? searchParams.get("type");

  if (!key?.trim()) {
    return NextResponse.json(
      { error: "Missing key or type query parameter" },
      { status: 400 },
    );
  }

  const company = await prisma.company.findUnique({
    where: { userId },
    include: { order: true },
  });

  if (!company?.order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const order = company.order;

  if (order.status !== "delivered") {
    return NextResponse.json({ error: "Deliverables not ready" }, { status: 403 });
  }

  const records = parseDeliverableRecords(order.deliverables);
  const deliverable = findDeliverableRecord(records, key.trim());

  if (!deliverable) {
    return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
  }

  try {
    await prisma.deliverableDownload.create({
      data: {
        orderId: order.id,
        deliverableType: deliverable.key,
        userId,
      },
    });
  } catch (error) {
    console.error("[deliverables/download] failed to log download:", error);
  }

  return NextResponse.json({ url: deliverable.url });
}
