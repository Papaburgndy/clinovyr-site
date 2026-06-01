# Clinovyr HubSpot CRM Automation CLI

Automated HubSpot CRM setup for Clinovyr client onboarding. Runs a 6-step pipeline: audit, custom properties, AI lead scoring, email sequences, dashboard configuration, and a final setup report.

## Prerequisites

- Node.js 18+
- HubSpot private app access token with CRM and marketing scopes
- Anthropic API key

## Setup

```bash
cd clinovyr-products/crm-automation
npm install

# Copy and configure client credentials
cp configs/client.example.json configs/client.json
cp .env.local.example .env.local
# Edit configs/client.json with your HubSpot PAT
# Edit .env.local with ANTHROPIC_API_KEY (or set anthropicApiKey in client config)
```

## Usage

```bash
# Full live setup (writes to HubSpot where API supports it)
npx ts-node setup-crm.ts --client configs/client.json

# Dry run — skips HubSpot writes, generates mock exports and report
npx ts-node setup-crm.ts --client configs/client.json --dry-run
```

## Steps

| Step | Module | Description |
| --- | --- | --- |
| 1 | `src/steps/audit.ts` | Pull contact properties, workflows, emails, pipelines |
| 2 | `src/steps/properties.ts` | Create AI custom contact properties |
| 3 | `src/steps/lead-scoring.ts` | Claude lead scoring + workflow stub |
| 4 | `src/steps/email-sequences.ts` | 5-email nurture sequence (Day 0, 3, 7, 14, 21) |
| 5 | `src/steps/dashboard.ts` | Dashboard widget setup instructions |
| 6 | `src/steps/report.ts` | Final markdown setup report |

## Output

All artifacts are written to `output/` (gitignored):

- `crm-audit-{clientId}.json`
- `workflow-stub-lead-scoring-{clientId}.json`
- `email-sequence-{clientId}.json`
- `workflow-stub-email-sequence-{clientId}.json`
- `dashboard-setup-{clientId}.json`
- `setup-complete-{clientId}.md`

## API Limitations

HubSpot's public API has limited support for workflow and custom dashboard creation. This CLI:

- **Implements real API calls** for property creation, CRM audit, and marketing email creation (when permissions allow)
- **Exports JSON stubs and manual instructions** for workflows and dashboards
- **Supports `--dry-run`** to preview the full setup without writing to HubSpot

## Type Checking

```bash
npx tsc --noEmit
```

## Lead Scoring

Import `scoreLead` from `src/steps/lead-scoring.ts` for programmatic scoring:

```typescript
import { scoreLead } from "./src/steps/lead-scoring.js";
import { createClaudeClient } from "./src/claude-client.js";

const client = createClaudeClient(process.env.ANTHROPIC_API_KEY!);
const result = await scoreLead(client, { email: "lead@example.com" }, "Medical/Dental");
// { score: 72, reason: "..." }
```
