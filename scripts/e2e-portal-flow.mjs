/**
 * Portal E2E flow (API-driven). Requires PostgreSQL + `npm run dev` on BASE_URL.
 * Usage: node scripts/e2e-portal-flow.mjs
 */
import { config } from "dotenv";
import { createRequire } from "module";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
config({ path: join(root, ".env.local") });

const BASE = (process.env.E2E_BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
const E2E_EMAIL = "e2e-test@clinovyr.com";
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "E2eTestPass123!";
const E2E_NAME = "E2E Test User";

const results = [];

function record(step, status, detail = "") {
  results.push({ step, status, detail });
  const icon = status === "PASS" ? "✓" : status === "SKIP" ? "○" : "✗";
  console.log(`${icon} ${step}: ${status}${detail ? ` — ${detail}` : ""}`);
}

async function fetchJson(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { res, json };
}

function getSetCookieHeader(res) {
  const h = res.headers.getSetCookie?.() ?? [];
  if (h.length) return h;
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

function mergeCookies(existing, res) {
  const jar = new Map();
  for (const part of (existing ?? "").split(";")) {
    const [k, v] = part.trim().split("=");
    if (k && v) jar.set(k, v);
  }
  for (const line of getSetCookieHeader(res)) {
    const pair = line.split(";")[0];
    const [k, v] = pair.split("=");
    if (k && v) jar.set(k.trim(), v.trim());
  }
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function checkPrerequisites() {
  const required = [
    "DATABASE_URL",
    "AUTH_SECRET",
    "RESEND_API_KEY",
    "STRIPE_SECRET_KEY",
  ];
  const missing = required.filter((k) => !process.env[k]?.trim());
  if (missing.length) {
    record(
      "Prerequisites: env",
      "FAIL",
      `Missing: ${missing.join(", ")}`,
    );
    return false;
  }
  record("Prerequisites: env", "PASS", "DATABASE_URL, AUTH_SECRET, RESEND, STRIPE");

  try {
    const require = createRequire(import.meta.url);
    const { PrismaClient } = require("@prisma/client");
    const { PrismaPg } = require("@prisma/adapter-pg");
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    await pool.end();
    record("Prerequisites: PostgreSQL", "PASS");
  } catch (err) {
    record(
      "Prerequisites: PostgreSQL",
      "FAIL",
      err instanceof Error ? err.message : String(err),
    );
    return false;
  }

  try {
    const health = await fetch(`${BASE}/api/auth/providers`);
    if (!health.ok) {
      record("Prerequisites: dev server", "FAIL", `HTTP ${health.status}`);
      return false;
    }
    record("Prerequisites: dev server", "PASS", BASE);
  } catch (err) {
    record(
      "Prerequisites: dev server",
      "FAIL",
      err instanceof Error ? err.message : String(err),
    );
    return false;
  }

  return true;
}

async function main() {
  console.log(`\nClinovyr portal E2E — ${BASE}\n`);

  if (!(await checkPrerequisites())) {
    writeReport();
    process.exit(1);
  }

  let cookies = "";

  // STEP 1: Register
  const reg = await fetchJson("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      fullName: E2E_NAME,
      email: E2E_EMAIL,
      password: E2E_PASSWORD,
      confirmPassword: E2E_PASSWORD,
    }),
  });
  cookies = mergeCookies(cookies, reg.res);

  if (reg.res.status === 409 || reg.json?.error?.includes("already")) {
    record("STEP 1: Register", "PASS", "Account already exists");
  } else if (reg.res.ok) {
    record("STEP 1: Register", "PASS", "Verification email sent (check Resend)");
  } else {
    record("STEP 1: Register", "FAIL", reg.json?.error ?? reg.res.status);
    writeReport();
    process.exit(1);
  }

  // Verify via DB token (inbox unavailable in CI)
  let verifyToken = null;
  try {
    const require = createRequire(import.meta.url);
    const { PrismaClient } = require("@prisma/client");
    const { PrismaPg } = require("@prisma/adapter-pg");
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    const tokenRow = await prisma.verificationToken.findFirst({
      where: { identifier: E2E_EMAIL },
      orderBy: { expires: "desc" },
    });
    verifyToken = tokenRow?.token ?? null;
    await prisma.$disconnect();
    await pool.end();
  } catch (err) {
    record(
      "STEP 1: Email verify",
      "FAIL",
      `DB token lookup: ${err instanceof Error ? err.message : err}`,
    );
    writeReport();
    process.exit(1);
  }

  if (!verifyToken) {
    record(
      "STEP 1: Email verify",
      "SKIP",
      "No verification token — user may already be verified",
    );
  } else {
    const verify = await fetchJson("/api/auth/verify", {
      method: "POST",
      body: JSON.stringify({ token: verifyToken, email: E2E_EMAIL }),
    });
    cookies = mergeCookies(cookies, verify.res);
    if (verify.res.ok) {
      record("STEP 1: Email verify", "PASS", "Token verified via API");
    } else {
      record("STEP 1: Email verify", "FAIL", verify.json?.error ?? verify.res.status);
    }
  }

  // Sign in (NextAuth credentials)
  const csrf = await fetchJson("/api/auth/csrf");
  const csrfToken = csrf.json?.csrfToken;
  if (!csrfToken) {
    record("STEP 1: Sign in", "FAIL", "No CSRF token");
    writeReport();
    process.exit(1);
  }

  const signInRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies,
    },
    body: new URLSearchParams({
      csrfToken,
      email: E2E_EMAIL,
      password: E2E_PASSWORD,
      callbackUrl: `${BASE}/onboarding`,
      json: "true",
    }),
    redirect: "manual",
  });
  cookies = mergeCookies(cookies, signInRes);

  if (signInRes.status === 200 || signInRes.status === 302) {
    record("STEP 1: Sign in", "PASS");
  } else {
    const body = await signInRes.text();
    record("STEP 1: Sign in", "FAIL", `${signInRes.status} ${body.slice(0, 120)}`);
    writeReport();
    process.exit(1);
  }

  const authed = { headers: { Cookie: cookies } };

  // STEP 2: Onboarding
  const company = await fetchJson("/api/onboarding/save-company", {
    method: "POST",
    ...authed,
    body: JSON.stringify({
      name: "E2E Test Medical Group",
      industry: "Medical",
      size: "6-20",
      revenue: "$500K-$2M",
      city: "Granite Bay",
      state: "CA",
      phone: "9165550100",
    }),
  });
  if (!company.res.ok) {
    record("STEP 2: Onboarding company", "FAIL", company.json?.error);
    writeReport();
    process.exit(1);
  }
  record("STEP 2: Onboarding company", "PASS");

  const goals = await fetchJson("/api/onboarding/save-goals", {
    method: "POST",
    ...authed,
    body: JSON.stringify({
      goals: ["Reduce admin time", "Improve patient communication"],
      comfortLevel: 3,
      additionalNotes: "E2E automated test",
    }),
  });
  if (!goals.res.ok) {
    record("STEP 2: Onboarding goals", "FAIL", goals.json?.error);
    writeReport();
    process.exit(1);
  }

  const complete = await fetchJson("/api/onboarding/complete", {
    method: "POST",
    ...authed,
    body: JSON.stringify({}),
  });
  if (!complete.res.ok) {
    record("STEP 2: Onboarding complete", "FAIL", complete.json?.error);
    writeReport();
    process.exit(1);
  }
  record("STEP 2: Onboarding", "PASS", "E2E Test Medical Group");

  // STEP 3: Assessment (minimal payload)
  const partialSave = await fetchJson("/api/survey/save", {
    method: "POST",
    ...authed,
    body: JSON.stringify({
      step: 3,
      completedSteps: [1, 2, 3],
      formData: {
        role: "Owner",
        biggestPain: "Scheduling",
        hoursAdmin: "10-15",
      },
    }),
  });
  if (!partialSave.res.ok) {
    record("STEP 3: Assessment save step 3", "FAIL", partialSave.json?.error);
  } else {
    record("STEP 3: Assessment save step 3", "PASS");
  }

  const surveyComplete = await fetchJson("/api/survey/complete", {
    method: "POST",
    ...authed,
    body: JSON.stringify({}),
  });
  if (!surveyComplete.res.ok) {
    record("STEP 3: Survey complete", "FAIL", surveyComplete.json?.error);
  } else {
    record("STEP 3: Survey complete", "PASS", "Scoring triggered");
  }

  // STEP 4: Results page (HTML)
  const resultsPage = await fetch(`${BASE}/dashboard/results`, {
    headers: { Cookie: cookies },
    redirect: "manual",
  });
  if (resultsPage.status === 200) {
    const html = await resultsPage.text();
    const hasScore = /score|tier|readiness/i.test(html);
    record(
      "STEP 4: Results page",
      hasScore ? "PASS" : "FAIL",
      hasScore ? "Rendered with score/tier content" : "Missing expected content",
    );
  } else {
    record("STEP 4: Results page", "FAIL", `HTTP ${resultsPage.status}`);
  }

  // STEP 5: Stripe checkout
  const checkout = await fetchJson("/api/checkout/create", {
    method: "POST",
    ...authed,
    body: JSON.stringify({}),
  });
  if (checkout.res.ok && checkout.json?.url) {
    record("STEP 5: Checkout session", "PASS", "Stripe URL returned (browser card entry not run)");
  } else {
    record(
      "STEP 5: Stripe checkout",
      "FAIL",
      checkout.json?.error ?? checkout.res.status,
    );
  }

  // STEP 6: Payment success page (unpaid session — expect processing state)
  const payPage = await fetch(`${BASE}/dashboard/payment-success?session_id=cs_test_invalid`, {
    headers: { Cookie: cookies },
  });
  if (payPage.status === 200) {
    const html = await payPage.text();
    const hasRedirect = /deliverables|Payment confirmed|confirming/i.test(html);
    record(
      "STEP 6: Payment success page",
      hasRedirect ? "PASS" : "FAIL",
      "Page renders (paid flow needs Stripe test checkout + webhook)",
    );
  } else {
    record("STEP 6: Payment success page", "FAIL", `HTTP ${payPage.status}`);
  }

  record(
    "STEP 6: Deliverables + PDF",
    "SKIP",
    "Requires paid order + generation job + Stripe webhook listener",
  );

  writeReport();
}

function writeReport() {
  const outDir = join(root, "clinovyr-products/qa/results");
  mkdirSync(outDir, { recursive: true });
  const mdPath = join(outDir, "e2e-portal-test.md");
  const jsonPath = join(outDir, "e2e-portal-test.json");

  const lines = [
    "# Portal E2E Test Results",
    "",
    `**Run:** ${new Date().toISOString()}`,
    `**Base URL:** ${BASE}`,
    "",
    "| Step | Status | Detail |",
    "|------|--------|--------|",
    ...results.map(
      (r) => `| ${r.step} | ${r.status} | ${String(r.detail).replace(/\|/g, "\\|")} |`,
    ),
    "",
    "## Blockers",
    "",
    "- PostgreSQL must be running at `DATABASE_URL`",
    "- `stripe listen --forward-to localhost:3000/api/webhooks/stripe` for paid → deliverables",
    "- Stripe Checkout with test card `4242…` requires browser (not run in this script)",
    "- Resend sandbox: verification email; script uses DB token fallback",
    "",
  ];

  writeFileSync(mdPath, lines.join("\n"));
  writeFileSync(jsonPath, JSON.stringify({ runAt: new Date().toISOString(), results }, null, 2));
  console.log(`\nWrote ${mdPath}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
