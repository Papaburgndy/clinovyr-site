# AI Chatbot Escalation

## What it does

Receives chatbot events via webhook, uses OpenAI to detect high-intent or frustrated visitors, and escalates to Slack and email for human follow-up.

## Customization per client

- **Webhook URL**: Configure the website chatbot to POST events to {{WEBHOOK_URL}}.
- **Escalation criteria**: Tune the OpenAI prompt for industry-specific intent signals (booking, pricing, complaint).
- **Slack routing**: Send escalations to the appropriate team channel.
- **CRM handoff**: Optionally add a module to create a lead in {{CRM_TYPE}} when escalation occurs.

## How to test after setup

1. Send a test POST to {{WEBHOOK_URL}} simulating a chatbot conversation.
2. Run the scenario once in Make.com.
3. Confirm OpenAI returns an escalation decision.
4. Verify Slack and email notifications arrive with conversation context.
5. Test both "escalate" and "no escalation" conversation samples.
