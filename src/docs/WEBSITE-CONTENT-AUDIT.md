# Website Content Audit — Clinovyr Marketing Site

**Date:** 2026-06-04  
**Scope:** `src/app/(site)/`, `src/components/sections/*`, `src/components/layout/{Header,Footer}.tsx`  
**References:** `src/lib/products.ts`, `src/lib/packages.ts`, `src/lib/onboarding/constants.ts`, `clinovyr-products/CLINOVYR-OPERATIONS-MANUAL.md`  
**Production check:** See [Production verification](#production-verification) (2026-06-04).

---

## Summary

| Result | Count |
|--------|------:|
| PASS   | 18 |
| WARN   | 8 |
| FAIL   | 5 (all fixed in source) |

Single-page marketing site (`/` only). No separate `/about`, `/services`, `/contact`, or `/pricing` routes — sections use hash anchors (`#about`, `#services`, etc.).

---

## Findings

| ID | Area | Status | Finding | Action |
|----|------|--------|---------|--------|
| A1 | Stripe package prices | **FAIL → fixed** | Services showed $3,500–$7,500 (assessment), $8,000–$25,000 (automation), $500–$2,500 (playbooks). Canonical: **$1,500 / $5,000 / $12,000 / $497** per `products.ts` and operations manual. | Updated `Services.tsx` to match product names and prices; replaced “AI Strategy” card with **AI Opportunity Audit**. |
| A2 | Pricing tier “Build + Run” | **FAIL → fixed** | Displayed **from $15,000**; Workflow Automation Sprint is **$12,000**. | `Pricing.tsx`: from $12,000, sprint-focused feature list, optional retainer note. |
| A3 | Opportunity Audit visibility | **WARN → fixed** | $1,500 audit not mentioned on pricing section. | Added footnote under pricing tiers. |
| A4 | Contact industry dropdown | **FAIL → fixed** | Labels (`Medical/Dental`, `Retail/Hospitality`, etc.) did not match onboarding `INDUSTRIES`. | `Contact.tsx` now imports `INDUSTRIES` from `@/lib/onboarding/constants`. |
| A5 | Vertical industry names | **WARN → fixed** | Display names diverged from onboarding; retail claimed “inventory intelligence” not in deliverable stack. | `Verticals.tsx` aligned names; toned compliance/claims to match deliverable tone (HIPAA-aware, ethics checkpoints, FTC-aware). |
| B1 | Contact email (marketing) | **PASS** | Footer, Contact section, and error copy use **clinovyr@gmail.com**. | — |
| B2 | Contact email (portal) | **WARN** | Portal/dashboard still references **clinovyr@gmail.com** (via `getContactEmail()` / `CONTACT_EMAIL`) (out of marketing scope). | Not changed in this pass; track separately. |
| B3 | Vercel references (marketing) | **PASS** | No Vercel mentions in site sections or `(site)` layout. | — |
| B4 | Vercel (backend) | **WARN** | `@vercel/blob` in deliverable storage; documented as Cloudflare deployment in code comments. | Not marketing copy. |
| C1 | Local positioning | **PASS** | Hero, Problem, Footer, metadata reference Roseville, Granite Bay, Placer County. | — |
| C2 | Tagline | **PASS** | Footer: “Intelligence, Applied.” | — |
| C3 | Industries (verticals + Other) | **PASS** | Six verticals + “Don’t see your industry?” / Other path matches onboarding. | — |
| C4 | Lorem / placeholders | **PASS** | No lorem ipsum on marketing sections; form placeholder is intentional UX copy. | — |
| C5 | Broken links | **PASS** | Nav/footer hash links match section IDs (`hero`, `about`, `process`, `services`, `pricing`, `contact`). | — |
| C6 | Playbooks URL | **WARN → fixed** | Services now links conceptually to **buy.clinovyr.com** in playbook description. | — |
| D1 | Workshops pricing | **WARN** | No fixed Stripe/list price in `products.ts`; manual describes CLI-delivered workshops only. | Services shows **Custom quote** (accurate). |
| D2 | Retainer / Fractional CAIO | **WARN** | Retainer ranges ($2K–$5K, from $4K/mo) are custom engagements, not portal checkout products. | Left as indicative ranges; Clarity/Build tiers map to portal packages. |
| D3 | Portal vs marketing promises | **WARN** | Marketing describes full consulting; portal self-serve covers assessment survey, deliverables, Stripe checkout for three packages, agent page. Workshops, playbooks store, and `app.clinovyr.com` dashboard are separate products per manual. | Assessment copy now notes client portal delivery. |
| D4 | Contact API | **PASS** | `/api/contact` exists; uses `CONTACT_EMAIL` env (should be clinovyr@gmail.com in production). | Verify Cloudflare secret. |
| D5 | HIPAA / legal claims | **PASS** | No “HIPAA compliant” guarantees on site; vertical copy uses awareness/ethics language consistent with medical/legal deliverables. | — |
| E1 | Separate marketing pages | **WARN** | No dedicated about/services/pricing routes — by design (single scroll page). | Optional future split for SEO. |
| E2 | Production parity | **FAIL** | Live site (2026-06-04) still pre-`0d306dd8` copy; main at `052614dc`. | Redeploy Cloudflare Workers (OpenNext). |
| F1 | Metadata / OG | **PASS** | `src/app/layout.tsx` — clinovyr.com canonical, Placer County keywords. | — |
| F2 | Typography / layout | **PASS** | Design tokens, responsive grids, sticky header — no issues found in code review. | — |

---

## Canonical product prices (source of truth)

| Product | Price (`products.ts`) |
|---------|----------------------:|
| AI Opportunity Audit | $1,500 |
| AI Readiness Assessment | $5,000 |
| Workflow Automation Sprint | $12,000 |
| Industry Playbooks (buy.clinovyr.com) | $497 |

---

## Files changed

- `src/components/sections/Services.tsx` — prices, product names, playbook URL note
- `src/components/sections/Pricing.tsx` — Build + Run tier, audit footnote
- `src/components/sections/Contact.tsx` — industry options from onboarding constants
- `src/components/sections/Verticals.tsx` — industry labels and claim tone
- `src/docs/WEBSITE-CONTENT-AUDIT.md` — this report

---

## Recommendations

1. **Deploy** marketing site to Cloudflare so production matches corrected prices.
2. Set **`CONTACT_EMAIL=clinovyr@gmail.com`** in production if not already.
3. **Portal follow-up:** replace `getContactEmail()` in portal/checkout copy for consistency.
4. Consider adding **Privacy** / **Terms** footer links when pages exist.

---

## Production verification

**Date:** 2026-06-04  
**Method:** `curl -L` against https://clinovyr.com (Cloudflare / OpenNext); HTML text extraction (scripts stripped).  
**Repo baseline:** `main` @ `052614dc` (`052614dc` email, `0d306dd8` website copy, `4780b444` portal, `a69fa281` polish).  
**Verdict:** **Deploy lag** — production does not match `main`. No source rollback; redeploy required.

### HTTP status codes

| URL | Status | Notes |
|-----|--------|-------|
| https://clinovyr.com/ | **200** | Marketing homepage renders |
| https://clinovyr.com/auth/register | **404** | Next.js not-found shell (portal not deployed) |
| https://clinovyr.com/auth/login | **404** | Same |
| https://clinovyr.com/api/health | **404** | JSON health route absent on live worker |
| https://clinovyr.com/admin | **404** | Expected login redirect in source; live has no `/admin` route |

### Production vs source checklist

| Check | Production | Source (`main`) | Result |
|-------|------------|-----------------|--------|
| Canonical prices ($1,500 / $5,000 / $12,000 / $497) | Services show **$3,500–$7,500**, **$8,000–$25,000**, **$500–$2,500**; pricing tier **from $15,000** | `Services.tsx`, `Pricing.tsx`, `products.ts` | **FAIL** |
| Product names (Opportunity Audit, Readiness Assessment, Automation Sprint) | **AI Strategy & Roadmap**, **Workflow Automation** (not Sprint); no Opportunity Audit card | `Services.tsx` | **FAIL** |
| Footer/contact email | **hello@clinovyr.com** (footer + 404 pages) | **clinovyr@gmail.com** (`Footer.tsx`, `Contact.tsx`) | **FAIL** |
| No hello@clinovyr.com | Present (6× in HTML) | Removed from `src/` | **FAIL** |
| Six industries + Other (contact) | Six options + Other present | `INDUSTRIES` in `constants.ts` (updated labels) | **WARN** — count OK; labels still legacy (`Medical/Dental`, etc.) |
| Placer County / local positioning | Placer County, Roseville, Granite Bay in meta + body | Aligned | **PASS** |
| Portal routes (register/login) | 404 | Routes under `src/app/(auth)/auth/*` | **FAIL** |
| `/api/health` | 404 | `src/app/api/health/route.ts` | **FAIL** |
| `/admin` → login | 404 (no redirect) | Portal admin middleware in source | **FAIL** |
| Page structure (sections, headings) | `#services`, `#pricing`, `#contact`, h1/h2/h3 present | — | **PASS** (layout intact; copy stale) |

### Live pricing snapshot (homepage, 2026-06-04)

Services mono prices observed: `$3,500–$7,500`, `$8,000–$25,000`, `$2,000–$5,000/mo`, `$1,500–$4,000`, `$12,000–$30,000`, `$500–$2,500`. Pricing section **Build + Run** tier: **from $15,000**. No **$497** playbook price on homepage.

### Deploy lag summary

| Item | Value |
|------|--------|
| Latest `main` | `052614dc` — fix: align portal contact email with marketing site |
| Related fixes on `main` not live | `0d306dd8` (copy/prices), `4780b444` (portal), `a69fa281` (health + polish) |
| Production behavior | Pre-copy-fix marketing build + no portal/health routes |
| Action | Redeploy Clinovyr app to Cloudflare Workers; confirm `CONTACT_EMAIL=clinovyr@gmail.com` in worker secrets |

### Production PASS / WARN / FAIL (summary table)

| Area | Status |
|------|--------|
| Homepage HTTP / layout | **PASS** |
| Local positioning (Placer County) | **PASS** |
| Contact industry count (6 + Other) | **WARN** (legacy labels) |
| Canonical pricing | **FAIL** |
| Product names | **FAIL** |
| Marketing email | **FAIL** |
| Portal auth routes | **FAIL** |
| API health | **FAIL** |
| Admin route | **FAIL** |
| Deploy matches `main` | **FAIL** (deploy lag) |

**Code changes from this verification:** None — source on `main` is correct; issue is deployment only.
