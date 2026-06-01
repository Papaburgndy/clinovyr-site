import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type { ClientConfig, ResendClient } from "../types.js";
import { sendEscalationEmail } from "./resend.js";

export interface EscalationQueueItem {
  id: string;
  clientId: string;
  sessionId: string;
  userMessage: string;
  reason: string;
  escalationEmail: string;
  escalationFrom: string;
  businessName: string;
  createdAt: string;
  lastAttemptAt?: string;
}

const defaultQueuePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../data/escalation-queue.json",
);

export function getEscalationQueuePath(): string {
  return process.env.ESCALATION_QUEUE_PATH ?? defaultQueuePath;
}

function ensureQueueFile(path: string): void {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  if (!existsSync(path)) {
    writeFileSync(path, "[]", "utf-8");
  }
}

export function readEscalationQueue(
  queuePath = getEscalationQueuePath(),
): EscalationQueueItem[] {
  ensureQueueFile(queuePath);
  const raw = readFileSync(queuePath, "utf-8");
  return JSON.parse(raw) as EscalationQueueItem[];
}

export function writeEscalationQueue(
  items: EscalationQueueItem[],
  queuePath = getEscalationQueuePath(),
): void {
  ensureQueueFile(queuePath);
  writeFileSync(queuePath, JSON.stringify(items, null, 2), "utf-8");
}

export function enqueueEscalation(
  config: ClientConfig,
  sessionId: string,
  userMessage: string,
  reason: string,
  queuePath = getEscalationQueuePath(),
): void {
  const items = readEscalationQueue(queuePath);
  items.push({
    id: randomUUID(),
    clientId: config.clientId,
    sessionId,
    userMessage,
    reason,
    escalationEmail: config.escalationEmail,
    escalationFrom: config.escalationFrom,
    businessName: config.businessName,
    createdAt: new Date().toISOString(),
  });
  writeEscalationQueue(items, queuePath);
}

export interface ProcessQueueResult {
  processed: number;
  failed: number;
  remaining: number;
}

export async function processEscalationQueue(
  resend: ResendClient,
  options: { maxItems?: number; queuePath?: string } = {},
): Promise<ProcessQueueResult> {
  const queuePath = options.queuePath ?? getEscalationQueuePath();
  const maxItems = options.maxItems ?? Number.MAX_SAFE_INTEGER;
  const items = readEscalationQueue(queuePath);
  const remaining: EscalationQueueItem[] = [];
  let processed = 0;
  let failed = 0;

  for (const item of items) {
    if (processed >= maxItems) {
      remaining.push(item);
      continue;
    }

    const config: ClientConfig = {
      clientId: item.clientId,
      businessName: item.businessName,
      hours: "",
      bookingLink: "",
      escalationEmail: item.escalationEmail,
      escalationFrom: item.escalationFrom,
      faqs: [],
    };

    const sent = await sendEscalationEmail(
      resend,
      config,
      item.sessionId,
      item.userMessage,
      item.reason,
    );

    if (sent) {
      processed += 1;
    } else {
      failed += 1;
      remaining.push({
        ...item,
        lastAttemptAt: new Date().toISOString(),
      });
    }
  }

  writeEscalationQueue(remaining, queuePath);
  return { processed, failed, remaining: remaining.length };
}
