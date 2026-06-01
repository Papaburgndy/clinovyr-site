# Medical Appointment Reminder — Setup Guide

## Required credentials

| Credential type | n8n type | Placeholder |
|-----------------|----------|-------------|
| Twilio SMS | Twilio API | `{{CLIENT_TWILIO_CREDENTIAL_ID}}` |
| Google Sheets | Google Sheets OAuth2 | `{{CLIENT_GOOGLE_SHEETS_CREDENTIAL_ID}}` |

## Environment / placeholders

- `{{CLIENT_NAME}}`, `{{CLIENT_PHONE}}`, `{{CLIENT_LOCATION}}`
- `{{CLIENT_TWILIO_FROM}}` — E.164 sender number
- `{{CLIENT_SHEETS_LOG_ID}}` — spreadsheet ID for reminder log
- `{{CLIENT_WEBHOOK_PATH}}` — e.g. `clinovyr-acme`
- `{{CLIENT_TIMEZONE}}` — e.g. `America/Los_Angeles`

## Import to n8n

1. Import `medical-appointment-reminder.workflow.json`.
2. Assign Twilio and Google Sheets credentials on all nodes that show warnings.
3. Replace placeholders (workflow name, webhook path, sheet ID, SMS copy).
4. Connect your practice management system or middleware to POST to the webhook URL.

### Expected webhook payload

```json
{
  "patient_id": "P-1001",
  "patient_name": "Jane Doe",
  "phone": "+19165551234",
  "appointment_at": "2026-06-15T14:30:00-07:00",
  "provider_name": "Dr. Smith"
}
```

## Client customization

- SMS message templates in Twilio nodes
- Wait durations (48h / 22h) if appointment lead times differ
- Sheet column mapping in Google Sheets nodes
- “Within 24h” branch behavior (currently logs only, no SMS sequence)

## Test each node

1. **Appointment Webhook** — POST sample JSON; confirm execution starts.
2. **Extract Patient** — Verify `hoursUntil` and `appointmentIso` in output.
3. **More Than 24h Until Appt** — Test with appointment 3 days out (true) and 12 hours out (false).
4. **SMS 72h / 24h / 2h** — Use Twilio test credentials or your own phone in dev.
5. **Wait nodes** — In dev, reduce to minutes; confirm execution resumes.
6. **Log to Google Sheets** — Confirm row append on both branches.
