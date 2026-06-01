import fs from "fs";
import path from "path";

export type ProcessedPaymentRecord = {
  sessionId: string;
  eventId?: string;
  industry?: string;
  customerEmail?: string;
  processedAt: string;
};

type ProcessedPaymentsStore = {
  sessions: Record<string, ProcessedPaymentRecord>;
};

const DEFAULT_STORE_PATH = path.join(
  process.cwd(),
  "data",
  "processed-payments.json",
);

function emptyStore(): ProcessedPaymentsStore {
  return { sessions: {} };
}

export function getProcessedPaymentsPath(): string {
  return process.env.PROCESSED_PAYMENTS_PATH ?? DEFAULT_STORE_PATH;
}

export function readProcessedPayments(
  storePath = getProcessedPaymentsPath(),
): ProcessedPaymentsStore {
  if (!fs.existsSync(storePath)) {
    return emptyStore();
  }

  try {
    const raw = fs.readFileSync(storePath, "utf8");
    const parsed = JSON.parse(raw) as ProcessedPaymentsStore;
    if (!parsed.sessions || typeof parsed.sessions !== "object") {
      return emptyStore();
    }
    return parsed;
  } catch {
    return emptyStore();
  }
}

export function writeProcessedPayments(
  store: ProcessedPaymentsStore,
  storePath = getProcessedPaymentsPath(),
): void {
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf8");
}

export function isSessionProcessed(
  sessionId: string,
  storePath = getProcessedPaymentsPath(),
): boolean {
  const store = readProcessedPayments(storePath);
  return Boolean(store.sessions[sessionId]);
}

export function markSessionProcessed(
  record: ProcessedPaymentRecord,
  storePath = getProcessedPaymentsPath(),
): void {
  const store = readProcessedPayments(storePath);
  store.sessions[record.sessionId] = record;
  writeProcessedPayments(store, storePath);
}
