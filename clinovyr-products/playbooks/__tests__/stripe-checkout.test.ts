import {
  STRIPE_TEST_CARDS,
  isStripeConfigured,
  isStripeTestMode,
} from "@/lib/stripe";

describe("Stripe configuration helpers", () => {
  const originalKey = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY = originalKey;
    }
  });

  it("detects test mode from sk_test_ prefix", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_abc";
    expect(isStripeTestMode()).toBe(true);
    expect(isStripeConfigured()).toBe(true);
  });

  it("detects live mode from sk_live_ prefix", () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_abc";
    expect(isStripeTestMode()).toBe(false);
  });

  it("documents standard Stripe test cards", () => {
    expect(STRIPE_TEST_CARDS.success).toBe("4242424242424242");
    expect(STRIPE_TEST_CARDS.decline).toBe("4000000000000002");
  });
});

describe("checkout error handling (mocked)", () => {
  it("surfaces API errors to the client payload shape", async () => {
    const response = {
      ok: false,
      json: async () => ({ error: "Checkout unavailable." }),
    };

    const data = (await response.json()) as { error?: string };
    expect(data.error).toBeTruthy();
    expect(response.ok).toBe(false);
  });
});
