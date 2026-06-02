# Clinovyr AI Readiness Assessment

Next.js app for the AI Readiness Assessment at `assessment.clinovyr.com`.

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. Health check: http://localhost:3000/api/health

## Production deployment

Deploy to **Cloudflare Workers** via OpenNext. See [`../DEPLOYMENT.md`](../DEPLOYMENT.md) and the main site guide at [`../../DEPLOY.md`](../../DEPLOY.md).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Jest unit tests |
