import type { Metadata } from "next";
import Link from "next/link";
import { PaymentSuccessCheckmark } from "@/components/portal/payment-success-checkmark";
import { PaymentSuccessRedirect } from "@/components/portal/payment-success-redirect";
import { requireAuth } from "@/lib/auth-helpers";
import { formatCents } from "@/lib/dashboard-state";
import { prisma } from "@/lib/prisma";
import {
  getProduct,
  resolveProductKey,
  type ClinovyrProductKey,
} from "@/lib/products";
import { getContactEmail } from "@/lib/assessment-email";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Payment Successful",
  description: "Your Clinovyr purchase was successful.",
};

type PaymentSuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

type PaymentDetails = {
  productName: string;
  amountCents: number;
  verified: boolean;
  message?: string;
};

async function resolvePaymentDetails(
  userId: string,
  sessionId: string | undefined,
): Promise<PaymentDetails> {
  const company = await prisma.company.findUnique({
    where: { userId },
    include: { order: true },
  });

  const fallbackFromOrder = (): PaymentDetails | null => {
    const order = company?.order;
    if (!order || order.status === "pending") return null;
    const productKey = resolveProductKey(order.product);
    const product = getProduct(productKey);
    return {
      productName: product.name,
      amountCents: order.amount,
      verified: order.status === "paid" || order.status === "delivered",
    };
  };

  if (!sessionId?.trim()) {
    const fromOrder = fallbackFromOrder();
    return (
      fromOrder ?? {
        productName: "Your package",
        amountCents: 0,
        verified: false,
        message: "Missing checkout reference. Check your dashboard or email.",
      }
    );
  }

  if (!isStripeConfigured()) {
    const fromOrder = fallbackFromOrder();
    return (
      fromOrder ?? {
        productName: "Your package",
        amountCents: 0,
        verified: false,
        message: `Payment verification is unavailable. Contact ${getContactEmail()}.`,
      }
    );
  }

  try {
    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    const sessionUserId = checkoutSession.metadata?.userId;
    const companyId =
      checkoutSession.metadata?.companyId ??
      checkoutSession.client_reference_id;

    if (
      sessionUserId !== userId &&
      company?.id &&
      companyId !== company.id
    ) {
      return {
        productName: "Your package",
        amountCents: 0,
        verified: false,
        message: "This payment session does not belong to your account.",
      };
    }

    const paid = checkoutSession.payment_status === "paid";

    const productKey = resolveProductKey(
      checkoutSession.metadata?.product as string | undefined,
    );
    const product = getProduct(productKey as ClinovyrProductKey);
    const amountCents =
      checkoutSession.amount_total ??
      company?.order?.amount ??
      product.amount;

    return {
      productName: product.name,
      amountCents,
      verified: paid,
      message: paid
        ? undefined
        : "Payment is still processing. Refresh in a moment or check your email.",
    };
  } catch {
    const fromOrder = fallbackFromOrder();
    return (
      fromOrder ?? {
        productName: "Your package",
        amountCents: 0,
        verified: false,
        message: `Could not verify this checkout session. Contact ${getContactEmail()}.`,
      }
    );
  }
}

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const session = await requireAuth();
  const params = await searchParams;
  const sessionId = params.session_id?.trim();

  const details = await resolvePaymentDetails(session.user.id, sessionId);

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center text-center">
        {details.verified ? <PaymentSuccessCheckmark /> : null}

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-accent-light">
          {details.verified ? "Payment confirmed" : "Payment status"}
        </p>

        <h1 className="mt-2 font-display text-2xl font-light text-paper sm:text-3xl">
          {details.verified
            ? "Payment confirmed! We're preparing your deliverables."
            : "We're confirming your payment"}
        </h1>

        {details.message ? (
          <p className="mt-3 font-sans text-sm text-paper/60">{details.message}</p>
        ) : null}

        {details.verified && details.amountCents > 0 ? (
          <div className="mt-6 w-full rounded-lg border border-rule/20 bg-ink/40 px-5 py-4 text-left">
            <dl className="space-y-3">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-paper/40">
                  Package purchased
                </dt>
                <dd className="mt-1 font-sans text-sm text-paper">
                  {details.productName}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-paper/40">
                  Amount paid
                </dt>
                <dd className="mt-1 font-mono text-sm text-accent-light">
                  {formatCents(details.amountCents)}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        <p className="mt-6 font-sans text-sm text-paper/60">
          You&apos;ll receive an email when everything is ready — usually within
          30 minutes.
        </p>

        {details.verified ? (
          <div className="mt-4">
            <PaymentSuccessRedirect enabled />
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard/results"
              className="font-sans text-sm text-accent-light underline-offset-4 hover:underline"
            >
              View results
            </Link>
            <Link
              href="/dashboard"
              className="font-sans text-sm text-paper/50 underline-offset-4 hover:text-paper/70 hover:underline"
            >
              Back to dashboard
            </Link>
          </div>
        )}

        {sessionId ? (
          <p className="mt-8 font-mono text-[10px] text-paper/30">
            Reference: {sessionId}
          </p>
        ) : null}
      </div>
    </div>
  );
}
