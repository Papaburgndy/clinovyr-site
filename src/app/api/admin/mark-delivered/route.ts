import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = (await request.json()) as { orderId?: string };
  const orderId = body.orderId?.trim();

  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "delivered",
      deliveredAt: order.deliveredAt ?? new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
