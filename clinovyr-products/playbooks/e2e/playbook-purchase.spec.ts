import { test, expect } from "@playwright/test";

/**
 * Stripe Checkout E2E — requires test keys and a running dev server.
 *
 * Run:
 *   STRIPE_SECRET_KEY=sk_test_... npm run dev
 *   npx playwright test e2e/playbook-purchase.spec.ts
 *
 * Test cards (manual or automated in Checkout iframe):
 *   Success: 4242 4242 4242 4242
 *   Decline: 4000 0000 0000 0002
 */

const hasStripe =
  Boolean(process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) &&
  Boolean(process.env.SITE_URL);

test.describe("Playbook purchase flow", () => {
  test.skip(!hasStripe, "Set STRIPE_SECRET_KEY (sk_test_) and SITE_URL to run E2E");

  test("checkout API returns Stripe session URL for medical", async ({
    request,
  }) => {
    const response = await request.post("/api/playbook-checkout", {
      data: { industry: "medical" },
    });

    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { url?: string };
    expect(body.url).toMatch(/^https:\/\/checkout\.stripe\.com/);
  });

  test("purchase button shows error when checkout fails", async ({ page }) => {
    await page.route("**/api/playbook-checkout", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Checkout unavailable." }),
      });
    });

    await page.goto("/playbooks/medical");
    await page.getByRole("button", { name: /purchase/i }).click();
    await expect(page.getByRole("alert")).toContainText(
      "Checkout unavailable",
    );
  });
});
