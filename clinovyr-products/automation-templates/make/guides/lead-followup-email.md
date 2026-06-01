# Lead Follow-Up Email Sequence

## What it does

Watches your CRM for new leads and sends a personalized follow-up email after a 24-hour delay. Keeps prospects engaged without manual outreach from your sales or front-desk team.

## Customization per client

- **CRM connection**: Map the trigger module to the client's actual CRM (HubSpot, GoHighLevel, Salesforce, etc.).
- **Email copy**: Update subject line and body in the email module to match the client's tone and services.
- **Delay timing**: Adjust the Sleep module delay (default 86400 seconds = 24 hours) based on sales cycle.
- **Sender identity**: Connect the client's {{EMAIL_PROVIDER}} account and verify the from-address domain.

## How to test after setup

1. Create a test lead in the CRM with your own email address.
2. Run the scenario once in Make.com **Run once** mode.
3. Confirm the CRM trigger fires and the lead record is picked up.
4. Wait for the delay (or temporarily set delay to 60 seconds for testing).
5. Verify the follow-up email arrives with correct {{COMPANY_NAME}} branding and links.
