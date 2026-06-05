# Cloudflare Workers Builds — copy-paste settings

Use **Workers & Pages** → Worker **`clinovyr-site`** → **Settings** → **Builds** (Git repo **Papaburgndy/clinovyr-site**, branch **`main`**).

Cloudflare runs **`npm ci`** automatically before your build and deploy commands. You do **not** need `npm ci` in the Build command.

## Why the build failed (Build command: None)

| Dashboard value | What happened |
|-----------------|---------------|
| **Build command: None** | Only `npm ci` ran; OpenNext output (`.open-next/`) was expected from **`postinstall`** (`scripts/cloudflare-build.js`). |
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

## Do not use

| Setting | Why |
|--------|-----|
| **Build command: None** + **`npx wrangler deploy`** | Deploy runs without a guaranteed OpenNext build (your failed setup). |
| **`npx wrangler deploy`** as deploy command | OpenNext hijacks the command and skips `wrangler.jsonc` `[build].command`. |
| **`npm run build`** alone | That is `next build` only — does **not** produce `.open-next/` for the Worker. |

---

## Variables and secrets (runtime — Worker, not GitHub)

For **Cloudflare-native Git builds**, configure secrets in the dashboard:

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
| `ANTHROPIC_API_KEY` | Deliverable generation |
| `BLOB_READ_WRITE_TOKEN` | Deliverable storage |

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

You do **not** need a real database URL in **Variables and Secrets** for the build step if you use **Option A**: the app uses a build placeholder when `CI=true` during `next build` (see `src/lib/prisma.ts`). `scripts/cloudflare-build.js` also sets a placeholder during postinstall CI builds.

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

See also [DEPLOY.md](./DEPLOY.md) for GitHub Actions deploy and local verification.
