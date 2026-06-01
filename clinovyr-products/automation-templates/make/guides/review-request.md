# Post-Service Review Request

## What it does

After a completed job or visit, waits 48 hours then sends a review request email directing happy clients to Google, Yelp, or another review platform.

## Customization per client

- **Completion trigger**: Map the CRM "job complete" or "visit closed" status field.
- **Review link**: Insert the client's Google Business Profile or Yelp review URL in the email body.
- **Delay**: Adjust the 48-hour wait if the client prefers same-day or one-week timing.
- **Opt-out**: Add a filter to skip clients who already left a review or opted out.

## How to test after setup

1. Mark a test client record as "completed" in the CRM.
2. Run the scenario once with a shortened delay for testing.
3. Confirm the review email arrives with the correct review platform link.
4. Click the review link to verify it opens the right business profile.
5. Check that repeat requests are suppressed for the same client.
