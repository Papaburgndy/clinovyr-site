import type { Session } from "next-auth";
import type Stripe from "stripe";
import {
  getProduct,
  getProductStripePriceId,
  isPlaceholderStripePriceId,
  resolveProductKey,
  type ClinovyrProductKey,
} from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { getSiteUrl, getStripe, isStripeConfigured } from "@/lib/stripe";

export type CheckoutCreateResult =
  | { ok: true; url: string }
  | { ok: false; status: number; error: string };

function buildLineItem(
  productKey: ClinovyrProductKey,
  companyName: string,
): Stripe.Checkout.SessionCreateParams.LineItem {
  const product = getProduct(productKey);
  const stripePriceId = getProductStripePriceId(productKey);

  if (!isPlaceholderStripePriceId(stripePriceId)) {
    return { price: stripePriceId, quantity: 1 };
  }

  return {
    price_data: {
      currency: "usd",
      unit_amount: product.amount,
      product_data: {
        name: product.name,
        description: `${product.description} — ${companyName}`,
      },
    },
    quantity: 1,
  };
}

export async function createCheckoutSession(
  userId: string,
  session: Session,
): Promise<CheckoutCreateResult> {
  if (!isStripeConfigured()) {
    return {
      ok: false,
      status: 501,
      error:
        "Stripe checkout is not configured yet. Contact hello@clinovyr.com to complete your purchase.",
    };
  }

  const email = session.user?.email?.trim();
  if (!email) {
    return {
      ok: false,
      status: 400,
      error: "A verified email is required before checkout.",
    };
  }

  const company = await prisma.company.findUnique({
    where: { userId },
    include: { survey: true, order: true },
  });

  if (!company?.survey || company.survey.status !== "complete") {
    return {
      ok: false,
      status: 400,
      error: "Complete your assessment before checkout.",
    };
  }

  if (company.order && company.order.status !== "refunded") {
    return {
      ok: false,
      status: 409,
      error:
        company.order.status === "paid"
          ? "You already have an active purchase for this account."
          : "A checkout is already in progress. Refresh your dashboard or contact hello@clinovyr.com.",
    };
  }

  const productKey = resolveProductKey(company.survey.recommendedPkg);
  const product = getProduct(productKey);
  const stripe = getStripe();
  const siteUrl = getSiteUrl();

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [buildLineItem(productKey, company.name)],
    customer_email: email,
    client_reference_id: company.id,
    metadata: {
      companyId: company.id,
      userId,
      product: productKey,
      deliverables: JSON.stringify(product.deliverables),
    },
    success_url: `${siteUrl}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/dashboard/results?canceled=true`,
  });

  if (!checkoutSession.url) {
    return {
      ok: false,
      status: 500,
      error: "Failed to create checkout session.",
    };
  }

  const orderData = {
    product: productKey,
    amount: product.amount,
    status: "pending",
    stripeSessionId: checkoutSession.id,
    deliverables: product.deliverables,
  };

  if (company.order) {
    await prisma.order.update({
      where: { companyId: company.id },
      data: orderData,
    });
  } else {
    await prisma.order.create({
      data: {
        companyId: company.id,
        ...orderData,
      },
    });
  }

  return { ok: true, url: checkoutSession.url };
}
