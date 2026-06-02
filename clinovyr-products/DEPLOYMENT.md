# Clinovyr Products — Production Deployment

All Clinovyr apps deploy to **Cloudflare Workers** (Next.js via OpenNext) or a **long-running Node host** (Express ai-agent). The main marketing site at `clinovyr.com` is documented in [`../DEPLOY.md`](../DEPLOY.md).

Four product apps under `clinovyr-products/`:

| Project | Directory | Production URL | Health endpoint | Host |
|---------|-----------|----------------|-----------------|------|
| Assessment | `assessment/` | https://assessment.clinovyr.com | `/api/health` | Cloudflare Workers (OpenNext) |
| AI Agent | `ai-agent/` | https://agent.clinovyr.com | `/api/health` | Railway or Fly.io (Express) |
| Dashboard | `dashboard/` | https://app.clinovyr.com | `/api/health` | Cloudflare Workers (OpenNext) |
| Playbooks | `playbooks/` | https://buy.clinovyr.com | `/api/health` | Cloudflare Workers (OpenNext) |

## Health checks

Each app exposes `GET /api/health` returning:

```json
{
  "status": "ok" | "degraded" | "error",
  "checks": {
    "filesystem": true,
    "env": { "ANTHROPIC_API_KEY": true, "RESEND_API_KEY": false },
    "anthropicKeyFormat": true
  }
}
```

- **200** — `ok` or `degraded` (non-critical issues, e.g. optional Anthropic key missing)
- **503** — `error` (missing required env vars or unwritable data directory)

### Monitor all services

From `clinovyr-products/`:

```bash
# Production subdomains
npx tsx health-check.ts

# Local dev (default ports: assessment 3001, agent 3100, dashboard 3002, playbooks 3003)
npx tsx health-check.ts --local
```

Start local servers on those ports, e.g. `next dev -p 3001` in each Next.js app.

---

## Cloudflare Workers (Next.js apps)

