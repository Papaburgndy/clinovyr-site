# Social Content Pipeline — Setup Guide

## Required credentials

| Credential type | n8n type | Placeholder |
|-----------------|----------|-------------|
| Anthropic API | HTTP Header Auth | `{{CLIENT_ANTHROPIC_CREDENTIAL_ID}}` |
| Airtable | Airtable Personal Access Token | `{{CLIENT_AIRTABLE_CREDENTIAL_ID}}` |
| Buffer (or alternative) | HTTP Header Auth | `{{CLIENT_BUFFER_CREDENTIAL_ID}}` |

## Placeholders

- `{{CLIENT_AIRTABLE_BASE_ID}}`, `{{CLIENT_AIRTABLE_CONTENT_TABLE}}`
- `{{CLIENT_BUFFER_API_URL}}`, `{{CLIENT_BUFFER_PROFILE_ID}}`
- `{{CLIENT_INDUSTRY}}`, `{{CLIENT_LOCATION}}`
- `{{CLIENT_WEBHOOK_PATH}}/content-approved`
- Monday cron: `0 9 * * 1`

## Import to n8n

1. Import `social-content-pipeline.workflow.json`.
2. Create Airtable table: Post ID, Title, Body, Platform, Hashtags, Status, Week Of, Approved At, Published At.
3. Wire Airtable automation or button to POST `{ "status": "approved", "record_id": "...", "post_body": "...", "scheduled_at": "..." }` to the approval webhook.
4. Map Buffer API token (or swap **Publish via Buffer** for LinkedIn/Facebook HTTP nodes).

## Client customization

- Post count and platforms in **Claude Generate 5 Posts** prompt
- Airtable field names in create/update nodes
- Approval webhook payload shape in **Status Approved**
- Replace Buffer with native social APIs if client has no Buffer account

## Test each node

1. **Monday 9am Schedule** — Manual trigger for immediate test.
2. **Claude Generate 5 Posts** — Valid JSON array in response.
3. **Parse Posts Array** — Five items with `post_id`.
4. **Airtable Pending Approval** — Records status `pending_approval`.
5. **Approval Webhook** — POST approved payload.
6. **Publish via Buffer** — Verify scheduled post in Buffer dashboard.
7. **Mark Published in Airtable** — Status `published`.
