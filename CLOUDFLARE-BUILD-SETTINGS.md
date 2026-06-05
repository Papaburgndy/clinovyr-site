# Cloudflare Workers Builds — copy-paste settings

Clinovyr uses **two** Workers. If you deploy via **Cloudflare Git Builds** (not GitHub Actions), configure **both** in the dashboard. Deploy **`clinovyr-deliverables` before `clinovyr-site`** so the service binding target exists.

Pick **one** deploy path — see [DEPLOY.md](./DEPLOY.md#choose-one-deploy-path-required). Do not leave GitHub Actions and dashboard Git Builds both active on `main`.

---

## Worker `clinovyr-deliverables` (deploy first)

**Workers & Pages** → Worker **`clinovyr-deliverables`** → **Settings** → **Builds** (same repo **Papaburgndy/clinovyr-site**, branch **`main`**).

No OpenNext build — plain Wrangler TypeScript Worker (`workers/deliverables/`).

| Setting | Value |
|--------|--------|
| **Build command** | `npx prisma generate` |
| **Deploy command** | `npx wrangler deploy -c workers/deliverables/wrangler.jsonc` |
| **Root directory** | `/` |
| **Node.js version** | **22** (or later) |

Alternative deploy command: `npm run deploy:deliverables`.

### Variables and secrets (`clinovyr-deliverables`)

**Workers & Pages** → **`clinovyr-deliverables`** → **Settings** → **Variables and Secrets**

| Secret / variable | Required | Notes |
|-------------------|----------|--------|
| `DATABASE_URL` | Yes | Same production Postgres as main Worker |
| `ANTHROPIC_API_KEY` | Yes | Claude calls in generators |
| `BLOB_READ_WRITE_TOKEN` | Yes | PDF/ZIP upload |
| `INTERNAL_DELIVERABLES_SECRET` | Recommended | **Same value** as on `clinovyr-site` (`openssl rand -base64 32`) |
| `RESEND_API_KEY` | Yes | Delivery email after generation |
| `RESEND_FROM_EMAIL` | Prod | Verified sender |
| `NEXTAUTH_URL` or `SITE_URL` | Yes | Portal links in delivery email (`https://clinovyr.com`) |
| `RESEND_SANDBOX` | No | `true` for QA only |
| `CALENDLY_URL` | No | Booking link in email |

Health check after deploy: `curl` the Worker's `*.workers.dev` URL + `/health` → `{"ok":true,"service":"clinovyr-deliverables"}`.

---

## Worker `clinovyr-site` (deploy second)

Use **Workers & Pages** → Worker **`clinovyr-site`** → **Settings** → **Builds** (Git repo **Papaburgndy/clinovyr-site**, branch **`main`**).

Cloudflare runs **`npm ci`** automatically before your build and deploy commands. You do **not** need `npm ci` in the Build command.

## Why the build failed (Build command: None)

| Dashboard value | What happened |
|-----------------|---------------|
| **Build command: None** | Only `npm ci` ran; OpenNext output (`.open-next/`) was expected from **`postinstall`** (`scripts/ci-opennext-build.js`). |
| **Deploy command: `npx wrangler deploy`** | Wrangler delegates to **`opennextjs-cloudflare deploy`**, which **does not** run `wrangler.jsonc` `[build].command` and **does not** build if `.open-next/` is missing → *"Could not find compiled Open Next config"*. |

**Fix:** Set an explicit **Build command** below (or use **Option B** so deploy runs the build).

Do **not** rely on **Build command: None** unless every commit includes the postinstall CI hook and you accept that a failed or skipped postinstall breaks deploy.

---

## Option A — separate build and deploy (recommended)

Paste exactly:

| Setting | Value |
|--------|--------|
| **Build command** | `npx prisma generate && npx opennextjs-cloudflare build` |
| **Deploy command** | `npx opennextjs-cloudflare deploy` |
| **Root directory** | `/` |
| **Node.js version** | **22** (or later) |

Matches [OpenNext Workers Builds docs](https://opennext.js.org/cloudflare/howtos/dev-deploy#workers-builds), plus Prisma client generation for this app.

---

## Option B — single deploy step (build + deploy)

Paste exactly:

| Setting | Value |
|--------|--------|
| **Build command** | *(leave empty)* |
| **Deploy command** | `npm run deploy` |
| **Root directory** | `/` |
| **Node.js version** | **22** (or later) |

`npm run deploy` runs `opennextjs-cloudflare build && opennextjs-cloudflare deploy` (see `package.json`). Prefer **Option A** if you want a visible build phase in the dashboard logs.

---

## Option C — postinstall build + deploy deliverables first (fixes DELIVERABLES binding) **← use this**

Use when **`clinovyr-site`** Git Builds fails with *Service binding `DELIVERABLES` references Worker `clinovyr-deliverables` which was not found* because only the main Worker deploys.

**Root cause:** In an OpenNext repo, `npx wrangler deploy` is redirected to `opennextjs-cloudflare deploy` (clinovyr-site). A nested `wrangler deploy -c workers/deliverables/wrangler.jsonc` during the custom build phase still deploys **clinovyr-site**, not deliverables — so the binding target is never created.

`npm ci` runs **`postinstall`** → `scripts/ci-opennext-build.js` (OpenNext build when `CI=true` or `WORKERS_CI=1`). **`scripts/cloudflare-deploy.js`** deploys **deliverables first** (`OPEN_NEXT_DEPLOY=true` bypasses OpenNext hijack), then main.

Paste exactly on **`clinovyr-site`** only (you can disconnect Git Builds on **`clinovyr-deliverables`** if this option is active):

| Setting | Value |
|--------|--------|
| **Build command** | *(leave empty)* |
| **Deploy command** | `node scripts/cloudflare-deploy.js` |
| **Root directory** | `/` |
| **Node.js version** | **22** (or later) |

Alternative deploy command: `npm run deploy:cloudflare-ci`.

Build logs should show `[cloudflare-deploy] Deploying clinovyr-deliverables` then a `*.workers.dev` URL, then `[cloudflare-deploy] Deploying clinovyr-site`.

Local dry-run (after `npm run build:cloudflare`): `node scripts/cloudflare-deploy.js --dry-run`.

---

## Option D — `npx wrangler deploy` (do not use for dual-worker deploy)

**Broken for deliverables:** `wrangler.jsonc` `[build].command` cannot deploy `clinovyr-deliverables` because any `wrangler deploy` from this repo without `OPEN_NEXT_DEPLOY=true` runs `opennextjs-cloudflare deploy` and publishes **clinovyr-site** instead.

If your dashboard still has:

| Setting | Value |
|--------|--------|
| **Build command** | *(leave empty)* |
| **Deploy command** | `npx wrangler deploy` |

Change the **Deploy command** to **`node scripts/cloudflare-deploy.js`** (Option C above).

`wrangler.jsonc` `[build].command` → `node scripts/cloudflare-build.js` only compiles OpenNext (Prisma + build). Deliverables deploy belongs in the deploy phase.

---

## Do not use

| Setting | Why |
|--------|-----|
| **`npx wrangler deploy`** on dual-worker OpenNext site | OpenNext hijacks deploy; nested deliverables deploy in build phase still publishes clinovyr-site → DELIVERABLES binding error. Use **Option C**. |
| **Build command: None** + **`npx wrangler deploy`** | Postinstall builds OpenNext, but deliverables Worker is not created. Use deploy command **`node scripts/cloudflare-deploy.js`**. |
| **`npm run build`** alone | That is `next build` only — does **not** produce `.open-next/` for the Worker. |

---

## Variables and secrets — `clinovyr-site` (runtime, not GitHub)

For **Cloudflare-native Git builds**, configure main-site secrets in the dashboard:

**Workers & Pages** → **`clinovyr-site`** → **Settings** → **Variables and Secrets**

Do **not** depend on **GitHub Actions** repository secrets for this path. GitHub secrets are only for [`.github/workflows/deploy-cloudflare.yml`](.github/workflows/deploy-cloudflare.yml) if you use that workflow instead.

### Required at runtime (production)

| Secret / variable | Notes |
|-------------------|--------|
| `DATABASE_URL` | Production Postgres (Neon, Supabase, etc.) |
| `AUTH_SECRET` or `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://clinovyr.com` |
| `SITE_URL` | `https://clinovyr.com` |
| `STRIPE_SECRET_KEY` | Live or test per environment |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook endpoint |
| `RESEND_API_KEY` | Transactional email |
| `CONTACT_EMAIL` | e.g. `clinovyr@gmail.com` |
| `ADMIN_EMAIL` | Admin allowlist |
| `INTERNAL_DELIVERABLES_SECRET` | Recommended — same value on **`clinovyr-deliverables`**; main Worker sends `X-Clinovyr-Internal-Secret` |

### Optional / recommended

| Secret / variable | Notes |
|-------------------|--------|
| `RESEND_FROM_EMAIL` | Verified sender |
| `STRIPE_PRICE_AUDIT` | Override catalog price IDs |
| `STRIPE_PRICE_ASSESSMENT` | |
| `STRIPE_PRICE_SPRINT` | |
| `CALENDLY_URL` | Booking links |
| `RESEND_SANDBOX` | `true` for QA only |

### Build-time `DATABASE_URL`

You do **not** need a real database URL in **Variables and Secrets** for the build step if you use **Option A**: the app uses a build placeholder when `CI=true` during `next build` (see `src/lib/prisma.ts`). `scripts/ci-opennext-build.js` also sets a placeholder during postinstall CI builds.

If OpenNext/Prisma still fail without secrets, add a **non-secret** build variable (not production DB):

| Build variable (optional) | Value |
|---------------------------|--------|
| `DATABASE_URL` | `postgresql://build:build@localhost:5432/build` |

Runtime **`DATABASE_URL`** must still be set as a **secret** with your real connection string.

### Migrations

Run **`npx prisma migrate deploy`** against production Postgres from your machine or a one-off job — not inside the Worker on each deploy.

---

## Quick reference (copy one block)

**Recommended dashboard strings:**

```
Build command:  npx prisma generate && npx opennextjs-cloudflare build
Deploy command: npx opennextjs-cloudflare deploy
```

**Alternative (one step):**

```
Build command:  (empty)
Deploy command: npm run deploy
```

**Option C — postinstall + dual deploy (fixes DELIVERABLES binding):**

```
Build command:  (empty)
Deploy command: node scripts/cloudflare-deploy.js
```

**Option C — dual deploy (fixes DELIVERABLES binding) — required for clinovyr-site Git Builds:**

```
Build command:  (empty)
Deploy command: node scripts/cloudflare-deploy.js
```

**Deliverables Worker (deploy first, if using separate Git Builds):**

```
Build command:  npx prisma generate
Deploy command: npx wrangler deploy -c workers/deliverables/wrangler.jsonc
```

See also [DEPLOY.md](./DEPLOY.md) for GitHub Actions deploy and local verification.
