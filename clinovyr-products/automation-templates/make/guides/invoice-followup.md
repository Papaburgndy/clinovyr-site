# Invoice Follow-Up

## What it does

Monitors QuickBooks for overdue invoices and sends escalating email reminders at configurable intervals (7, 14, and 30 days past due).

## Customization per client

- **QuickBooks connection**: Authorize the client's QuickBooks Online account.
- **Reminder cadence**: Adjust timing and number of reminder emails in the flow.
- **Email tone**: Match the client's collections policy — friendly first, firm on later reminders.
- **Webhook logging**: Use {{WEBHOOK_URL}} to log each reminder sent for accounting audit trails.

## How to test after setup

1. Create or identify a test overdue invoice in QuickBooks.
2. Run the scenario once in Make.com.
3. Confirm the reminder email sends to the invoice contact.
4. Verify the webhook logs the reminder event.
5. Test that paid invoices are excluded from future reminders.
