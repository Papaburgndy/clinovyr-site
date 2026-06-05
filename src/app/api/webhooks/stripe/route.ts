import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { sendPaymentConfirmationEmail } from "@/lib/deliverables/emails";
import { triggerDeliverableGeneration } from "@/lib/deliverables/trigger";
import {
  CLINOVYR_PRODUCTS,
  getProduct,
  type ClinovyrProductKey,
} from "@/lib/products";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Local testing:
 *   stripe listen --forward-to localhost:3000/api/webhooks/stripe
 *
 * Production endpoint (Stripe Dashboard):
 *   https://clinovyr.com/api/webhooks/stripe
 *
 * Legacy path /api/stripe/webhook re-exports this handler for existing Stripe configs.
 */

async function findOrderForSession(
  session: Stripe.Checkout.Session,
  companyId: string | null,
) {
  const bySession = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
  });
  if (bySession) return bySession;

  if (companyId) {
    return prisma.order.findUnique({
      where: { companyId },
    });
  }

  return null;
}

function parseDeliverableKeys(metadata: Stripe.Metadata | null): string[] {
  const raw = metadata?.deliverables;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.every((k) => typeof k === "string")) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const companyId =
    session.metadata?.companyId ?? session.client_reference_id ?? null;

  if (!companyId) {
    console.warn("[webhooks/stripe] checkout.session.completed without companyId");
    return;
  }

  const order = await findOrderForSession(session, companyId);

  if (!order) {
    console.warn(
      "[webhooks/stripe] no order for session",
      session.id,
      "company",
      companyId,
    );
    return;
  }

  const alreadyPaid =
    order.status === "paid" || order.status === "delivered";

  const paymentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const product =
    (session.metadata?.product as string | undefined) ?? order.product;
  const amountCents =
    session.amount_total ?? order.amount;

  if (!alreadyPaid) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "paid",
        stripePaymentId: paymentId,
        stripeSessionId: order.stripeSessionId ?? session.id,
        paidAt: new Date(),
        product,
        amount: amountCents,
      },
    });

    void sendPaymentConfirmationEmail(companyId, product, amountCents).catch(
      (err) => {
        console.error("[webhooks/stripe] payment confirmation email:", err);
      },
    );
  }

  if (order.status === "delivered") {
    return;
  }

  const deliverableKeys = parseDeliverableKeys(session.metadata);
  const keysFromProduct =
    deliverableKeys.length > 0
      ? deliverableKeys
      : product in CLINOVYR_PRODUCTS
        ? [...getProduct(product as ClinovyrProductKey).deliverables]
        : Array.isArray(order.deliverables) &&
            order.deliverables.every((d) => typeof d === "string")
          ? (order.deliverables as string[])
          : [];

  triggerDeliverableGeneration({
    companyId,
    product,
    deliverableKeys: keysFromProduct,
    orderId: order.id,
  });
}

async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
): Promise<void> {
  console.warn(
    "[webhooks/stripe] payment_intent.payment_failed",
    paymentIntent.id,
    paymentIntent.last_payment_error?.message,
  );

  const sessionId =
    typeof paymentIntent.metadata?.checkout_session_id === "string"
      ? paymentIntent.metadata.checkout_session_id
      : null;

  if (sessionId) {
    await prisma.order.updateMany({
      where: { stripeSessionId: sessionId, status: "pending" },
      data: { status: "pending" },
    });
  }
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook not configured." },
      { status: 500 },
    );
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const { getStripe } = await import("@/lib/stripe");
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (error) {
    console.error("[webhooks/stripe] signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("[webhooks/stripe] handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
