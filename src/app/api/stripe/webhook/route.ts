/**
 * @deprecated Use /api/webhooks/stripe — this route re-exports the canonical handler
 * so existing Stripe Dashboard endpoints keep working.
 */
export const runtime = "nodejs";

export { POST } from "@/app/api/webhooks/stripe/route";
