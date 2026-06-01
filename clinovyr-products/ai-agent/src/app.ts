import express, { type Express, type Request, type Response } from "express";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { AgentRequestBody } from "./types.js";
import {
  handleAgentMessage,
  handleProcessEscalationQueue,
  type AgentHandlerDeps,
} from "./lib/agent-handler.js";
import { getHealthPayload } from "./lib/health.js";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../public");

export function createApp(deps: AgentHandlerDeps): Express {
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  app.use(express.static(publicDir));

  app.get("/api/health", (_req, res) => {
    const { body, statusCode } = getHealthPayload();
    res.status(statusCode).json(body);
  });

  app.post("/api/agent", async (req: Request, res: Response) => {
    const result = await handleAgentMessage(deps, req.body as AgentRequestBody);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.status(result.status).json(result.body);
  });

  app.post("/api/process-escalation-queue", async (req: Request, res: Response) => {
    const maxItems =
      typeof req.body?.maxItems === "number" ? req.body.maxItems : undefined;
    const result = await handleProcessEscalationQueue(deps, maxItems);
    if ("error" in result) {
      res.status(503).json({ error: result.error });
      return;
    }
    res.status(200).json(result);
  });

  return app;
}
