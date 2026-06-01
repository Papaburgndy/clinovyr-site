# Clinovyr Products — Production Deployment

Four separate Vercel projects under `clinovyr-products/`:

| Project | Directory | Production URL | Health endpoint |
|---------|-----------|----------------|-----------------|
| Assessment | `assessment/` | https://assessment.clinovyr.com | `/api/health` |
| AI Agent | `ai-agent/` | https://agent.clinovyr.com | `/api/health` |
| Dashboard | `dashboard/` | https://app.clinovyr.com | `/api/health` |
| Playbooks | `playbooks/` | https://buy.clinovyr.com | `/api/health` |

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

## Vercel project setup (manual)

Create **four separate Vercel projects**, each linked to this repo with a different **Root Directory**:

1. **clinovyr-assessment** → Root Directory: `clinovyr-products/assessment`
2. **clinovyr-ai-agent** → Root Directory: `clinovyr-products/ai-agent`
3. **clinovyr-dashboard** → Root Directory: `clinovyr-products/dashboard`
4. **clinovyr-playbooks** → Root Directory: `clinovyr-products/playbooks`

### Custom domains (Vercel dashboard → Settings → Domains)

| Vercel project | Domain |
|----------------|--------|
| assessment | `assessment.clinovyr.com` |
| ai-agent | `agent.clinovyr.com` |
| dashboard | `app.clinovyr.com` |
| playbooks | `buy.clinovyr.com` |

Add DNS CNAME records pointing each subdomain to Vercel (`cname.vercel-dns.com` or the value Vercel provides).

### Deploy via CLI

Install and log in first:

```bash
npm i -g vercel
vercel login
```

Deploy each project from its directory:

```bash
cd clinovyr-products/assessment && vercel --prod
cd clinovyr-products/ai-agent && vercel --prod
cd clinovyr-products/dashboard && vercel --prod
cd clinovyr-products/playbooks && vercel --prod
```

On first deploy, link each directory to its Vercel project when prompted.

---

## Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (Production). See each project's `.env.example`.

### assessment

| Variable | Required | Notes |
|----------|----------|-------|
| `ANTHROPIC_API_KEY` | Yes | Must start with `sk-ant-` |
| `RESEND_API_KEY` | Yes | Report delivery |
| `CONTACT_EMAIL` | No | Defaults to hello@clinovyr.com |
| `SITE_URL` | No | Canonical URL for links |

### ai-agent

| Variable | Required | Notes |
|----------|----------|-------|
| `RESEND_API_KEY` | Yes | Escalation emails |
| `UPSTASH_REDIS_REST_URL` | Recommended | Session memory + rate limits |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended | Pair with URL above |
| `REDIS_URL` | Alt | Local/dev; Upstash preferred on Vercel |
| `ESCALATION_QUEUE_PATH` | No | Defaults to `data/escalation-queue.json` |
| `ANTHROPIC_API_KEY` | No | Optional; agent is rule-based today |

**Vercel note:** Express deploys via `api/index.ts` (see `vercel.json`). Use **Upstash Redis** in production — in-memory Redis does not persist across serverless invocations. The filesystem check may report `degraded` on Vercel because `/data` is not writable; set `ESCALATION_QUEUE_PATH=/tmp/escalation-queue.json` or use external queue storage.

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

**Cron:** `vercel.json` runs `/api/cron/monthly-reports` on `0 17 1 * *` (09:00 PT on the 1st). Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when `CRON_SECRET` is set.

**Filesystem:** Client data lives under `data/clients/`. Vercel serverless has an ephemeral filesystem — plan for Vercel Blob, S3, or similar for persistent client JSON in production.

### playbooks

| Variable | Required | Notes |
|----------|----------|-------|
| `STRIPE_SECRET_KEY` | Yes | Checkout |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Client-side Stripe |
| `RESEND_API_KEY` | Yes | Purchase emails |
| `ANTHROPIC_API_KEY` | Yes | Playbook generation |
| `SITE_URL` | Yes | `https://buy.clinovyr.com` |
| `RESEND_FROM_EMAIL` | No | Defaults to Clinovyr hello@ |

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
| Dashboard cron in `vercel.json` | Verified (`0 17 1 * *`, CRON_SECRET on route) |
| `DEPLOYMENT.md` | This file |
| Vercel CLI deploy | Requires `vercel login` — run manual steps above |

After DNS and env vars are configured, run `npx tsx health-check.ts` to verify all four endpoints return `ok`.
