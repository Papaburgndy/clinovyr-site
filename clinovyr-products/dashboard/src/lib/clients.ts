import fs from "fs/promises";
import path from "path";
import type {
  ActivityEvent,
  Automation,
  ClientConfig,
  ClientSummary,
  DashboardKpis,
  ReportMeta,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "clients");

export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL ?? "";
}

export function isAdminEmail(email: string): boolean {
  const admin = getAdminEmail();
  return admin.length > 0 && email.toLowerCase() === admin.toLowerCase();
}

export async function listClientIds(): Promise<string[]> {
  try {
    const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

export async function getClientIdByEmail(email: string): Promise<string | null> {
  const clientIds = await listClientIds();
  for (const clientId of clientIds) {
    const config = await getClientConfig(clientId);
    if (config.email.toLowerCase() === email.toLowerCase()) {
      return clientId;
    }
  }
  return null;
}

export async function resolveClientId(
  email: string,
  requestedClientId?: string | null
): Promise<string | null> {
  if (isAdminEmail(email)) {
    if (requestedClientId) {
      const exists = await clientExists(requestedClientId);
      return exists ? requestedClientId : null;
    }
    const ids = await listClientIds();
    return ids[0] ?? null;
  }
  return getClientIdByEmail(email);
}

async function clientExists(clientId: string): Promise<boolean> {
  try {
    await fs.access(path.join(DATA_DIR, clientId, "config.json"));
    return true;
  } catch {
    return false;
  }
}

function clientDir(clientId: string): string {
  return path.join(DATA_DIR, clientId);
}

export async function getClientConfig(clientId: string): Promise<ClientConfig> {
  const raw = await fs.readFile(
    path.join(clientDir(clientId), "config.json"),
    "utf-8"
  );
  return JSON.parse(raw) as ClientConfig;
}

export async function saveClientConfig(
  clientId: string,
  config: ClientConfig
): Promise<void> {
  await fs.writeFile(
    path.join(clientDir(clientId), "config.json"),
    JSON.stringify(config, null, 2)
  );
}

export async function getAutomations(clientId: string): Promise<Automation[]> {
  const raw = await fs.readFile(
    path.join(clientDir(clientId), "automations.json"),
    "utf-8"
  );
  return JSON.parse(raw) as Automation[];
}

export async function getActivity(clientId: string): Promise<ActivityEvent[]> {
  try {
    const raw = await fs.readFile(
      path.join(clientDir(clientId), "activity.json"),
      "utf-8"
    );
    return JSON.parse(raw) as ActivityEvent[];
  } catch {
    return [];
  }
}

export async function getKpis(clientId: string): Promise<DashboardKpis> {
  const raw = await fs.readFile(
    path.join(clientDir(clientId), "kpis.json"),
    "utf-8"
  );
  return JSON.parse(raw) as DashboardKpis;
}

export async function getReports(clientId: string): Promise<ReportMeta[]> {
  try {
    const raw = await fs.readFile(
      path.join(clientDir(clientId), "reports.json"),
      "utf-8"
    );
    return JSON.parse(raw) as ReportMeta[];
  } catch {
    return [];
  }
}

export async function saveReportMeta(
  clientId: string,
  report: ReportMeta
): Promise<void> {
  const existing = await getReports(clientId);
  const filtered = existing.filter((r) => r.id !== report.id);
  await fs.writeFile(
    path.join(clientDir(clientId), "reports.json"),
    JSON.stringify([report, ...filtered], null, 2)
  );
}

export async function listActiveClientIds(): Promise<string[]> {
  const clientIds = await listClientIds();
  const active: string[] = [];

  for (const clientId of clientIds) {
    try {
      const config = await getClientConfig(clientId);
      if (config.active !== false) {
        active.push(clientId);
      }
    } catch {
      // Skip clients with invalid config
    }
  }

  return active;
}

export async function getAllClientSummaries(): Promise<ClientSummary[]> {
  const clientIds = await listClientIds();
  const summaries: ClientSummary[] = [];

  for (const clientId of clientIds) {
    const config = await getClientConfig(clientId);
    const automations = await getAutomations(clientId);
    const activity = await getActivity(clientId);

    const lastActive =
      activity.length > 0
        ? activity[0].timestamp
        : automations.reduce<string | null>((latest, a) => {
            if (!a.lastRun) return latest;
            if (!latest || a.lastRun > latest) return a.lastRun;
            return latest;
          }, null);

    summaries.push({
      clientId,
      clientName: config.clientName,
      email: config.email,
      plan: config.plan,
      mrr: config.mrr,
      automationsCount: automations.length,
      lastActive,
    });
  }

  return summaries;
}

export async function getRevenueSummary(): Promise<{
  totalMrr: number;
  byTier: Record<string, number>;
}> {
  const summaries = await getAllClientSummaries();
  const byTier: Record<string, number> = {
    starter: 0,
    growth: 0,
    enterprise: 0,
  };

  let totalMrr = 0;
  for (const s of summaries) {
    totalMrr += s.mrr;
    byTier[s.plan] = (byTier[s.plan] ?? 0) + s.mrr;
  }

  return { totalMrr, byTier };
}
