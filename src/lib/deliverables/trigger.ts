import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { TriggerDeliverableGenerationParams } from "@/lib/deliverables/types";

const DELIVERABLES_WORKER_NAME = "clinovyr-deliverables";
const GENERATE_PATH = "/generate";

/**
 * Fire-and-forget from the Stripe webhook — do not await in the request handler.
 * Dispatches PDF/ZIP generation to the clinovyr-deliverables Worker via HTTP.
 *
 * On Cloudflare the invocation can be terminated as soon as the webhook
 * response is sent, which would cancel an un-awaited fetch. Register the
 * dispatch with ctx.waitUntil so the runtime keeps it alive.
 */
export function triggerDeliverableGeneration(
  params: TriggerDeliverableGenerationParams,
): void {
  const dispatch = dispatchToDeliverablesWorker(params).catch((error) => {
    console.error("[deliverables/trigger] unhandled error:", error);
  });

  try {
    getCloudflareContext().ctx.waitUntil(dispatch);
  } catch {
    // Outside the Workers runtime (e.g. `next dev`) there is no ctx;
    // the un-awaited promise is fine there.
  }
}

function resolveDeliverablesWorkerUrl(): string | null {
  const { env } = getCloudflareContext();
  const explicit =
    process.env.DELIVERABLES_WORKER_URL?.trim() ??
    (env as { DELIVERABLES_WORKER_URL?: string }).DELIVERABLES_WORKER_URL?.trim();

  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const subdomain =
    process.env.CLOUDFLARE_ACCOUNT_SUBDOMAIN?.trim() ??
    (env as { CLOUDFLARE_ACCOUNT_SUBDOMAIN?: string })
      .CLOUDFLARE_ACCOUNT_SUBDOMAIN?.trim();

  if (subdomain) {
    return `https://${DELIVERABLES_WORKER_NAME}.${subdomain}.workers.dev`;
  }

  return null;
}

async function dispatchToDeliverablesWorker(
  params: TriggerDeliverableGenerationParams,
): Promise<void> {
  const baseUrl = resolveDeliverablesWorkerUrl();

  if (!baseUrl) {
    console.error(
      "[deliverables/trigger] DELIVERABLES_WORKER_URL is not configured (or set CLOUDFLARE_ACCOUNT_SUBDOMAIN)",
    );
    return;
  }

  const secret = process.env.INTERNAL_DELIVERABLES_SECRET?.trim();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (secret) {
    headers["X-Clinovyr-Internal-Secret"] = secret;
  }

  const response = await fetch(`${baseUrl}${GENERATE_PATH}`, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(
      "[deliverables/trigger] deliverables worker error:",
      response.status,
      text,
    );
  }
}
