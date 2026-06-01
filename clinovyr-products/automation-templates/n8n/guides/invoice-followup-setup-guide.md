# Invoice Follow-Up — Setup Guide

## Required credentials

| Credential type | n8n type | Placeholder |
|-----------------|----------|-------------|
| SMTP | SMTP | `{{CLIENT_SMTP_CREDENTIAL_ID}}` |
| Google Sheets | Google Sheets OAuth2 | `{{CLIENT_GOOGLE_SHEETS_CREDENTIAL_ID}}` |

## Placeholders

- `{{CLIENT_AR_EMAIL}}`, `{{CLIENT_OWNER_EMAIL}}`
- `{{CLIENT_PAYMENT_URL}}`
- `{{CLIENT_SHEETS_AR_ID}}` — tabs: `Call Notes`, `Invoice Follow-Up Log`
- `{{CLIENT_WEBHOOK_PATH}}/quickbooks-invoice`

## Import to n8n

1. Import `invoice-followup.workflow.json`.
2. In QuickBooks Online, configure webhook (or middleware) for invoice create/update events to n8n URL.
3. Create AR Google Sheet with required tabs/columns.
4. Replace email copy for brand/compliance.

## Client customization

- Wait durations (3 / 4 / 7 days) — align with client AR policy
- Day 7 parallel branch: email + call note sheet
- Day 14: formal notice + owner flag
- Add “paid” check webhook to cancel sequence (extend template as needed)

## Test each node

1. **QuickBooks Webhook** — POST sample QuickBooks-style invoice JSON.
2. **Parse Invoice** — `customerEmail`, `balance`, `number` populated.
3. **Wait Day 3** — Use 1-minute wait in dev clone.
4. **Day 3 Email** — SMTP test inbox.
5. **Day 7** — Email + **Day 7 Call Note Log** row.
6. **Day 14** — Formal email + **Flag Owner** to owner inbox.
7. **Log Completion** — Final row in Invoice Follow-Up Log.

### Sample webhook body

```json
{
  "Id": "123",
  "DocNumber": "INV-1001",
  "Balance": 1500,
  "DueDate": "2026-06-01",
  "CustomerRef": { "name": "Acme Corp" },
  "BillEmail": { "Address": "billing@acme.com" }
}
```
