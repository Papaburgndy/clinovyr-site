import { runDeliverableGeneration } from "../../../src/lib/deliverables/run-generation";
import type { TriggerDeliverableGenerationParams } from "../../../src/lib/deliverables/types";

export interface Env {
  INTERNAL_DELIVERABLES_SECRET?: string;
}

function isAuthorized(request: Request, env: Env): boolean {
  const secret =
    env.INTERNAL_DELIVERABLES_SECRET?.trim() ??
    process.env.INTERNAL_DELIVERABLES_SECRET?.trim();

  if (!secret) {
    return true;
  }

  return request.headers.get("X-Clinovyr-Internal-Secret") === secret;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ ok: true, service: "clinovyr-deliverables" });
    }

    if (request.method !== "POST" || url.pathname !== "/generate") {
      return new Response("Not found", { status: 404 });
    }

    if (!isAuthorized(request, env)) {
      return new Response("Unauthorized", { status: 401 });
    }

    let params: TriggerDeliverableGenerationParams;
    try {
      params = (await request.json()) as TriggerDeliverableGenerationParams;
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (
      !params?.companyId ||
      !params?.orderId ||
      !params?.product ||
      !Array.isArray(params.deliverableKeys)
    ) {
      return new Response("Missing required fields", { status: 400 });
    }

    ctx.waitUntil(
      runDeliverableGeneration(params).catch((error) => {
        console.error("[clinovyr-deliverables] generation failed:", error);
      }),
    );

    return Response.json({ ok: true, queued: true });
  },
} satisfies ExportedHandler<Env>;
