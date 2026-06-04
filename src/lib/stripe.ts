import Stripe from "stripe";

let stripeClient: Stripe | null = null;

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
    });
  }
  return stripeClient;
}

export function getSiteUrl(): string {
  return (
    process.env.SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
