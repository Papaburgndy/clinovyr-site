import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { TriggerDeliverableGenerationParams } from "@/lib/deliverables/types";

const DELIVERABLES_GENERATE_URL = "https://deliverables/generate";

/**
 * Fire-and-forget from the Stripe webhook — do not await in the request handler.
 * Dispatches PDF/ZIP generation to the clinovyr-deliverables Worker via service binding.
 */
export function triggerDeliverableGeneration(
  params: TriggerDeliverableGenerationParams,
): void {
  void dispatchToDeliverablesWorker(params).catch((error) => {
    console.error("[deliverables/trigger] unhandled error:", error);
  });
}

async function dispatchToDeliverablesWorker(
  params: TriggerDeliverableGenerationParams,
): Promise<void> {
  const { env } = getCloudflareContext();
  const binding = env.DELIVERABLES;

  if (!binding) {
    console.error(
      "[deliverables/trigger] DELIVERABLES service binding is not configured",
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

  const response = await binding.fetch(DELIVERABLES_GENERATE_URL, {
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
