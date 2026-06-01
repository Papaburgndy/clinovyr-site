# Real Estate Lead Qualifier — Setup Guide

## Required credentials

| Credential type | n8n type | Placeholder |
|-----------------|----------|-------------|
| Anthropic API | HTTP Header Auth (`x-api-key`) | `{{CLIENT_ANTHROPIC_CREDENTIAL_ID}}` |
| Twilio SMS | Twilio API | `{{CLIENT_TWILIO_CREDENTIAL_ID}}` |
| SMTP email | SMTP | `{{CLIENT_SMTP_CREDENTIAL_ID}}` |
| Google Sheets | Google Sheets OAuth2 | `{{CLIENT_GOOGLE_SHEETS_CREDENTIAL_ID}}` |

## Placeholders

- `{{CLIENT_AGENT_PHONE}}` — agent alert number
- `{{CLIENT_DRIP_WEBHOOK_URL}}` — email platform or CRM drip endpoint
- `{{CLIENT_FROM_EMAIL}}`, `{{CLIENT_SHEETS_LEADS_ID}}`
- `{{CLIENT_ANTHROPIC_MODEL}}` — e.g. `claude-sonnet-4-20250514`
- `{{CLIENT_WEBHOOK_PATH}}/new-lead`

## Import to n8n

1. Import `real-estate-lead-qualifier.workflow.json`.
2. Create Header Auth credential: name `x-api-key`, value = Anthropic API key.
3. Map credentials on Claude, Twilio, SMTP, and Sheets nodes.
4. Point website/CRM webhook to the n8n production URL.

## Client customization

- Scoring prompt in **Claude Lead Score** (budget weighting, luxury vs first-time buyer)
- Hot threshold (default ≥7) in **Score >= 7 Hot**
- Drip webhook payload in **Enqueue Drip Campaign**
- Cold auto-reply copy in **Auto-Reply Cold Lead**

## Test each node

1. **Lead Webhook** — POST lead with `message`, `budget`, `timeline`.
2. **Parse Lead** — Confirm normalized fields.
3. **Claude Lead Score** — Check Anthropic response; fix auth if 401.
4. **Normalize Score** — Verify `score`, `tier`, `reason`.
5. **Score >= 7 Hot** — Test score 8 (SMS) and score 5 (warm branch).
6. **Score 4-6 Warm** — Score 5 → drip; score 2 → auto-reply.
7. **Log to Google Sheets** — Row for each path.
