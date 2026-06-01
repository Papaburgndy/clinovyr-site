import type Stripe from "stripe";
import {
  isSessionProcessed,
  markSessionProcessed,
  type ProcessedPaymentRecord,
} from "./processed-payments";

export type WebhookEmailPayload = {
  to: string;
  industryLabel: string;
  playbookTitle: string;
  downloadUrl: string;
  pdfBuffer?: Buffer;
};

export type WebhookHandlerDeps = {
  sendEmail: (payload: WebhookEmailPayload) => Promise<{ ok: boolean; error?: string }>;
  storePath?: string;
  now?: () => Date;
};

export type WebhookProcessResult = {
  handled: boolean;
  skippedDuplicate: boolean;
  emailSent: boolean;
  error?: string;
};

export async function processCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  eventId: string | undefined,
  deps: WebhookHandlerDeps,
  metadata: {
    industrySlug: string;
    version: number;
    industryLabel: string;
    playbookTitle: string;
    downloadUrl: string;
    pdfBuffer?: Buffer;
  },
): Promise<WebhookProcessResult> {
  const customerEmail =
    session.customer_details?.email ?? session.customer_email ?? undefined;

  if (!customerEmail) {
    return {
      handled: false,
      skippedDuplicate: false,
      emailSent: false,
      error: "Missing customer email on checkout session.",
    };
  }

  const storePath = deps.storePath;

  if (isSessionProcessed(session.id, storePath)) {
    return {
      handled: true,
      skippedDuplicate: true,
      emailSent: false,
    };
  }

  const emailResult = await deps.sendEmail({
    to: customerEmail,
    industryLabel: metadata.industryLabel,
    playbookTitle: metadata.playbookTitle,
    downloadUrl: metadata.downloadUrl,
    pdfBuffer: metadata.pdfBuffer,
  });

  if (!emailResult.ok) {
    return {
      handled: true,
      skippedDuplicate: false,
      emailSent: false,
      error: emailResult.error ?? "Email delivery failed.",
    };
  }

  const record: ProcessedPaymentRecord = {
    sessionId: session.id,
    eventId,
    industry: metadata.industrySlug,
    customerEmail,
    processedAt: (deps.now?.() ?? new Date()).toISOString(),
  };

  markSessionProcessed(record, storePath);

  return {
    handled: true,
    skippedDuplicate: false,
    emailSent: true,
  };
}
