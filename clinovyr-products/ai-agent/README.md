# Clinovyr AI Agent

Express-based chat agent for `agent.clinovyr.com`. Handles visitor conversations, escalation to email, and session memory via Redis.

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

Server runs at http://localhost:3100. Health check: http://localhost:3100/api/health

## Production deployment

This app is **not** Next.js — deploy as a long-running Node process, not to Cloudflare Workers.

**Recommended hosts:** [Railway](https://railway.app) or [Fly.io](https://fly.io)

| Setting | Value |
|---------|--------|
| Root directory | `clinovyr-products/ai-agent` |
| Build command | `npm run build` |
| Start command | `npm start` |
| Port | `3100` (set `PORT` env var) |
| Domain | `agent.clinovyr.com` |

See [`../DEPLOYMENT.md`](../DEPLOYMENT.md) for environment variables, Redis/Upstash setup, and uptime monitoring.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled server |
| `npm test` | Jest unit tests |
