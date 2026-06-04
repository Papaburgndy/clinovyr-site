import type { DeliverableRecord } from "@/lib/deliverables/types";

function isDeliverableRecord(value: unknown): value is DeliverableRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.key === "string" &&
    typeof record.name === "string" &&
    typeof record.url === "string" &&
    typeof record.type === "string" &&
    typeof record.size === "number"
  );
}

export function parseDeliverableRecords(raw: unknown): DeliverableRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isDeliverableRecord);
}

export function findDeliverableRecord(
  records: DeliverableRecord[],
  keyOrType: string,
): DeliverableRecord | undefined {
  const normalized = keyOrType.trim().toLowerCase();
  return records.find(
    (record) =>
      record.key === keyOrType ||
      record.key.toLowerCase() === normalized ||
      record.type === keyOrType ||
      record.type.toLowerCase() === normalized,
  );
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
