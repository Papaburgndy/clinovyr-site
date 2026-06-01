# Monthly Client Report — Setup Guide

## Required credentials

| Credential type | n8n type | Placeholder |
|-----------------|----------|-------------|
| Google Analytics | Google Analytics OAuth2 (GA4) | `{{CLIENT_GA_CREDENTIAL_ID}}` |
| HubSpot | HTTP Header Auth (Bearer) | `{{CLIENT_HUBSPOT_CREDENTIAL_ID}}` |
| Anthropic API | HTTP Header Auth | `{{CLIENT_ANTHROPIC_CREDENTIAL_ID}}` |
| SMTP | SMTP | `{{CLIENT_SMTP_CREDENTIAL_ID}}` |
| Google Sheets | Google Sheets OAuth2 | `{{CLIENT_GOOGLE_SHEETS_CREDENTIAL_ID}}` |

## Placeholders

- `{{CLIENT_GA4_PROPERTY_ID}}`
- `{{CLIENT_CUSTOM_KPI_WEBHOOK_URL}}` — client-specific metrics endpoint
- `{{CLIENT_PDF_SERVICE_URL}}` — HTML-to-PDF API (Gotenberg, PDFShift, etc.)
- `{{CLIENT_REPORT_RECIPIENT_EMAIL}}`, `{{CLIENT_FROM_EMAIL}}`
- `{{CLIENT_SHEETS_REPORTS_ID}}`
- Cron: `0 8 1 * *` (8am on the 1st)

## Import to n8n

1. Import `monthly-client-report.workflow.json`.
2. Configure GA4 property access for service account or OAuth user.
3. HubSpot private app token with `crm.objects.deals.read`.
4. Deploy or subscribe to a PDF render endpoint; update **Generate PDF** URL.
5. Confirm **Merge KPI Sources** receives three inputs (use manual trigger fan-out test).

## Client customization

- GA4 metrics/dimensions in **Pull GA4 KPIs**
- HubSpot filters (pipeline, date range)
- Claude narrative prompt (industry, KPI definitions)
- PDF branding (HTML template in **Build PDF HTML**)
- Additional data sources via extra HTTP nodes into Merge

## Test each node

1. **1st of Month 8am** — Manual execute from trigger.
2. **Pull GA4 KPIs** — Valid report JSON or fix OAuth scope.
3. **Pull HubSpot Deals** — 200 response with `results` array.
4. **Pull Custom KPI Webhook** — Client metrics JSON.
5. **Merge KPI Sources** + **Structure KPI Payload** — Single combined object.
6. **Claude Narrative Report** — Markdown narrative in output.
7. **Build PDF HTML** — `html` and `filename` fields.
8. **Generate PDF** — Binary PDF in execution data.
9. **Email Client Report** — Attachment reaches recipient.
10. **Log Report Sent** — Row in Report Log sheet.
