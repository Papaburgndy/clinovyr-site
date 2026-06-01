# Review Generation — Setup Guide

## Required credentials

| Credential type | n8n type | Placeholder |
|-----------------|----------|-------------|
| Google Sheets | Google Sheets OAuth2 | `{{CLIENT_GOOGLE_SHEETS_CREDENTIAL_ID}}` |
| Anthropic API | HTTP Header Auth | `{{CLIENT_ANTHROPIC_CREDENTIAL_ID}}` |
| Twilio SMS | Twilio API | `{{CLIENT_TWILIO_CREDENTIAL_ID}}` |
| SMTP email | SMTP | `{{CLIENT_SMTP_CREDENTIAL_ID}}` |

## Placeholders

- `{{CLIENT_SHEETS_CUSTOMERS_ID}}` — sheet with `completed_at`, `review_sent`, `phone`, `email`, `customer_name`, `service_type`
- `{{CLIENT_REVIEW_URL}}` — Google review link
- `{{CLIENT_TWILIO_FROM}}`, `{{CLIENT_TIMEZONE}}`
- Cron: `0 18 * * *` (6pm daily) — adjust in **Daily 6pm Schedule**

## Import to n8n

1. Import `review-generation.workflow.json`.
2. Prepare **Completed Services** sheet with required columns.
3. Set timezone in workflow settings.
4. Optional: use **Manual Review Webhook** for on-demand runs.

## Client customization

- 24–48h filter logic in **Filter 24-48h Ago**
- Claude tone/length in **Claude Personalized Request**
- Follow-up email HTML in **Follow-Up Email**
- Add payment/review_received column for **Still No Review** accuracy

## Test each node

1. **Daily 6pm Schedule** — Temporarily set cron to every 5 minutes.
2. **Read Google Sheets** — Confirm rows load.
3. **Filter 24-48h Ago** — Seed row with `completed_at` 36 hours ago, `review_sent` empty.
4. **Has Eligible Customers** — Empty sheet should stop at false branch.
5. **Claude Personalized Request** — SMS under 320 chars.
6. **Send Review SMS** — Test number only in dev.
7. **Track Review Sent** — `review_sent` = yes in sheet.
8. **Wait 48h** / **Follow-Up Email** — Shorten wait in dev copy.
