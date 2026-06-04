# Deploying Clinovyr to Cloudflare Workers

This site uses [@opennextjs/cloudflare](https://opennext.js.org/cloudflare/get-started) so the Worker serves the OpenNext build output (`.open-next/`), not the repo root. **Do not** set `assets.directory` to `.` — that uploads `node_modules` and fails deploy.

## Cloudflare dashboard (Git-connected build)

Use **Workers** → your Worker → **Settings** → **Builds** with a connected repository.

### Automatic CI build (postinstall fallback)

If the dashboard deploy command is still `npx wrangler deploy`, deploy can succeed **without changing the dashboard**. After `npm ci`, the `postinstall` script runs `opennextjs-cloudflare build` when Cloudflare injects `CI=true` or `WORKERS_CI=1` (Workers Builds default env vars).

Flow with default dashboard settings:

1. `npm ci` → postinstall builds `.open-next/`
2. `npx wrangler deploy` → OpenNext deploy finds compiled config

**Recommended:** still set deploy command to `npm run deploy` so the build runs explicitly at deploy time (redundant but clearer). The postinstall hook is a safety net for dashboards that were never updated.

### Required dashboard settings

| Setting | Value |
|--------|--------|
| **Build command** | *(leave empty)* — build runs via postinstall (CI) or `npm run deploy` |
| **Deploy command** | `npm run deploy` *(recommended)* or `npx wrangler deploy` *(works via postinstall)* |
| **Root directory** | `/` (repository root) |
| **Node.js version** | **22** or later (Wrangler 4 requires Node ≥ 22) |

**Avoid `npx wrangler deploy` without postinstall** on older commits. When Wrangler detects an OpenNext project it redirects to `opennextjs-cloudflare deploy`, which **does not** run the `[build].command` in `wrangler.jsonc`. Without a prior build that produces:

```
ERROR Could not find compiled Open Next config, did you run the build command?
```

The `deploy` script in `package.json` always builds before deploy:

```json
"deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
```

### Alternative: separate build and deploy steps

If you prefer Cloudflare to run build and deploy as distinct phases:

| Setting | Value |
|--------|--------|
| **Build command** | `npm run build:cloudflare` |
| **Deploy command** | `npx opennextjs-cloudflare deploy` |

Still **do not** use `npx wrangler deploy` — use the OpenNext CLI for deploy so Wrangler does not hijack the command.

Cloudflare runs `npm ci` automatically before the build/deploy steps.

### Why `wrangler.jsonc` `[build].command` is not enough

`wrangler.jsonc` includes a build hook for direct local `wrangler deploy`:

```jsonc
"build": {
  "command": "npx opennextjs-cloudflare build"
}
```

That hook runs only when Wrangler itself executes deploy. Workers Builds with deploy command `npx wrangler deploy` triggers OpenNext's wrapper instead, which skips this hook. The repo `postinstall` script (`scripts/cloudflare-build.js`) builds in CI as a fallback; prefer `npm run deploy` in the dashboard when you can change it.


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

Cloudflare rebuilds on push when Git integration is enabled.
