# Deploying Clinovyr to Cloudflare Workers

This site uses [@opennextjs/cloudflare](https://opennext.js.org/cloudflare/get-started) so the Worker serves the OpenNext build output (`.open-next/`), not the repo root. **Do not** set `assets.directory` to `.` — that uploads `node_modules` and fails deploy.

Worker name: **`clinovyr-site`** (see `wrangler.jsonc`).

## Worker bundle size (free vs paid)

Cloudflare enforces a **compressed** script size limit **per Worker**:

| Plan | Script limit | Clinovyr (split architecture) |
|------|--------------|-------------------------------|
| Workers **Free** | **3 MiB** | **Fits** — main + deliverables Workers each deploy separately |
| Workers **Paid** | **10 MiB** | Optional headroom for future features |

### Two-Worker architecture

PDF/ZIP deliverable generation (`@react-pdf`, `archiver`, `xlsx-js-style`, industry generators) runs in a **separate** Worker. The main site Worker calls it via **HTTP** (`DELIVERABLES_WORKER_URL`) — same URLs, same UI, no user-facing change.

| Worker | Name | Role | Dry-run gzip (verify locally) |
|--------|------|------|-------------------------------|
| **Main** | `clinovyr-site` | Marketing, auth, portal, Stripe webhooks, Prisma, admin | **~2.8 MiB** (`wrangler deploy --dry-run`) |
| **Deliverables** | `clinovyr-deliverables` | `runDeliverableGeneration` + all generators | **~2.7 MiB** (`wrangler deploy --dry-run -c workers/deliverables/wrangler.jsonc`) |

Flow: Stripe webhook → `triggerDeliverableGeneration()` in main Worker → `fetch(DELIVERABLES_WORKER_URL/generate)` → deliverables Worker generates PDFs, uploads to Blob, updates DB, sends email.

**HTTP endpoint:** set `DELIVERABLES_WORKER_URL` on **`clinovyr-site`** (e.g. `https://clinovyr-deliverables.<account-subdomain>.workers.dev` from deliverables deploy logs). Alternatively set `CLOUDFLARE_ACCOUNT_SUBDOMAIN` and the URL is derived automatically.

**Internal auth:** set the same `INTERNAL_DELIVERABLES_SECRET` on **both** Workers (optional but recommended). Main sends `X-Clinovyr-Internal-Secret`; deliverables Worker rejects mismatches.

### Earlier optimizations (still required)

1. **Removed** dynamic `opengraph-image.tsx` — `@vercel/og` WASM (~2 MiB).
2. **Webpack stub** for `@vercel/og` in `next.config.ts`.
3. **Prisma edge** — `@prisma/client/edge` only (no Node `query_compiler_fast_bg.wasm-base64.js`).
4. **Static OG** — `public/og.svg`.
5. **`outputFileTracingExcludes`** — generators excluded from main Next trace.
6. **Dynamic `import()`** for Stripe in webhook handler.

**Do not** re-add `opengraph-image.tsx` or static-import deliverable generators into main API routes.

### Verify bundle size (Node.js 22+)

```bash
npx prisma generate
npm run build:cloudflare
wc -c .open-next/server-functions/default/handler.mjs
gzip -c .open-next/server-functions/default/handler.mjs | wc -c

# Full Worker upload estimate (requires Node 22+)
npm run build:cloudflare && npx wrangler deploy --dry-run 2>&1 | grep -i "gzip"
npx wrangler deploy --dry-run -c workers/deliverables/wrangler.jsonc 2>&1 | grep -i "gzip"
```

### Deploy both Workers

**Local or GitHub Actions** (both Workers from one machine):

```bash
npx prisma generate
npm run deploy:deliverables   # clinovyr-deliverables first
npm run deploy                # clinovyr-site (set DELIVERABLES_WORKER_URL on main Worker)
# or: npm run deploy:all
```

**Cloudflare Workers Builds** — configure **two** separate builds in the dashboard (same repo, branch `main`):

| Worker | Build command | Deploy command |
|--------|---------------|----------------|
| **`clinovyr-deliverables`** (deploy first) | `npx prisma generate` | `OPEN_NEXT_DEPLOY=true npx wrangler deploy -c workers/deliverables/wrangler.jsonc` |
| **`clinovyr-site`** (deploy second) | *(empty)* or `npx prisma generate && npx opennextjs-cloudflare build` | `npx wrangler deploy` or `npx opennextjs-cloudflare deploy` |

**Why two Workers Builds?** Cloudflare sets **`WRANGLER_CI_OVERRIDE_NAME`** to the connected Worker name. A build connected to **`clinovyr-site`** cannot deploy **`clinovyr-deliverables`** — any `wrangler deploy` is overridden to **`clinovyr-site`**. See [CLOUDFLARE-BUILD-SETTINGS.md](./CLOUDFLARE-BUILD-SETTINGS.md).

**One-time local deliverables deploy** (if deliverables Worker is not yet live):

```bash
OPEN_NEXT_DEPLOY=true npx wrangler deploy -c workers/deliverables/wrangler.jsonc
```

Then set **`DELIVERABLES_WORKER_URL`** on **`clinovyr-site`** from the `*.workers.dev` URL in deploy output.

GitHub Actions (`.github/workflows/deploy-cloudflare.yml`) deploys **deliverables first**, then **main**.

### Last resort (not implemented)

If the main Worker grows past 3 MiB again: split portal static shell to `app.clinovyr.com` on Pages + API Worker. Document only — not needed at current sizes.

## Choose one deploy path (required)

Running **both** paths on every `git push` to `main` causes duplicate deploys, race conditions, and stale bundles. Pick **one**:

| Path | What deploys | One-time setup | Disable the other path |
|------|----------------|----------------|------------------------|
| **GitHub Actions** (recommended) | **Both** Workers — deliverables first, then main ([workflow](.github/workflows/deploy-cloudflare.yml)) | GitHub repo → **Settings** → **Secrets and variables** → **Actions**: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | **Workers & Pages** → each Worker → **Settings** → **Builds** → disconnect Git or pause builds |
| **Cloudflare Git Builds** | **Each Worker separately** — you must configure **`clinovyr-deliverables` and `clinovyr-site`** in the dashboard ([settings](./CLOUDFLARE-BUILD-SETTINGS.md)) | Dashboard build/deploy commands + **Variables and Secrets** on **both** Workers; deploy deliverables **before** main | GitHub → **Settings** → **Actions** → **General** → disable workflow, **or** delete [`.github/workflows/deploy-cloudflare.yml`](.github/workflows/deploy-cloudflare.yml) |

**GitHub Actions secrets** (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) are **not** created by Cloudflare dashboard sync — add them manually in GitHub if you use Actions.

**Cloudflare Worker secrets** (`DATABASE_URL`, `INTERNAL_DELIVERABLES_SECRET`, etc.) are **not** used by GitHub Actions for runtime — set them on each Worker in the dashboard regardless of deploy path.

## GitHub Actions (recommended — push to `main` deploys)

Pushing to **`main`** runs [`.github/workflows/deploy-cloudflare.yml`](.github/workflows/deploy-cloudflare.yml):

1. Node.js **22**
2. `npm ci` (postinstall may run `scripts/ci-opennext-build.js` in CI)
3. `npx prisma generate`
4. `npm run deploy:deliverables` then `npm run deploy` (or `npm run deploy:all`)

**One-time setup** (repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**):

| Secret | How to obtain |
|--------|----------------|
| `CLOUDFLARE_API_TOKEN` | [Cloudflare dashboard](https://dash.cloudflare.com/profile/api-tokens) → **Create Token** → template **Edit Cloudflare Workers** (or custom token with **Account** → Workers Scripts **Edit** and **Account** → Workers KV/R2/etc. as needed for your account). Copy the token value once. |
| `CLOUDFLARE_ACCOUNT_ID` | Dashboard → any zone or **Workers & Pages** → right sidebar **Account ID** (32-character hex). |

Cloudflare **Workers & Pages → Git** and **Worker secrets** in the dashboard are separate from **GitHub Actions** secrets. Syncing or setting variables in Cloudflare does **not** create `CLOUDFLARE_API_TOKEN` in this GitHub repo — you must add the two rows in the table below under **GitHub** → **Settings** → **Secrets and variables** → **Actions** (names must match exactly, or use fallbacks `CF_API_TOKEN` / `WRANGLER_API_TOKEN` and `CF_ACCOUNT_ID` as documented in the workflow).

Do **not** commit token values. After both secrets exist, **`git push origin main` deploys production** — you do not need a separate manual `wrangler deploy` for routine releases.

Token must be allowed to deploy **`clinovyr-deliverables`** and **`clinovyr-site`** in the account that owns **clinovyr.com**.

### Verify the workflow ran

GitHub → **Actions** → **Deploy to Cloudflare** → latest run on your commit should be green. Then:

```bash
./scripts/post-deploy-smoke.sh
```

## Cloudflare dashboard (Git-connected build)

Use this path only if you chose **Cloudflare Git Builds** in [Choose one deploy path](#choose-one-deploy-path-required) — not alongside active GitHub Actions.

**Copy-paste Build/Deploy commands and secrets for both Workers:** **[CLOUDFLARE-BUILD-SETTINGS.md](./CLOUDFLARE-BUILD-SETTINGS.md)**.

1. **`clinovyr-deliverables`** — Builds + secrets (deploy **first**)
2. **`clinovyr-site`** — Builds + secrets (deploy **second**)

Same repo **Papaburgndy/clinovyr-site**, branch **`main`** on each Worker.

### Required dashboard settings (summary)

| Setting | Value |
|--------|--------|
| **Build command** | `npx prisma generate && npx opennextjs-cloudflare build` |
| **Deploy command** | `npx opennextjs-cloudflare deploy` |
| **Root directory** | `/` |
| **Node.js version** | **22** or later |

**`npx wrangler deploy`** on **`clinovyr-site`** runs `wrangler.jsonc` `[build].command` → **`scripts/cloudflare-build.js`** (Prisma + OpenNext compile only). It **does not** deploy deliverables — use **separate Workers Builds on `clinovyr-deliverables`**. See **Option D** in [CLOUDFLARE-BUILD-SETTINGS.md](./CLOUDFLARE-BUILD-SETTINGS.md).

After deliverables deploy (separate build or one-time local), set **`DELIVERABLES_WORKER_URL`** on **`clinovyr-site`** from the `*.workers.dev` URL.

**Alternative:** empty build + **`npm run deploy`** (build and deploy in one step).

**Runtime secrets** (e.g. `DATABASE_URL`, `AUTH_SECRET`) go in **Variables and Secrets** on the Worker — not GitHub Actions secrets — for Cloudflare-native Git builds.

### Dual-worker deploy (Cloudflare Git Builds)

1. **Create Workers Builds on `clinovyr-deliverables`** — deploy command: `OPEN_NEXT_DEPLOY=true npx wrangler deploy -c workers/deliverables/wrangler.jsonc`. Dashboard Worker name must be **`clinovyr-deliverables`**.
2. **Deploy `clinovyr-site`** — Option A (`npx opennextjs-cloudflare deploy`) or Option D (`npx wrangler deploy`). See **CLOUDFLARE-BUILD-SETTINGS.md**.
3. Set **`DELIVERABLES_WORKER_URL`** on **`clinovyr-site`** from deliverables deploy logs.

**Local / GitHub Actions:** `node scripts/cloudflare-deploy.js` or `npm run deploy:all` deploys both Workers in order. **Not** for `clinovyr-site` Workers Builds (script skips deliverables when `WRANGLER_CI_OVERRIDE_NAME=clinovyr-site`).


## Client portal (clinovyr.com — main Worker)

The root Next.js app now includes **auth**, **client portal** (`/dashboard`, `/onboarding`, `/results`), **survey → Stripe checkout**, **deliverables**, and **admin** (`/admin`). Deploy on the **same** Cloudflare Worker as the marketing site (`clinovyr-site`).

### Database (PostgreSQL)

Prisma requires a reachable Postgres URL at **runtime** and for **migrations** (run outside the Worker):

| Step | Command | Where |
|------|---------|--------|
| Generate client | `npx prisma generate` | CI postinstall (`scripts/ci-opennext-build.js`) or local |
| Apply migrations | `npx prisma migrate deploy` | CI job, local shell, or one-off GitHub Action — **not** inside the Worker bundle |

Set `DATABASE_URL` as a Worker secret (Neon, Supabase, Railway Postgres, etc.). Workers do not run `migrate deploy` on each request.

### Production environment variables (main site + portal)

Set in **Cloudflare Worker secrets** (or encrypted env). See `.env.local.example` at repo root.

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Prisma / Postgres |
| `AUTH_SECRET` or `NEXTAUTH_SECRET` | Yes | Auth.js session signing (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | `https://clinovyr.com` |
| `SITE_URL` | Yes | Stripe redirects, email links (`https://clinovyr.com`) |
| `STRIPE_SECRET_KEY` | Yes | Checkout + webhooks |
| `STRIPE_WEBHOOK_SECRET` | Yes | Verify Stripe webhooks |
| `STRIPE_PRICE_AUDIT` | No* | Price IDs (*or set real IDs in catalog) |
| `STRIPE_PRICE_ASSESSMENT` | No* | |
| `STRIPE_PRICE_SPRINT` | No* | |
| `RESEND_API_KEY` | Yes | Transactional email |
| `RESEND_FROM_EMAIL` | Prod | Verified sender after domain setup |
| `RESEND_SANDBOX` | No | `true` for QA only |
| `CONTACT_EMAIL` | Yes | Internal notifications inbox |
| `ADMIN_EMAIL` | Yes | Allowlist for `/admin` |
| `DELIVERABLES_WORKER_URL` | Yes | On **`clinovyr-site`** — `https://clinovyr-deliverables.<subdomain>.workers.dev` |
| `INTERNAL_DELIVERABLES_SECRET` | Recommended | On **both** Workers — main → deliverables HTTP auth |
| `CALENDLY_URL` | No | Booking links |

**Deliverables-only secrets** (`ANTHROPIC_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `RESEND_*` for delivery email) go on **`clinovyr-deliverables`** — see [CLOUDFLARE-BUILD-SETTINGS.md](./CLOUDFLARE-BUILD-SETTINGS.md). Blob code uses `@vercel/blob` today (token works from Workers); R2 migration is a future option.

### Stripe webhook (production)

1. Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL:** `https://clinovyr.com/api/webhooks/stripe`
3. **Events:** `checkout.session.completed` (and any others your handlers expect)
4. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET` in Cloudflare
5. Legacy alias still supported: `https://clinovyr.com/api/stripe/webhook`

Local: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Build notes

- Root `tsconfig.json` excludes `clinovyr-products/` and `scripts/` so the main site build does not typecheck product sub-apps.
- Admin and portal route groups use `export const dynamic = "force-dynamic"` (no DB access at static export time).


## Environment variables / secrets

Set these as **Worker secrets** (or encrypted env vars) in the Cloudflare dashboard for production:

| Variable | Required | Purpose |
|----------|----------|---------|
| `RESEND_API_KEY` | Yes | Resend API for `/api/contact` |
| `CONTACT_EMAIL` | Yes | Company inbox (clinovyr@gmail.com) for form submissions |
| `RESEND_FROM_EMAIL` | No | Custom From address (defaults in code) |

For local preview with bindings, copy `.dev.vars.example` to `.dev.vars` and fill in values (`.dev.vars` is gitignored).

## Verify locally

Requires Node.js 22+ (Wrangler 4).

```bash
# Simulate Cloudflare postinstall build (creates .open-next/)
CI=true npm run postinstall

# Build only — confirms .open-next/ is produced
npm run build:cloudflare

# Full build + deploy (same as recommended Cloudflare deploy command)
npm run deploy

# Dry-run after build (requires Node 22+)
npm run build:cloudflare && npx wrangler deploy --dry-run
```

Optional Workers runtime preview after build:

```bash
npm run preview
```

## Push

```bash
git push origin main
```

With **GitHub Actions** secrets configured (see [Choose one deploy path](#choose-one-deploy-path-required)), this deploys **both** Workers automatically. If you use **Cloudflare Git Builds** instead, configure both Workers in the dashboard and disable Actions so pushes do not double-deploy.

## Production stale fix

Use this when **clinovyr.com** shows old marketing copy (e.g. `hello@clinovyr.com`, `$3,500` assessment), **404** on `/auth/register` or `/api/health`, while **git `main`** already has the portal and updated content (e.g. commit `052614dc`).

**Typical root cause:** The live Worker (`clinovyr-site` per `wrangler.jsonc`) is serving an **old OpenNext build**. Git `main` is correct, but deploy did not run or failed: missing GitHub secrets, failed **Deploy to Cloudflare** workflow, stale **Cloudflare Workers Builds** settings, or only `git push` without CI configured.

**Fix:** Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (see **GitHub Actions** above), push `main`, confirm the Actions run succeeded, then run smoke tests.

**Symptoms on production (stale):**

| Check | Stale | Expected after fix |
|-------|--------|---------------------|
| `curl -sS -o /dev/null -w "%{http_code}" https://clinovyr.com/auth/register` | `404` | `200` |
| `curl -sS https://clinovyr.com/api/health` | HTML 404 page | JSON `ok` |
| Homepage contact | `hello@clinovyr.com` | `clinovyr@gmail.com` |
| Assessment price in HTML | `$3,500` | `$5,000` (and no stale `$3,500` in pricing) |

Response header `x-opennext: 1` means traffic **is** on the OpenNext Worker—not a separate static host—but the **bundle is old**.

### Fix (5 steps)

1. **Cloudflare dashboard** → **Workers & Pages** → open **`clinovyr-site`** (name must match `wrangler.jsonc` `"name"`). Confirm custom domain **clinovyr.com** is attached to this Worker, not a different project.

2. **Trigger deployment** from the latest GitHub **`main`** commit (e.g. `052614dc`): **Deployments** → **Retry deployment** or **Create deployment** from `main`. If Builds are disconnected, reconnect the repo and branch `main`.

3. **Verify build settings** (Settings → Builds) — see **CLOUDFLARE-BUILD-SETTINGS.md**:
   - **Build command:** `npx prisma generate && npx opennextjs-cloudflare build`
   - **Deploy command:** `npx opennextjs-cloudflare deploy` (or `npm run deploy` with empty build)
   - **Node.js:** 22+
   - Do **not** use **Build command: None** + **`npx wrangler deploy`**.

4. **Set secrets** on this Worker (see tables above): at minimum `DATABASE_URL`, `AUTH_SECRET` / `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `SITE_URL`, Stripe, Resend, `CONTACT_EMAIL=clinovyr@gmail.com`, `ADMIN_EMAIL`, etc. Run `npx prisma migrate deploy` against production Postgres outside the Worker.

5. After a **successful** deploy, re-run smoke tests:
   ```bash
   ./scripts/post-deploy-smoke.sh
   ```

### Local redeploy (operator machine)

Requires **Node.js 22+**, `wrangler login` or `CLOUDFLARE_API_TOKEN` + account ID, then from repo root:

```bash
npm run deploy:all   # deliverables first, then main
```

This agent environment could not redeploy: no Cloudflare credentials, Wrangler requires Node 22 (local default was Node 20).

