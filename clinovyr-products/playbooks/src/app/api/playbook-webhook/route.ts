import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getIndustryBySlug, buildPlaybookTitle } from "@/lib/industries";
import {
  getSiteUrl,
  readPlaybookPdfBuffer,
  sendPlaybookDeliveryEmail,
} from "@/lib/resend";
import { getStripe } from "@/lib/stripe";
import { processCheckoutSessionCompleted } from "@/lib/webhook-handler";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook not configured." },
      { status: 500 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[playbook-webhook] Signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const industrySlug = session.metadata?.industry;
    const version = parseInt(session.metadata?.version ?? "1", 10);

    if (industrySlug) {
      const config = getIndustryBySlug(industrySlug);
      const siteUrl = getSiteUrl();
      const downloadUrl = `${siteUrl}/api/playbook-download?session_id=${session.id}`;
      const pdfBuffer =
        readPlaybookPdfBuffer(industrySlug, version) ?? undefined;

      const result = await processCheckoutSessionCompleted(
        session,
        event.id,
        {
          sendEmail: (payload) =>
            sendPlaybookDeliveryEmail({
              to: payload.to,
              industryLabel: payload.industryLabel,
              playbookTitle: payload.playbookTitle,
              downloadUrl: payload.downloadUrl,
              pdfBuffer: payload.pdfBuffer,
            }),
        },
        {
          industrySlug,
          version,
          industryLabel: config?.label ?? industrySlug,
          playbookTitle: config
            ? buildPlaybookTitle(config)
            : "AI Implementation Playbook",
          downloadUrl,
          pdfBuffer,
        },
      );

      if (result.skippedDuplicate) {
        console.info(
          `[playbook-webhook] Skipped duplicate delivery for session ${session.id}`,
        );
      }

      if (result.error) {
        console.error("[playbook-webhook] Delivery failed:", result.error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
