# Clinovyr production deployment checklist

Main site + client portal: **Cloudflare Workers** (OpenNext). See [DEPLOY.md](./DEPLOY.md). Product sub-apps: [clinovyr-products/DEPLOYMENT.md](./clinovyr-products/DEPLOYMENT.md).

## Pre-deploy (repo)

- [ ] `npm run db:generate` succeeds locally
- [ ] `npx prisma migrate deploy` run against production `DATABASE_URL` (one-off or CI)
- [ ] `npm run build` succeeds (main site only; `clinovyr-products` excluded in tsconfig)
- [ ] No `.env.local`, `data/`, or assessment deliverables committed
- [ ] `git push origin main` triggers Cloudflare Workers Builds (`npm run deploy` recommended)

## Cloudflare dashboard

- [ ] Worker `clinovyr-site` — root `/`, Node 22+
- [ ] Deploy command: `npm run deploy` (or `npx wrangler deploy` with postinstall build)
- [ ] All secrets from `.env.local.example` set (see DEPLOY.md portal table)
- [ ] `NEXTAUTH_URL` and `SITE_URL` = `https://clinovyr.com`

## Stripe

- [ ] Live mode keys in Worker secrets
- [ ] Webhook endpoint: `https://clinovyr.com/api/webhooks/stripe`
- [ ] Signing secret in `STRIPE_WEBHOOK_SECRET`
- [ ] Price IDs for audit / assessment / sprint products

## Resend

- [ ] Domain `clinovyr.com` verified (production)
- [ ] `RESEND_SANDBOX` unset or `false`
- [ ] `RESEND_FROM_EMAIL` uses verified domain

## Blob / files

- [ ] `BLOB_READ_WRITE_TOKEN` set (Vercel Blob) **or** R2 migration completed

## Post-deploy smoke tests

After steps 1–5 (build, secrets, migrate, Stripe webhook, manual checks), run:

```bash
chmod +x scripts/post-deploy-smoke.sh
./scripts/post-deploy-smoke.sh
# Staging: BASE_URL=https://your-preview.workers.dev ./scripts/post-deploy-smoke.sh
```

Automated checks (replace host if staging):

| Check | Command / URL | Pass criteria |
|-------|----------------|---------------|
| Home | `curl -sI https://clinovyr.com/` | HTTP 200 |
| Register | `curl -sI https://clinovyr.com/auth/register` | HTTP 200 |
| Health | `curl -s https://clinovyr.com/api/health` | `{"status":"ok","app":"clinovyr-portal"}` |
| Admin | `curl -sI https://clinovyr.com/admin` | 302/307 to login (not 500) |
| Dashboard | `curl -sI https://clinovyr.com/dashboard` | 302/307 to login (not 404) |
| Stripe webhook route | `curl -sI -X POST https://clinovyr.com/api/webhooks/stripe` | 400/401 without signature (not 404) |

**Manual (browser + live keys):**

- [ ] Register → survey → checkout session created
- [ ] Stripe test/live payment → webhook → order `paid` → deliverables job
- [ ] Admin login (`ADMIN_EMAIL`) → client list loads
- [ ] Download deliverable from portal

Record results in ops manual or this file with date.

## Uptime

- [ ] Optional: UptimeRobot on marketing `/` and product health URLs (see clinovyr-products/DEPLOYMENT.md)
