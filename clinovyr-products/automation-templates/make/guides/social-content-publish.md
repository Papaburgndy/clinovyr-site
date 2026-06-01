# Social Content Publish

## What it does

Watches a Google Sheets content calendar for approved posts and publishes them to LinkedIn and Facebook on schedule.

## Customization per client

- **Content calendar**: Set up the Google Sheet with columns for date, content, platform, and status.
- **Social accounts**: Connect the client's LinkedIn Company Page and Facebook Business Page.
- **Publishing rules**: Add filters so only rows marked "Approved" are published.
- **Webhook callback**: Point {{WEBHOOK_URL}} to log successful publishes for the marketing team.

## How to test after setup

1. Add a test row to the content calendar with status "Approved."
2. Run the scenario once in Make.com.
3. Confirm the post appears on LinkedIn and/or Facebook.
4. Verify the webhook receives a success callback.
5. Mark the row as "Published" to prevent duplicate posts.
