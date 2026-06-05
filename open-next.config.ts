import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext Cloudflare adapter config.
 *
 * Bundle trimming for @vercel/og and Prisma is handled in next.config.ts (webpack
 * aliases) and prisma/schema.prisma (runtime = "cloudflare"). OpenNext already
 * externalizes ./middleware/handler.mjs in the esbuild server bundle step.
 */
export default defineCloudflareConfig({});
