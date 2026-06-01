import Stripe from "stripe";
import { PLAYBOOK_PRICE_CENTS } from "./types";

let stripeClient: Stripe | null = null;

export function isStripeTestMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_test_");
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured.");
    }
    stripeClient = new Stripe(key, {
      apiVersion: "2025-08-27.basil",
    });
  }
  return stripeClient;
}

/** Stripe test cards — https://docs.stripe.com/testing */
export const STRIPE_TEST_CARDS = {
  success: "4242424242424242",
  decline: "4000000000000002",
} as const;

export function getPlaybookPriceCents(): number {
  return PLAYBOOK_PRICE_CENTS;
}

export function formatPlaybookPrice(): string {
  return `$${(PLAYBOOK_PRICE_CENTS / 100).toLocaleString("en-US")}`;
}
