# Clinovyr Make.com Template Library

Manage, customize, and deploy Make.com automation blueprints for Clinovyr clients.

## Quick start

```bash
cd clinovyr-products/automation-templates/make
npm install
npm run wizard
```

The wizard prompts for client details and writes customized blueprints to `customized-for-client/{company-slug}/`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run wizard` | Interactive CLI to customize templates for a client |
| `npm run build` | Compile TypeScript to `dist/` |

## Project structure

```
make/
├── src/
│   ├── template-manager.ts    # TemplateLibrary class and types
│   └── client-setup-wizard.ts # Interactive setup CLI
├── templates/
│   ├── manifest.json          # Catalog of all templates
│   └── *.blueprint.json       # Make.com blueprint stubs
├── guides/
│   └── *.md                   # Per-template setup guides
├── customized-for-client/     # Generated client packages (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

## Using TemplateLibrary programmatically

```typescript
import { TemplateLibrary } from "./src/template-manager";

const library = new TemplateLibrary();
library.loadCatalog();

const template = library.getTemplate("lead-followup-email");
const blueprint = library.loadBlueprint("lead-followup-email");

const result = library.customizeTemplate("lead-followup-email", {
  companyName: "Acme Medical",
  crmType: "HubSpot",
  emailProvider: "Gmail",
  webhookUrl: "https://hooks.example.com/acme",
  apiKeys: { CRM: "secret-key" },
});

console.log(result.substitutions);
```

## Placeholders

Blueprints use these placeholders, replaced during customization:

| Placeholder | Source |
|-------------|--------|
| `{{COMPANY_NAME}}` | Client company name |
| `{{CRM_TYPE}}` | CRM platform (HubSpot, Salesforce, etc.) |
| `{{EMAIL_PROVIDER}}` | Email service (Gmail, SendGrid, etc.) |
| `{{WEBHOOK_URL}}` | Client webhook endpoint |
| `{{API_KEY_*}}` | Optional API keys from wizard prompts |

## Available templates

1. **lead-followup-email** — Timed follow-up for new CRM leads
2. **appointment-reminder-sms** — SMS reminders before appointments
3. **review-request** — Post-service review request emails
4. **new-client-onboarding** — Welcome sequence for new clients
5. **invoice-followup** — Overdue invoice reminder emails
6. **monthly-report** — Scheduled KPI report to stakeholders
7. **social-content-publish** — Publish from content calendar to social
8. **ai-chatbot-escalation** — Route chatbot conversations to humans

## Client output

Each wizard run creates:

- `{template-id}.blueprint.json` — Ready-to-import Make.com scenarios
- `substitutions-audit.json` — Audit trail of all placeholder replacements
- `README.md` — Import instructions for the client team

## Type checking

```bash
npx tsc --noEmit
```

## Importing into Make.com

1. Open Make.com → Scenarios → Create a new scenario.
2. Click **⋯** → **Import Blueprint**.
3. Select the customized `.blueprint.json` file.
4. Reconnect modules to the client's live accounts.
5. Run once to verify, then enable.

See individual guides in `guides/` for template-specific setup and testing steps.
