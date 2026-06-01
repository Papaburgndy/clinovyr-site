export type ConversationRole = "user" | "assistant";

export interface ConversationMessage {
  role: ConversationRole;
  content: string;
  timestamp: string;
}

export interface ClientFaq {
  keywords: string[];
  answer: string;
}

export interface ClientConfig {
  clientId: string;
  businessName: string;
  hours: string;
  bookingLink: string;
  escalationEmail: string;
  escalationFrom: string;
  faqs: ClientFaq[];
}

export interface AgentRequestBody {
  clientId?: string;
  sessionId?: string;
  message?: string;
}

export interface AgentResponseBody {
  reply: string;
  escalated: boolean;
  sessionId: string;
  truncated?: boolean;
  rateLimited?: boolean;
}

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<unknown>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  del(key: string): Promise<number>;
  lpush(key: string, ...values: string[]): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  ttl(key: string): Promise<number>;
}

export interface ResendClient {
  emails: {
    send: (payload: {
      from: string;
      to: string;
      subject: string;
      text: string;
    }) => Promise<unknown>;
  };
}

export const MAX_MESSAGE_LENGTH = 2000;
export const CONVERSATION_TTL_SECONDS = 86400;
export const RATE_LIMIT_MAX = 10;
export const RATE_LIMIT_WINDOW_SECONDS = 60;
export const SYSTEM_PROMPT_MARKER = "CLINOVYR_AGENT_SYSTEM_V1";
