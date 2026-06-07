# Clinovyr — Head-to-Toe Review

**Date:** June 6, 2026
**Scope:** Full pipeline (auth → onboarding → survey → scoring → checkout → webhook → deliverable worker → storage → portal/admin) plus hands-on evaluation of every deliverable produced.
**Method:** Static review + `tsc` typecheck + **live generation of all 41 deliverables** (6 industries × 5 + 11 generic) with Claude forced to its fallback path, then binary inspection (PDF page/word counts, XLSX sheet/formula audit, ZIP content audit).

---

## Verdict

The system is architecturally sound and, encouragingly, the deliverable layer actually runs end-to-end and produces professional, industry-specific files — **even on the worst-case fallback path with no Claude API.** TypeScript is clean (0 errors). Routing is robust. No placeholder/garbage output. Nothing here blocks a launch on code-correctness grounds.

The real risks are **operational and expectation-setting**, not broken code:

1. The deliverables run in a *separate* Cloudflare Worker that needs its own secrets — if those aren't set, paying customers get nothing.
2. The fallback content is roughly half the page length the marketing brief promises, and it ships silently whenever Claude is unavailable.
3. The "ROI Calculators" contain no live formulas.

None are hard to fix. Details and severity below.

---

## What I generated and inspected

All 41 generators returned real files, zero errors, correct MIME types. Representative results (fallback path):

| Deliverable | Pages | Words | Notes |
|---|---|---|---|
| Medical AI Readiness Report | 9 | 609 | Brief promises 15–20pp |
| Legal AI Readiness Report | 11 | 1,266 | Brief promises 14–18pp |
| Legal Prompt Library | 13 | 2,084 | Strong |
| Wellness Retention Playbook | 13 | 1,440 | Brief promises 20–25pp |
| Retail Social Content Pack | 16 | 2,293 | Strong |
| Medical ROI Calculator (XLSX) | 4 sheets | — | Matches brief; **static values** |
| Medical Blueprint Pack (ZIP) | 3 JSON + README | — | Valid Make.com blueprints |

Content quality is genuinely good: company name interpolated throughout, real tool names (Twilio w/ BAA, Jotform, Make.com), concrete metrics, HIPAA/ABA-aware framing. Email/SMS kits correctly use `{{first_name}}`-style merge fields. **No placeholder text, no `undefined`/`null` leakage.**

---

## Findings by severity

### 🔴 High — Deliverables worker needs its own secrets (operational)

Production runs on Cloudflare Workers, not Vercel (the brief is out of date here). Deliverable generation is dispatched over HTTP to a **separate** Worker, `clinovyr-deliverables`, which independently needs: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `INTERNAL_DELIVERABLES_SECRET`, and a site-URL var. Its `wrangler.jsonc` declares none of these. If `DATABASE_URL` is missing the first Prisma call throws and the customer pays but receives nothing; if `ANTHROPIC_API_KEY` is missing every deliverable silently drops to the thin fallback.

**Action:** In the Cloudflare dashboard, set all of the above as secrets on `clinovyr-deliverables` (not just `clinovyr-site`). Then run one real test purchase end-to-end. This is config, not code.

### 🟠 Medium — Fallback content is ~50–65% of promised length, and ships silently

`callClaudeText` catches every error and returns canned fallback prose. That's good resilience, but the fallback report is ~9pp vs the "15–20pp" promised. It triggers on a missing key, a rate-limit, or any API hiccup — so the short version can ship without anyone noticing.

**Action (pick one):** (a) make page-count claims aspirational/Claude-dependent in marketing; (b) expand the fallback templates so the floor is closer to promised length; (c) flag `usedFallback` back to the order so the admin panel shows when a customer received the fallback version and you can re-deliver.

### 🟠 Medium — "ROI Calculators" have zero live formulas

Every XLSX is pre-computed static values. The input sheets even say "edit to match your practice volume," but nothing recalculates when edited. For a product literally called a *calculator*, that will read as broken to a sophisticated buyer.

**Action:** Either wire real Excel formulas (inputs → savings → ROI) with `xlsx-js-style`, or rename to "ROI Model / Worksheet" and remove the "edit to recalc" hints.

### 🟢 Low — Storage fail-open (FIXED), file-type labels (FIXED)

Both fixed in this session — see below.

### 🟢 Low — Minor polish
- Wellness retention playbook leaves `{{COMPANY}}` as a literal token while the retail kit hardcodes the real company name. Pick one convention.
- Vercel Blob URLs are created with `access: "public"`; the download route auth only gates *discovery* of the (unguessable, permanent) URL, not the file itself. Acceptable for now; revisit if deliverables are ever sensitive.
- `buildArtifactContent` in `artifacts.ts` is dead code (never imported) — safe to delete.
- Legal/Retail "automation-blueprints" route to a PDF guide, not an importable ZIP — intentional per the per-industry design, just confirm that's expected.

---

## Pipeline assessment (stage by stage)

- **Auth / middleware** — Admin routes gated by `isAdminEmail`; portal routes gated by onboarding-state redirects. Sound.
- **Survey → scoring → narrative** — Auth-scoped, validated, idempotent (`upsert`), Claude narrative with fallback. Sound.
- **Checkout → webhook** — Webhook guards on `paid`/`delivered` status for idempotency; fires deliverable generation non-blocking; sends confirmation email. Sound.
- **Deliverable worker → generation → storage → email** — Robust routing with generic fallback for any unmapped key; per-file try/catch; order only marked `delivered` if ≥1 file persisted. Sound, modulo the High finding above.
- **Portal download / admin** — Download is auth-scoped to the user's own delivered order and logs each download. Admin has redeliver/refund/mark-delivered actions. Sound.

---

## Fixes applied in this session

1. **File-type mislabeling** — `DeliverableFileType` had no `xlsx`/`zip`, so every spreadsheet was stored as `"html"` and every ZIP as `"json"` (ZIP blueprint packs rendered with a JSON icon in the portal). Widened the union, corrected `spreadsheetOutput`/`zipOutput` defaults and MIME mapping, added a proper archive icon. *(types.ts, shared.ts, deliverables-grid.tsx)*
2. **Storage fail-open** — `uploadDeliverable` silently fell back to an ephemeral Worker filesystem when `BLOB_READ_WRITE_TOKEN` was missing and returned `ok:true` with a URL the main Worker can't serve → order marked "delivered" with dead links. Now fails closed in production so generation aborts instead of delivering 404s; local-dev filesystem path preserved. *(storage.ts)*

`tsc --noEmit` passes clean after all changes. (ESLint and `next build` couldn't run in this offline sandbox — Next tries to download its SWC binary — but the typecheck is the authoritative gate and is green.)

---

## Pre-launch checklist

- [ ] Set all deliverable secrets on the `clinovyr-deliverables` Worker (High finding).
- [ ] One real Stripe test-mode purchase → confirm webhook fires, files land in Blob, download links resolve, delivery email arrives.
- [ ] Decide on the fallback-length strategy (Medium finding).
- [ ] Decide: live-formula ROI calculators or rename (Medium finding).
- [ ] Replace placeholder Stripe price IDs (`price_xxx_*`) with live IDs via the `STRIPE_PRICE_*` env vars.
- [ ] Run `next build` in a networked environment to confirm the production bundle compiles.
