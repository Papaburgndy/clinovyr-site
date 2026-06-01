# Appointment Reminder SMS

## What it does

Sends automated SMS reminders before scheduled appointments — typically 24 hours and 2 hours ahead — to reduce no-shows and last-minute cancellations.

## Customization per client

- **CRM calendar**: Connect to the scheduling system the client uses (practice management, med spa booking, etc.).
- **Twilio number**: Provision a local phone number and configure the Twilio API key.
- **Message copy**: Personalize SMS text with office name, address, and cancellation policy.
- **Webhook logging**: Point {{WEBHOOK_URL}} to the client's logging endpoint for delivery confirmation.

## How to test after setup

1. Book a test appointment in the CRM with your mobile number.
2. Run the scenario once or wait for the scheduled trigger.
3. Confirm SMS delivery to your phone with correct appointment details.
4. Check the webhook endpoint receives a POST with delivery status.
5. Verify timezone handling matches the client's office location.
