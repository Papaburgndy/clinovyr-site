# Deploying Clinovyr to Cloudflare Workers

This site uses [@opennextjs/cloudflare](https://opennext.js.org/cloudflare/get-started) so the Worker serves the OpenNext build output (`.open-next/`), not the repo root. **Do not** set `assets.directory` to `.` — that uploads `node_modules` and fails deploy.

## Cloudflare dashboard (Git-connected build)

Use **Workers** (or Workers Builds) with a connected repository.

| Setting | Value |
|--------|--------|
| **Build command** | *(leave empty)* — `wrangler.jsonc` runs OpenNext via `[build].command` |
| **Deploy command** | `npx wrangler deploy` |
| **Root directory** | `/` (repository root) |
| **Node.js version** | **22** or later (Wrangler 4 requires Node ≥ 22) |

Cloudflare runs `npm ci` automatically before deploy. When only `npx wrangler deploy` is configured, Wrangler executes the build command in `wrangler.jsonc` first:

```jsonc
"build": {
  "command": "npx opennextjs-cloudflare build"
}
```

That invokes `next build` (via the `build` script in `package.json`) and produces `.open-next/` before upload.

Alternative single-step local/CI deploy:

```bash
npm run deploy
```

That runs `opennextjs-cloudflare build` then deploys via the OpenNext CLI (which wraps Wrangler).

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
npx wrangler deploy --dry-run
# or explicitly:
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
