/**
 * End-to-end purchase test: survey → score → pay (signed Stripe webhook) → deliverables.
 *
 * Runs the REAL application code paths against your LOCAL dev environment.
 *
 *   1. Start Postgres + your dev server:   npm run dev   (http://localhost:3000)
 *   2. Ensure .env.local has a real STRIPE_WEBHOOK_SECRET (whsec_…) and DATABASE_URL.
 *   3. Run one of:
 *        npx tsx scripts/e2e-purchase.ts selfcheck   # no DB/server — proves webhook signing
 *        npx tsx scripts/e2e-purchase.ts             # full chain (default)
 *        npx tsx scripts/e2e-purchase.ts cleanup      # remove the test user/company/order
 *
 * Env overrides:
 *   BASE_URL           (default http://localhost:3000)
 *   E2E_EMAIL          (default e2e-purchase@clinovyr.test)
 *   E2E_INDUSTRY       (default "Medical & Dental")
 *   E2E_REAL_CHECKOUT=1  use the live Stripe test API to create the session (needs sk_test_… )
 *
 * Note: locally the webhook dispatches deliverable generation to a remote Worker
 * (DELIVERABLES_WORKER_URL). This script instead runs runDeliverableGeneration()
 * in-process after the webhook — the exact code that Worker executes — so the
 * full chain is exercised on one machine.
 */
import { config } from "dotenv";
import { join } from "path";
import Stripe from "stripe";

config({ path: join(process.cwd(), ".env.local") });
config({ path: join(process.cwd(), ".env") });

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const EMAIL = process.env.E2E_EMAIL ?? "e2e-purchase@clinovyr.test";
const INDUSTRY = process.env.E2E_INDUSTRY ?? "Medical & Dental";
const COMPANY_NAME = "E2E Granite Bay Dental";

const C = {
  ok: (s: string) => console.log(`\x1b[32m✓\x1b[0m ${s}`),
  no: (s: string) => console.log(`\x1b[31m✗ ${s}\x1b[0m`),
  info: (s: string) => console.log(`  ${s}`),
  head: (s: string) => console.log(`\n\x1b[1m${s}\x1b[0m`),
};

function isPlaceholder(v: string | undefined): boolean {
  return !v || v.includes("...") || v.includes("…") || v.length < 12;
}

function buildFormData() {
  return {
    companyName: COMPANY_NAME, industry: INDUSTRY, employees: "6–20", revenue: "$500K–$2M",
    yearsInBusiness: "8", crm: ["HubSpot"], emailTools: ["Mailchimp"], scheduling: ["Calendly"],
    pm: ["Notion"], accounting: ["QuickBooks"],
    timeDrainsRanked: ["Customer follow-up", "Email management", "Data entry", "Report generation", "Appointment scheduling", "Invoicing/billing", "Social media", "Staff communication"],
    aiTools: "Tried a few", comfortLevel: 3, biggestConcern: "Don't know where to start",
    goals: ["Save staff time", "Increase revenue", "Work fewer hours"],
    firstName: "E2E", lastName: "Tester", email: EMAIL, phone: "916-555-0199",
    bestTimeToConnect: "Flexible", hearAbout: "Referral", additionalNotes: "E2E purchase test",
  };
}

/** Build a signed Stripe checkout.session.completed event for /api/webhooks/stripe. */
function buildSignedEvent(args: {
  secret: string; sessionId: string; companyId: string; userId: string;
  product: string; deliverableKeys: string[]; amount: number;
}) {
  const stripe = new Stripe("sk_test_dummy_for_signing", { apiVersion: "2024-06-20" as Stripe.LatestApiVersion });
  const session = {
    id: args.sessionId, object: "checkout.session", client_reference_id: args.companyId,
    customer_email: EMAIL, amount_total: args.amount, currency: "usd", payment_status: "paid",
    payment_intent: `pi_e2e_${Date.now()}`,
    metadata: { companyId: args.companyId, userId: args.userId, product: args.product, deliverables: JSON.stringify(args.deliverableKeys) },
  };
  const event = {
    id: `evt_e2e_${Date.now()}`, object: "event", type: "checkout.session.completed",
    api_version: "2024-06-20", created: Math.floor(Date.now() / 1000), data: { object: session },
  };
  const payload = JSON.stringify(event);
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: args.secret });
  return { payload, header };
}

