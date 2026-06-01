/** Jest setup — keep env isolated from developer .env.local */
process.env.SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
