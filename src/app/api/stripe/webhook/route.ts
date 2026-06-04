/**
 * @deprecated Use /api/webhooks/stripe — this route re-exports the canonical handler
 * so existing Stripe Dashboard endpoints keep working.
 */
export { POST, runtime } from "@/app/api/webhooks/stripe/route";
