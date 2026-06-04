import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 },
    );
  }

  const body = (await request.json()) as { orderId?: string };
  const orderId = body.orderId?.trim();

  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order?.stripePaymentId) {
    return NextResponse.json(
      { error: "No Stripe payment on this order" },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const paymentIntentId = order.stripePaymentId;

  try {
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
  } catch (err) {
    console.error("[admin/refund]", err);
    return NextResponse.json(
      { error: "Stripe refund failed" },
      { status: 502 },
    );
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "refunded" },
  });

  return NextResponse.json({ ok: true });
}
