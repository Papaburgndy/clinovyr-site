# Deploying Clinovyr to Cloudflare Workers

This site uses [@opennextjs/cloudflare](https://opennext.js.org/cloudflare/get-started) so the Worker serves the OpenNext build output (`.open-next/`), not the repo root. **Do not** set `assets.directory` to `.` — that uploads `node_modules` and fails deploy.

## Cloudflare dashboard (Git-connected build)

Use **Workers** (or Workers Builds) with a connected repository.

| Setting | Value |
|--------|--------|
| **Build command** | `npm ci && npx opennextjs-cloudflare build` |
| **Deploy command** | `npx wrangler deploy` |
| **Root directory** | `/` (repository root) |
| **Node.js version** | **22** or later (Wrangler 4 requires Node ≥ 22) |

Alternative single-step local/CI deploy:

```bash
npm run deploy
```

That runs `opennextjs-cloudflare build` (which invokes `next build`) then deploys via Wrangler.

## Environment variables / secrets

Set these as **Worker secrets** (or encrypted env vars) in the Cloudflare dashboard for production:

| Variable | Required | Purpose |
|----------|----------|---------|
| `RESEND_API_KEY` | Yes | Resend API for `/api/contact` |
| `CONTACT_EMAIL` | Yes | Inbox for form submissions |
| `RESEND_FROM_EMAIL` | No | Custom From address (defaults in code) |

For local preview with bindings, copy `.dev.vars.example` to `.dev.vars` and fill in values (`.dev.vars` is gitignored).

## Verify locally

```bash
npm run build:cloudflare
# optional: Workers runtime preview
npm run preview
```

## Push

```bash
git push origin main
```

Cloudflare rebuilds on push when Git integration is enabled.
