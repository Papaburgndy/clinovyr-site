import { test, expect } from "@playwright/test";
import { encode } from "next-auth/jwt";

const TEST_EMAIL = "ops@granitebaydental.test";
const TEST_CLIENT_ID = "granite-bay-dental";
const AUTH_SECRET =
  process.env.AUTH_SECRET ?? "playwright-test-secret-min-32-chars-long";

async function setTestSessionCookie(
  context: import("@playwright/test").BrowserContext,
  baseURL: string
): Promise<void> {
  const token = await encode({
    token: {
      email: TEST_EMAIL,
      isAdmin: false,
      clientId: TEST_CLIENT_ID,
      sub: TEST_EMAIL,
    },
    secret: AUTH_SECRET,
    salt: "authjs.session-token",
  });

  const hostname = new URL(baseURL).hostname;

  await context.addCookies([
    {
      name: "authjs.session-token",
      value: token,
      domain: hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

test.describe("Dashboard UI smoke", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    if (!baseURL) {
      throw new Error("Playwright baseURL is required");
    }
    await setTestSessionCookie(context, baseURL);
  });

  test("shows KPI cards, chart, and automations", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/dashboard");

    const kpiLabel = (label: string) =>
      page.locator("p.font-mono.text-xs", { hasText: label });

    await expect(kpiLabel("Tasks Automated")).toBeVisible({ timeout: 15_000 });
    await expect(kpiLabel("Hours Saved")).toBeVisible();
    await expect(kpiLabel("Automations Running")).toBeVisible();
    await expect(kpiLabel("ROI Estimate")).toBeVisible();

    const tasksKpiValue = page
      .locator(".grid.gap-4 > div")
      .filter({ has: kpiLabel("Tasks Automated") })
      .locator(".font-display.text-3xl");
    await expect(tasksKpiValue).toHaveText(/[1-9]/, { timeout: 3_000 });

    await expect(page.locator(".recharts-surface").first()).toBeVisible({
      timeout: 10_000,
    });

    await expect(
      page.getByRole("heading", { name: "Active Automations" })
    ).toBeVisible();
    await expect(
      page.locator("p.font-medium.text-ink", { hasText: "New Patient Intake" })
    ).toBeVisible();
  });
});
