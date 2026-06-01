# Stripe webhook testing

## Test mode

Use Stripe **test** API keys (`sk_test_...`, `whsec_...` from the test webhook endpoint). The app exposes `isStripeTestMode()` when `STRIPE_SECRET_KEY` starts with `sk_test_`.

## Test cards

| Scenario | Number | CVC | Expiry |
|----------|--------|-----|--------|
| Success | `4242 4242 4242 4242` | Any 3 digits | Any future date |
| Card declined | `4000 0000 0000 0002` | Any | Any future |

Declined payments never fire `checkout.session.completed`; the customer sees Stripe’s error in Checkout. The purchase button only handles API failures before redirect.

## Local webhook + idempotency

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Forward events to the Next.js webhook:

```bash
stripe listen --forward-to localhost:3000/api/playbook-webhook
```

3. Copy the signing secret into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

4. Complete a test checkout, or replay a captured event:

```bash
stripe trigger checkout.session.completed
```

5. **Replay the same event** to verify idempotency:

```bash
stripe events resend evt_XXXXX
```

Or resend from the Dashboard → Developers → Events → Resend.

Processed session IDs are stored in `data/processed-payments.json`. A duplicate `checkout.session.completed` for the same `session.id` skips the Resend email.

## Playwright E2E

```bash
STRIPE_SECRET_KEY=sk_test_... SITE_URL=http://localhost:3000 npm run dev
npx playwright test e2e/playbook-purchase.spec.ts
```

Without Stripe keys, Jest unit tests cover checkout helpers and webhook idempotency.