Deploy **assessment**, **dashboard**, and **playbooks** as separate Cloudflare Workers using [@opennextjs/cloudflare](https://opennext.js.org/cloudflare/get-started), following the same pattern as the main site in [`../DEPLOY.md`](../DEPLOY.md).

### Per-app setup

Create **three separate Workers** in the Cloudflare dashboard, each with Git integration and a different **Root Directory**:

| Worker name | Root Directory | Custom domain |
|-------------|----------------|---------------|
| clinovyr-assessment | `clinovyr-products/assessment` | `assessment.clinovyr.com` |
| clinovyr-dashboard | `clinovyr-products/dashboard` | `app.clinovyr.com` |
| clinovyr-playbooks | `clinovyr-products/playbooks` | `buy.clinovyr.com` |

Each Next.js app needs (in its directory):

1. `@opennextjs/cloudflare` and `wrangler` as dev dependencies
2. `open-next.config.ts` with `defineCloudflareConfig()`
3. `wrangler.jsonc` pointing at `.open-next/worker.js` and `.open-next/assets`
4. `next.config.ts` calling `initOpenNextCloudflareForDev()` for local dev
5. Deploy scripts in `package.json`:

```json
{
  "scripts": {
    "build:cloudflare": "opennextjs-cloudflare build",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
  }
}
```

### Cloudflare dashboard settings (each Next.js Worker)

| Setting | Value |
|--------|--------|
| **Deploy command** | `npm run deploy` |
| **Root directory** | See table above |
| **Node.js version** | **22** or later |

Set environment variables as **Worker secrets** (or encrypted env vars) in the Cloudflare dashboard. See each project's `.env.example`.

Add DNS records in Cloudflare for each custom subdomain (proxied orange-cloud CNAME to the Worker route).

---

## AI Agent (Express — Railway or Fly.io)

The ai-agent is a **long-running Express server** (`src/server.ts`), not Next.js. It is **not** a good fit for Cloudflare Workers without a full rewrite. Deploy to a container or Node host instead.

**Recommended:** [Railway](https://railway.app) or [Fly.io](https://fly.io) for `agent.clinovyr.com`.

### Railway (example)

1. Create a new project → **Deploy from GitHub repo**.
2. Set **Root Directory** to `clinovyr-products/ai-agent`.
3. **Build command:** `npm run build`
4. **Start command:** `npm start`
5. Add custom domain `agent.clinovyr.com` (Railway provides a CNAME target).
6. Set environment variables from `.env.example` in the Railway dashboard.

### Fly.io (example)

1. From `clinovyr-products/ai-agent`, run `fly launch` (Node app, port 3100).
2. Set `PORT=3100` and other env vars via `fly secrets set`.
3. Map `agent.clinovyr.com` with `fly certs add agent.clinovyr.com`.

### Production notes

- Use **Upstash Redis** (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) for session memory and rate limits — in-memory Redis does not persist across restarts.
- Set `ESCALATION_QUEUE_PATH` to a persistent volume path if using Railway/Fly volumes, or keep the default `data/escalation-queue.json` on attached storage.
- Health check URL for uptime monitoring: `https://agent.clinovyr.com/api/health`

See [`ai-agent/README.md`](ai-agent/README.md) for local development.

---

## Environment variables

### Local development — single `.env.local` at repo root

All API keys and secrets for local development live in **one file**:

```
/Clinoyr/.env.local
```

Do not maintain separate `.env.local` files per product. The QA harness (`clinovyr-products/qa/`) loads only this root file.

Next.js apps load `.env.local` from their own directory by default. For local dev, symlink the root file into each app you are running:

```bash
# From a product directory, e.g. clinovyr-products/assessment/
ln -sf ../../.env.local .env.local
```

CLI tools (workshop-generator, playbooks scripts, CRM automation) also fall back to the repo root when no local `.env.local` exists — prefer the symlink above so every process reads the same file.

**Resend delivery (local / QA):** Until `clinovyr.com` is verified in Resend, keep sandbox mode on:

| Variable | Value for QA |
|----------|----------------|
| `CONTACT_EMAIL` | `clinovyr@gmail.com` (company inbox; internal notifications are sent **to** this address) |
| `RESEND_FROM_EMAIL` | `Clinovyr <onboarding@resend.dev>` (Resend sandbox sender — do not use `@clinovyr.com` addresses) |
| `RESEND_SANDBOX` | `true` (forces sandbox From and skips client confirmations to non-owner addresses) |
| `QA_TEST_EMAIL` | Optional; defaults to `CONTACT_EMAIL` for phase1 assessment fixtures |

In sandbox, Resend only delivers to the account-owner Gmail. All QA test recipients must use `clinovyr@gmail.com`. Assessment submit still succeeds if email fails; check `emailSent` / `emailWarning` in the API response.

**Production:** After domain verification, set `RESEND_FROM_EMAIL` to your verified address (e.g. `Clinovyr <reports@clinovyr.com>`) and unset or set `RESEND_SANDBOX=false`.

### Production

Set these in the **Cloudflare Worker secrets** (Next.js apps) or **Railway/Fly env** (ai-agent). See each project's `.env.example`.

### assessment

| Variable | Required | Notes |
|----------|----------|-------|
| `ANTHROPIC_API_KEY` | Yes | Must start with `sk-ant-` |
| `RESEND_API_KEY` | Yes | Report delivery |
| `CONTACT_EMAIL` | No | Company inbox; defaults to clinovyr@gmail.com. Internal notification emails (assessment submissions, contact form) are sent **to** this address via Resend — not hello@clinovyr.com. |
| `SITE_URL` | No | Canonical URL for links |

### ai-agent

| Variable | Required | Notes |
|----------|----------|-------|
| `RESEND_API_KEY` | Yes | Escalation emails |
| `UPSTASH_REDIS_REST_URL` | Recommended | Session memory + rate limits |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended | Pair with URL above |
| `REDIS_URL` | Alt | Local/dev only |
| `ESCALATION_QUEUE_PATH` | No | Defaults to `data/escalation-queue.json` |
| `ANTHROPIC_API_KEY` | No | Optional; agent is rule-based today |
| `PORT` | No | Defaults to `3100` |

### dashboard

| Variable | Required | Notes |
|----------|----------|-------|
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `ADMIN_EMAIL` | Yes | Admin login allowlist |
| `CRON_SECRET` | Yes | Bearer token for monthly-reports cron |
| `RESEND_API_KEY` | Yes (prod) | Magic-link auth |
| `EMAIL_FROM` | No | Sender address |
| `ANTHROPIC_API_KEY` | No | Monthly reports stub without key |
| `NEXTAUTH_URL` | Yes | `https://app.clinovyr.com` |

**Cron (monthly reports):** Schedule `GET /api/cron/monthly-reports` on `0 17 1 * *` (09:00 PT on the 1st). The route requires `Authorization: Bearer $CRON_SECRET`.

Options for triggering the cron:

1. **Cloudflare Workers Cron Trigger** — add a `[triggers]` cron schedule in `wrangler.jsonc` and a small Worker route (or scheduled handler) that `fetch`es the dashboard URL with the Bearer header.
2. **External cron** — UptimeRobot, cron-job.org, or GitHub Actions on a schedule:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://app.clinovyr.com/api/cron/monthly-reports
```

3. **Manual / local** — `npm run cron:monthly-reports` from the dashboard directory.

**Filesystem:** Client data lives under `data/clients/`. Cloudflare Workers have an ephemeral filesystem — plan for R2, S3, or D1 for persistent client JSON in production.

### playbooks

| Variable | Required | Notes |
|----------|----------|-------|
| `STRIPE_SECRET_KEY` | Yes | Checkout |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Client-side Stripe |
| `RESEND_API_KEY` | Yes | Purchase emails |
| `ANTHROPIC_API_KEY` | Yes | Playbook generation |
| `SITE_URL` | Yes | `https://buy.clinovyr.com` |
| `RESEND_FROM_EMAIL` | No | Sandbox default: `onboarding@resend.dev` |
| `RESEND_SANDBOX` | No | `true` for local QA until domain verified |

Configure Stripe webhook endpoint: `https://buy.clinovyr.com/api/playbook-webhook`

---

## UptimeRobot (manual)

Set up monitors at [uptimerobot.com](https://uptimerobot.com):

1. Create an account / log in.
2. **Add New Monitor** for each service:

| Friendly name | URL | Type |
|---------------|-----|------|
| Clinovyr Assessment | `https://assessment.clinovyr.com/api/health` | HTTP(s) |
| Clinovyr AI Agent | `https://agent.clinovyr.com/api/health` | HTTP(s) |
| Clinovyr Dashboard | `https://app.clinovyr.com/api/health` | HTTP(s) |
| Clinovyr Playbooks | `https://buy.clinovyr.com/api/health` | HTTP(s) |

3. **Monitoring interval:** 5 minutes (free tier).
4. **Alert contacts:** Add email/SMS/Slack for downtime alerts.
5. Optional: set **Keyword monitoring** to expect `"status":"ok"` in the response body for stricter checks (will alert on `degraded` too).

---

## Build verification

```bash
cd clinovyr-products/assessment && npm run build
cd clinovyr-products/dashboard && npm run build
cd clinovyr-products/playbooks && npm run build
cd clinovyr-products/ai-agent && npm run build
```

---

## Deployment status

| Step | Status |
|------|--------|
| Health routes added | Done in repo |
| `health-check.ts` script | Done |
| Dashboard cron route (`/api/cron/monthly-reports`) | Done — schedule via Cloudflare cron or external trigger |
| `DEPLOYMENT.md` | This file |
| Cloudflare OpenNext config per Next.js app | Add per-app `wrangler.jsonc` + OpenNext deps when deploying |
| AI Agent host (Railway/Fly) | Manual setup — see above |

After DNS and env vars are configured, run `npx tsx health-check.ts` to verify all four endpoints return `ok`.
