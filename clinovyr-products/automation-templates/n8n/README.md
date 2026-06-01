# Clinovyr n8n Workflow Template Library

Production-oriented n8n workflow exports for Clinovyr client deployments. Each template uses real n8n node types, placeholder credentials (`{{CLIENT_*}}`), and companion setup guides.

## Contents

| Template | File | Vertical |
|----------|------|----------|
| Medical Appointment Reminder | `medical-appointment-reminder.workflow.json` | Medical, med-spa |
| Real Estate Lead Qualifier | `real-estate-lead-qualifier.workflow.json` | Real estate |
| Review Generation | `review-generation.workflow.json` | Service businesses |
| Social Content Pipeline | `social-content-pipeline.workflow.json` | All |
| Invoice Follow-Up | `invoice-followup.workflow.json` | Construction, law |
| Monthly Client Report | `monthly-client-report.workflow.json` | All |

Catalog metadata lives in `manifest.json` (aligned with the Make.com template library format).

## Import into n8n

1. Open your n8n instance (Cloud or self-hosted).
2. Go to **Workflows** → **⋮** menu → **Import from File** (or drag the `.workflow.json` onto the canvas).
3. Select the workflow JSON from this folder.
4. Before activating, open each node with a red credential warning and map to the client’s n8n credentials.
5. Search the workflow for `{{CLIENT_` placeholders and replace with client-specific values (or use n8n variables / environment variables).
6. For **Wait** nodes: ensure the instance supports resumable executions (n8n Cloud and recent self-hosted builds do).
7. Activate only after a full test execution on staging data.

## Placeholder convention

Templates embed Clinovyr deployment placeholders:

- `{{CLIENT_NAME}}`, `{{CLIENT_PHONE}}`, `{{CLIENT_TIMEZONE}}`
- `{{CLIENT_*_CREDENTIAL_ID}}` — map to credentials created in n8n UI
- `{{CLIENT_WEBHOOK_PATH}}` — unique path prefix per client
- API keys should **never** be hardcoded; use n8n Credentials or `$env`

Replace placeholders in the JSON before import, or use find-and-replace after import.

## Claude / Anthropic

AI steps use **HTTP Request** nodes calling `https://api.anthropic.com/v1/messages` with **Header Auth** credentials (`x-api-key`). Model default placeholder: `{{CLIENT_ANTHROPIC_MODEL}}` (e.g. `claude-sonnet-4-20250514`).

## Testing

Each workflow has a setup guide under `guides/` with per-node test steps. General approach:

1. **Manual execution** — Run from the trigger node with pinned test data where supported.
2. **Webhook tests** — Use curl/Postman against the production webhook URL (workflow must be active).
3. **Schedule triggers** — Temporarily change cron to `*/5 * * * *` for a five-minute test window.
4. **Wait nodes** — Shorten wait duration in a dev copy, or use “Resume” from execution list after manual wait.

## Related

- Make.com templates: `../make/templates/`
- Clinovyr delivery: configure client n8n workspace, credentials, and webhook URLs per `guides/*-setup-guide.md`.
