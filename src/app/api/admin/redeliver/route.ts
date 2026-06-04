import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { triggerDeliverableGeneration } from "@/lib/deliverables/generator";
import {
  CLINOVYR_PRODUCTS,
  getProduct,
  type ClinovyrProductKey,
} from "@/lib/products";
import { Prisma } from "@prisma/client";
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

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { company: { include: { survey: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!order.company.survey) {
    return NextResponse.json(
      { error: "Company has no completed survey" },
      { status: 400 },
    );
  }

  const product = order.product;
  const deliverableKeys =
    product in CLINOVYR_PRODUCTS
      ? [...getProduct(product as ClinovyrProductKey).deliverables]
      : [];

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "paid",
      deliverables: Prisma.DbNull,
      deliveredAt: null,
    },
  });

  triggerDeliverableGeneration({
    companyId: order.companyId,
    product,
    deliverableKeys,
    orderId,
  });

  return NextResponse.json({ ok: true });
}
