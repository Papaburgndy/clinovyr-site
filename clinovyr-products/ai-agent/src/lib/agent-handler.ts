import type {
  AgentRequestBody,
  AgentResponseBody,
  RedisClient,
  ResendClient,
} from "../types.js";
import { loadClientConfig } from "./config.js";
import { detectEscalation } from "./escalation.js";
import { enqueueEscalation, processEscalationQueue } from "./escalation-queue.js";
import {
  appendConversationMessage,
  getConversationHistory,
} from "./memory.js";
import {
  detectPromptInjection,
  normalizeMessage,
  safeReplyForInjection,
} from "./message.js";
import { checkRateLimit } from "./rate-limit.js";
import { sendEscalationEmail } from "./resend.js";
import {
  evaluateReplyEscalation,
  generateReply,
  replyContainsSystemPromptLeak,
} from "./response.js";
import { normalizeSessionId } from "./session.js";

export interface AgentHandlerDeps {
  redis: RedisClient;
  resend: ResendClient | null;
}

export type AgentHandlerResult =
  | { ok: true; body: AgentResponseBody; status: number }
  | { ok: false; error: string; status: number };

async function safeGetHistory(
  redis: RedisClient,
  clientId: string,
  sessionId: string,
): Promise<{ history: Awaited<ReturnType<typeof getConversationHistory>>; redisAvailable: boolean }> {
  try {
    const history = await getConversationHistory(redis, clientId, sessionId);
    return { history, redisAvailable: true };
  } catch (error) {
    console.error("Redis unavailable — continuing in stateless mode:", error);
    return { history: [], redisAvailable: false };
  }
}

async function safeCheckRateLimit(
  redis: RedisClient,
  sessionId: string,
): Promise<{ allowed: boolean; redisAvailable: boolean }> {
  try {
    const rate = await checkRateLimit(redis, sessionId);
    return { allowed: rate.allowed, redisAvailable: true };
  } catch (error) {
    console.error("Redis rate limit check failed — allowing request:", error);
    return { allowed: true, redisAvailable: false };
  }
}

async function safeAppendMessages(
  redis: RedisClient,
  clientId: string,
  sessionId: string,
  userContent: string,
  assistantContent: string,
): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    await appendConversationMessage(redis, clientId, sessionId, {
      role: "user",
      content: userContent,
      timestamp,
    });
    await appendConversationMessage(redis, clientId, sessionId, {
      role: "assistant",
      content: assistantContent,
      timestamp,
    });
  } catch (error) {
    console.error("Redis append failed — conversation not persisted:", error);
  }
}

async function handleEscalationEmail(
  deps: AgentHandlerDeps,
  config: NonNullable<ReturnType<typeof loadClientConfig>>,
  sessionId: string,
  userMessage: string,
  reason: string,
): Promise<void> {
  if (!deps.resend) {
    return;
  }

  const sent = await sendEscalationEmail(
    deps.resend,
    config,
    sessionId,
    userMessage,
    reason,
  );

  if (!sent) {
    enqueueEscalation(config, sessionId, userMessage, reason);
  }
}

export async function handleAgentMessage(
  deps: AgentHandlerDeps,
  body: AgentRequestBody,
): Promise<AgentHandlerResult> {
  if (deps.resend) {
    try {
      await processEscalationQueue(deps.resend, { maxItems: 3 });
    } catch (error) {
      console.error("Failed to process escalation queue:", error);
    }
  }

  const clientId = body.clientId;
  if (!clientId || typeof clientId !== "string" || clientId.trim() === "") {
    return {
      ok: false,
      error: "clientId is required",
      status: 400,
    };
  }

  const config = loadClientConfig(clientId.trim());
  if (!config) {
    return {
      ok: false,
      error: `Client not found: ${clientId}`,
      status: 404,
    };
  }

  const normalized = normalizeMessage(body.message);
  if (!normalized) {
    return {
      ok: false,
      error: "message is required and cannot be empty",
      status: 400,
    };
  }

  const sessionId = normalizeSessionId(body.sessionId);

  const rateCheck = await safeCheckRateLimit(deps.redis, sessionId);
  if (rateCheck.allowed === false) {
    return {
      ok: true,
      status: 429,
      body: {
        reply: "You're sending messages too quickly. Please wait a moment and try again.",
        escalated: false,
        sessionId,
        rateLimited: true,
      },
    };
  }

  if (detectPromptInjection(normalized.text)) {
    const reply = safeReplyForInjection();
    if (rateCheck.redisAvailable) {
      await safeAppendMessages(
        deps.redis,
        config.clientId,
        sessionId,
        normalized.text,
        reply,
      );
    }
    return {
      ok: true,
      status: 200,
      body: {
        reply,
        escalated: false,
        sessionId,
        truncated: normalized.truncated,
      },
    };
  }

  const { history, redisAvailable } = await safeGetHistory(
    deps.redis,
    config.clientId,
    sessionId,
  );

  const escalation = detectEscalation(normalized.text);
  let escalated = escalation.shouldEscalate;
  let escalationReason = escalation.reason;

  let reply = generateReply(config, normalized.text, history, {
    escalated,
    escalationReason,
  });

  if (replyContainsSystemPromptLeak(reply)) {
    reply = safeReplyForInjection();
    escalated = false;
    escalationReason = undefined;
  }

  const replyEscalation = evaluateReplyEscalation(
    reply,
    escalated,
    escalationReason,
  );
  escalated = replyEscalation.escalated;
  escalationReason = replyEscalation.escalationReason;

  if (escalated) {
    await handleEscalationEmail(
      deps,
      config,
      sessionId,
      normalized.text,
      escalationReason ?? "escalation",
    );
  }

  if (redisAvailable) {
    await safeAppendMessages(
      deps.redis,
      config.clientId,
      sessionId,
      normalized.text,
      reply,
    );
  }

  return {
    ok: true,
    status: 200,
    body: {
      reply,
      escalated,
      sessionId,
      truncated: normalized.truncated || undefined,
    },
  };
}

export async function handleProcessEscalationQueue(
  deps: AgentHandlerDeps,
  maxItems?: number,
): Promise<{ processed: number; failed: number; remaining: number } | { error: string }> {
  if (!deps.resend) {
    return { error: "Resend is not configured" };
  }

  return processEscalationQueue(deps.resend, { maxItems });
}
