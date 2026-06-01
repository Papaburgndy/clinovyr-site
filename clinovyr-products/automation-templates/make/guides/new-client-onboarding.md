# New Client Onboarding

## What it does

Triggers when a new client or patient is added to the CRM. Sends a welcome email with intake instructions and notifies the internal team via Slack.

## Customization per client

- **Welcome email**: Customize copy, intake form link, and attachment list per industry (legal retainer, medical intake, etc.).
- **Slack channel**: Route notifications to the correct team channel (#new-clients, #intake, etc.).
- **CRM trigger**: Map to "deal won," "new contact," or "new patient" depending on the CRM setup.
- **Additional steps**: Add modules for calendar booking, document signing, or CRM task creation.

## How to test after setup

1. Create a test contact/deal in the CRM that matches the trigger criteria.
2. Run the scenario once in Make.com.
3. Verify the welcome email arrives with correct branding and form links.
4. Confirm the Slack notification appears in the designated channel.
5. Validate that duplicate triggers don't fire for the same client.
