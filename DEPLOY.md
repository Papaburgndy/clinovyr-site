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

## Environment variables / secrets

Set these as **Worker secrets** (or encrypted env vars) in the Cloudflare dashboard for production:

| Variable | Required | Purpose |
|----------|----------|---------|
| `RESEND_API_KEY` | Yes | Resend API for `/api/contact` |
| `CONTACT_EMAIL` | Yes | Inbox for form submissions |
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
