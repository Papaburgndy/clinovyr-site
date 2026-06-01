import type { ConversationMessage, RedisClient } from "../types.js";
import { CONVERSATION_TTL_SECONDS } from "../types.js";

function conversationKey(clientId: string, sessionId: string): string {
  return `conversation:${clientId}:${sessionId}`;
}

export async function getConversationHistory(
  redis: RedisClient,
  clientId: string,
  sessionId: string,
): Promise<ConversationMessage[]> {
  const key = conversationKey(clientId, sessionId);
  const raw = await redis.lrange(key, 0, -1);
  return raw.map((item) => JSON.parse(item) as ConversationMessage);
}

export async function appendConversationMessage(
  redis: RedisClient,
  clientId: string,
  sessionId: string,
  message: ConversationMessage,
): Promise<void> {
  const key = conversationKey(clientId, sessionId);
  await redis.lpush(key, JSON.stringify(message));
  await redis.expire(key, CONVERSATION_TTL_SECONDS);
}

export async function isConversationExpired(
  redis: RedisClient,
  clientId: string,
  sessionId: string,
): Promise<boolean> {
  const key = conversationKey(clientId, sessionId);
  const ttl = await redis.ttl(key);
  return ttl === -2;
}

export function findContextReference(
  history: ConversationMessage[],
  currentMessage: string,
): string | null {
  const lower = currentMessage.toLowerCase();
  const asksRecall =
    lower.includes("what was") ||
    lower.includes("what did i") ||
    lower.includes("i mentioned") ||
    lower.includes("earlier");

  if (!asksRecall) {
    return null;
  }

  for (const msg of history) {
    if (msg.role !== "user") continue;
    const nameMatch = msg.content.match(/(?:name is|called)\s+([A-Za-z]+)/i);
    if (nameMatch) {
      return nameMatch[1];
    }
  }
  return null;
}
