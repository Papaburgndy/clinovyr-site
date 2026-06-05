# Clinovyr production deployment checklist

Main site + client portal: **Cloudflare Workers** (OpenNext). See [DEPLOY.md](./DEPLOY.md). Product sub-apps: [clinovyr-products/DEPLOYMENT.md](./clinovyr-products/DEPLOYMENT.md).

## Pre-deploy (repo)

- [ ] `npm run db:generate` succeeds locally
- [ ] `npx prisma migrate deploy` run against production `DATABASE_URL` (one-off or CI)
- [ ] `npm run build` succeeds (main site only; `clinovyr-products` excluded in tsconfig)
- [ ] No `.env.local`, `data/`, or assessment deliverables committed
- [ ] Deploy path chosen: **GitHub Actions** *or* **Cloudflare Git Builds** — not both ([DEPLOY.md](./DEPLOY.md#choose-one-deploy-path-required))
- [ ] `git push origin main` triggers **one** deploy path only

## Cloudflare dashboard

### Worker `clinovyr-deliverables` (deploy first)

- [ ] Builds: build `npx prisma generate`, deploy `npx wrangler deploy -c workers/deliverables/wrangler.jsonc` (or `npm run deploy:deliverables`)
- [ ] Secrets: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXTAUTH_URL` or `SITE_URL`
- [ ] `INTERNAL_DELIVERABLES_SECRET` set (recommended; generate with `openssl rand -base64 32`)

### Worker `clinovyr-site` (deploy second)

- [ ] Builds: root `/`, Node 22+, build `npx prisma generate && npx opennextjs-cloudflare build`, deploy `npx opennextjs-cloudflare deploy` (see [CLOUDFLARE-BUILD-SETTINGS.md](./CLOUDFLARE-BUILD-SETTINGS.md))
- [ ] Main-site secrets from `.env.local.example` / DEPLOY.md portal table
- [ ] `INTERNAL_DELIVERABLES_SECRET` — **same value** as on `clinovyr-deliverables`
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

- [ ] `BLOB_READ_WRITE_TOKEN` set on **`clinovyr-deliverables`** (Vercel Blob) **or** R2 migration completed

## GitHub Actions (if that path)

- [ ] Repository secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- [ ] Cloudflare Git Builds **disabled** on both Workers (avoid double deploy)

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
