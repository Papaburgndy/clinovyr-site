# Deploying Clinovyr to Cloudflare Workers

This site uses [@opennextjs/cloudflare](https://opennext.js.org/cloudflare/get-started) so the Worker serves the OpenNext build output (`.open-next/`), not the repo root. **Do not** set `assets.directory` to `.` — that uploads `node_modules` and fails deploy.

Worker name: **`clinovyr-site`** (see `wrangler.jsonc`).

## GitHub Actions (recommended — push to `main` deploys)

Pushing to **`main`** runs [`.github/workflows/deploy-cloudflare.yml`](.github/workflows/deploy-cloudflare.yml):

1. Node.js **22**
2. `npm ci` (postinstall may run `scripts/cloudflare-build.js` in CI)
3. `npx prisma generate`
4. `npm run deploy` → `opennextjs-cloudflare build && opennextjs-cloudflare deploy`

**One-time setup** (repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**):

| Secret | How to obtain |
|--------|----------------|
| `CLOUDFLARE_API_TOKEN` | [Cloudflare dashboard](https://dash.cloudflare.com/profile/api-tokens) → **Create Token** → template **Edit Cloudflare Workers** (or custom token with **Account** → Workers Scripts **Edit** and **Account** → Workers KV/R2/etc. as needed for your account). Copy the token value once. |
| `CLOUDFLARE_ACCOUNT_ID` | Dashboard → any zone or **Workers & Pages** → right sidebar **Account ID** (32-character hex). |

Cloudflare **Workers & Pages → Git** and **Worker secrets** in the dashboard are separate from **GitHub Actions** secrets. Syncing or setting variables in Cloudflare does **not** create `CLOUDFLARE_API_TOKEN` in this GitHub repo — you must add the two rows in the table below under **GitHub** → **Settings** → **Secrets and variables** → **Actions** (names must match exactly, or use fallbacks `CF_API_TOKEN` / `WRANGLER_API_TOKEN` and `CF_ACCOUNT_ID` as documented in the workflow).

Do **not** commit token values. After both secrets exist, **`git push origin main` deploys production** — you do not need a separate manual `wrangler deploy` for routine releases.

Token must be allowed to deploy Worker **`clinovyr-site`** in the account that owns **clinovyr.com**.

### Verify the workflow ran

GitHub → **Actions** → **Deploy to Cloudflare** → latest run on your commit should be green. Then:

```bash
./scripts/post-deploy-smoke.sh
```

## Cloudflare dashboard (Git-connected build)

**Copy-paste Build/Deploy commands and Worker secrets:** see **[CLOUDFLARE-BUILD-SETTINGS.md](./CLOUDFLARE-BUILD-SETTINGS.md)**.

Use **Workers** → **`clinovyr-site`** → **Settings** → **Builds** with repo **Papaburgndy/clinovyr-site**, branch **`main`**.

### Required dashboard settings (summary)

| Setting | Value |
|--------|--------|
| **Build command** | `npx prisma generate && npx opennextjs-cloudflare build` |
| **Deploy command** | `npx opennextjs-cloudflare deploy` |
| **Root directory** | `/` |
| **Node.js version** | **22** or later |

**Do not** leave **Build command** empty with **`npx wrangler deploy`** — that was the failing configuration (no `.open-next/` before deploy). Postinstall (`scripts/cloudflare-build.js`) is only a fallback when CI env vars run after `npm ci`.

**Alternative:** empty build + **`npm run deploy`** (build and deploy in one step).

**Runtime secrets** (e.g. `DATABASE_URL`, `AUTH_SECRET`) go in **Variables and Secrets** on the Worker — not GitHub Actions secrets — for Cloudflare-native Git builds.

### Why `wrangler.jsonc` `[build].command` is not enough

`wrangler.jsonc` includes a build hook for local `wrangler deploy` only. Workers Builds with **`npx wrangler deploy`** uses OpenNext's wrapper and **skips** this hook. Set explicit dashboard commands per **CLOUDFLARE-BUILD-SETTINGS.md**.


## Client portal (clinovyr.com — main Worker)

The root Next.js app now includes **auth**, **client portal** (`/dashboard`, `/onboarding`, `/results`), **survey → Stripe checkout**, **deliverables**, and **admin** (`/admin`). Deploy on the **same** Cloudflare Worker as the marketing site (`clinovyr-site`).

### Database (PostgreSQL)

Prisma requires a reachable Postgres URL at **runtime** and for **migrations** (run outside the Worker):

| Step | Command | Where |
|------|---------|--------|
| Generate client | `npx prisma generate` | CI postinstall (`scripts/cloudflare-build.js`) or local |
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
| `ANTHROPIC_API_KEY` | Yes** | Deliverable generation (**required for paid deliverables) |
| `BLOB_READ_WRITE_TOKEN` | Yes*** | Deliverable file storage |
| `CALENDLY_URL` | No | Booking links |

***Blob storage:** Code uses `@vercel/blob` today. On Cloudflare, either keep Vercel Blob (token only — works from Workers) or migrate to **R2** + S3-compatible API (documented future change).

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

With **GitHub Actions** secrets configured (see above), this workflow deploys **`clinovyr-site`** automatically.

If you still use **Cloudflare Workers Builds** (dashboard Git integration), that path also rebuilds on push — prefer **one** deploy path to avoid duplicate or conflicting deploys. Recommended: **GitHub Actions only**; disable or disconnect dashboard Git deploy if Actions is active.

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
npm run deploy
```

This agent environment could not redeploy: no Cloudflare credentials, Wrangler requires Node 22 (local default was Node 20).