async function selfcheck() {
  C.head("SELF-CHECK — webhook signing/verification (no DB, no server)");
  const secret = process.env.STRIPE_WEBHOOK_SECRET && !isPlaceholder(process.env.STRIPE_WEBHOOK_SECRET)
    ? process.env.STRIPE_WEBHOOK_SECRET
    : "whsec_selfcheck_dummy_secret_value";
  const { payload, header } = buildSignedEvent({
    secret, sessionId: "cs_test_selfcheck", companyId: "cmp_x", userId: "usr_x",
    product: "AI Readiness Assessment", deliverableKeys: ["assessment-report-pdf"], amount: 500000,
  });
  const stripe = new Stripe("sk_test_dummy", { apiVersion: "2024-06-20" as Stripe.LatestApiVersion });
  try {
    const event = stripe.webhooks.constructEvent(payload, header, secret);
    C.ok(`Signature verified — event type "${event.type}"`);
    const obj = (event.data.object as { metadata?: Record<string, string> });
    C.ok(`Metadata round-trips — deliverables=${obj.metadata?.deliverables}`);
    C.info("Signing works. The full run will post an identically-signed event to your server.");
  } catch (e) {
    C.no(`Verification failed: ${(e as Error).message}`);
    process.exit(1);
  }
}

async function cleanup() {
  C.head("CLEANUP");
  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({ where: { email: EMAIL }, include: { company: true } });
  if (!user) { C.info("No test user found — nothing to clean."); return; }
  const companyId = user.company?.id;
  if (companyId) {
    await prisma.order.deleteMany({ where: { companyId } });
    await prisma.survey.deleteMany({ where: { companyId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
  }
  await prisma.user.deleteMany({ where: { email: EMAIL } });
  C.ok(`Removed test user ${EMAIL} and related rows.`);
}

async function full() {
  C.head("PREFLIGHT");
  if (isPlaceholder(process.env.DATABASE_URL)) { C.no("DATABASE_URL missing/placeholder in .env.local"); process.exit(1); }
  if (isPlaceholder(process.env.STRIPE_WEBHOOK_SECRET)) {
    C.no("STRIPE_WEBHOOK_SECRET is missing or a placeholder (whsec_…). Put your real Stripe test webhook secret in .env.local."); process.exit(1);
  }
  const { prisma } = await import("@/lib/prisma");
  try { await prisma.$queryRaw`SELECT 1`; C.ok("Database reachable"); }
  catch (e) { C.no(`Database not reachable: ${(e as Error).message}`); process.exit(1); }
  try { const r = await fetch(`${BASE_URL}/api/health`); C.ok(`Dev server reachable at ${BASE_URL} (health ${r.status})`); }
  catch { C.no(`Dev server not reachable at ${BASE_URL} — run "npm run dev" first.`); process.exit(1); }

  // ---- SEED: user, company, scored survey ----
  C.head("1. SEED — user, company, completed survey (real scoring + narrative)");
  const bcrypt = (await import("bcryptjs")).default;
  const { calculateAIReadinessScore } = await import("@/lib/scoring");
  const { generateSurveyNarrative } = await import("@/lib/executive-summary");
  const { mapIndustryForScoring } = await import("@/lib/assessment-utils");

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { emailVerified: new Date() },
    create: { email: EMAIL, name: "E2E Tester", password: await bcrypt.hash("E2eTestPass123!", 10), emailVerified: new Date() },
  });
  const company = await prisma.company.upsert({
    where: { userId: user.id },
    update: { name: COMPANY_NAME, industry: INDUSTRY, onboardingComplete: true },
    create: { userId: user.id, name: COMPANY_NAME, industry: INDUSTRY, size: "6–20", revenue: "$500K–$2M", city: "Granite Bay", state: "CA", onboardingComplete: true },
  });
  const formData = { ...buildFormData(), companyName: company.name, industry: mapIndustryForScoring(company.industry) };
  const score = calculateAIReadinessScore(formData);
  const narrative = await generateSurveyNarrative(formData, score, { name: company.name, industry: company.industry, size: company.size, revenue: company.revenue });
  await prisma.survey.upsert({
    where: { companyId: company.id },
    update: { status: "complete", responses: { step: 6, formData }, score: score.overallScore, tier: score.tier, topOpportunities: score.topOpportunities, recommendedPkg: score.recommendedPackage, estimatedROI: score.estimatedAnnualROI, executiveSummary: narrative.executiveSummary, biggestOpportunity: narrative.biggestOpportunity, readinessStatement: narrative.readinessStatement, nextStep: narrative.nextStep, completedAt: new Date() },
    create: { companyId: company.id, status: "complete", responses: { step: 6, formData }, score: score.overallScore, tier: score.tier, topOpportunities: score.topOpportunities, recommendedPkg: score.recommendedPackage, estimatedROI: score.estimatedAnnualROI, executiveSummary: narrative.executiveSummary, biggestOpportunity: narrative.biggestOpportunity, readinessStatement: narrative.readinessStatement, nextStep: narrative.nextStep, completedAt: new Date() },
  });
  C.ok(`Survey scored: ${score.overallScore}/100 (${score.tier}) → ${score.recommendedPackage}`);

  // ---- CHECKOUT: create the pending Order ----
  C.head("2. CHECKOUT — create pending order");
  const { getProduct, resolveProductKey } = await import("@/lib/products");
  const productKey = resolveProductKey(score.recommendedPackage);
  const product = getProduct(productKey);
  const deliverableKeys = [...product.deliverables];
  const sessionId = `cs_test_e2e_${Date.now()}`;
  await prisma.order.upsert({
    where: { companyId: company.id },
    update: { product: productKey, amount: product.amount, status: "pending", stripeSessionId: sessionId, deliverables: deliverableKeys },
    create: { companyId: company.id, product: productKey, amount: product.amount, status: "pending", stripeSessionId: sessionId, deliverables: deliverableKeys },
  });
  const order = await prisma.order.findUniqueOrThrow({ where: { companyId: company.id } });
  C.ok(`Pending order ${order.id} — ${product.name} ($${(product.amount / 100).toLocaleString()}), ${deliverableKeys.length} deliverables`);

  // ---- WEBHOOK: post a signed checkout.session.completed ----
  C.head("3. WEBHOOK — POST signed checkout.session.completed → /api/webhooks/stripe");
  const { payload, header } = buildSignedEvent({ secret: process.env.STRIPE_WEBHOOK_SECRET!, sessionId, companyId: company.id, userId: user.id, product: productKey, deliverableKeys, amount: product.amount });
  const res = await fetch(`${BASE_URL}/api/webhooks/stripe`, { method: "POST", headers: { "Content-Type": "application/json", "stripe-signature": header }, body: payload });
  const resBody = await res.text();
  if (res.status !== 200) { C.no(`Webhook returned ${res.status}: ${resBody}`); process.exit(1); }
  C.ok(`Webhook accepted (200): ${resBody}`);
  const afterWebhook = await prisma.order.findUniqueOrThrow({ where: { companyId: company.id } });
  if (afterWebhook.status === "paid" || afterWebhook.status === "delivered") C.ok(`Order marked "${afterWebhook.status}", paidAt=${afterWebhook.paidAt?.toISOString() ?? "—"}`);
  else { C.no(`Order still "${afterWebhook.status}" after webhook`); process.exit(1); }

  // ---- GENERATION: run the deliverables worker code in-process ----
  C.head("4. GENERATION — runDeliverableGeneration() (the deliverables Worker code)");
  if (afterWebhook.status !== "delivered") {
    const { runDeliverableGeneration } = await import("@/lib/deliverables/run-generation");
    await runDeliverableGeneration({ companyId: company.id, product: productKey, deliverableKeys, orderId: order.id });
  } else C.info("Order already delivered (a Worker handled it) — skipping in-process run.");

  // ---- VERIFY ----
  C.head("5. VERIFY — deliverables");
  const final = await prisma.order.findUniqueOrThrow({ where: { companyId: company.id } });
  const records = Array.isArray(final.deliverables) ? (final.deliverables as Array<Record<string, unknown>>) : [];
  if (final.status !== "delivered") { C.no(`Order status is "${final.status}", expected "delivered"`); process.exit(1); }
  C.ok(`Order delivered — ${records.length} files, deliveredAt=${final.deliveredAt?.toISOString() ?? "—"}`);
  let fallbacks = 0;
  for (const r of records) {
    const fb = r.usedFallback ? " \x1b[33m[FALLBACK]\x1b[0m" : "";
    if (r.usedFallback) fallbacks++;
    C.info(`• ${String(r.name).padEnd(34)} ${String(r.type).padEnd(6)} ${String(Math.round(Number(r.size) / 1024))}KB${fb}`);
  }
  const missing = deliverableKeys.filter((k) => !records.some((r) => r.key === k));
  C.head("RESULT");
  if (missing.length === 0 && records.length > 0) C.ok(`PASS — all ${deliverableKeys.length} expected deliverables produced and stored.`);
  else C.no(`Missing deliverables: ${missing.join(", ") || "(none, but list empty)"}`);
  if (fallbacks > 0) C.info(`\x1b[33m${fallbacks} deliverable(s) used fallback content — set ANTHROPIC_API_KEY for full Claude output.\x1b[0m`);
  C.info(`View as the client: ${BASE_URL}/dashboard/deliverables  (admin: ${BASE_URL}/admin/clients/${company.id})`);
  C.info(`Clean up with: npx tsx scripts/e2e-purchase.ts cleanup`);
}

const mode = process.argv[2] ?? "full";
const run = mode === "selfcheck" ? selfcheck : mode === "cleanup" ? cleanup : full;
run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
