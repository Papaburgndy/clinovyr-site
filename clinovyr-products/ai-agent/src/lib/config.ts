import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ClientConfig } from "../types.js";

const configDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../config/clients",
);

export function getConfigPath(clientId: string): string {
  return join(configDir, `${clientId}.json`);
}

export function loadClientConfig(clientId: string): ClientConfig | null {
  const path = getConfigPath(clientId);
  if (!existsSync(path)) {
    return null;
  }
  const raw = readFileSync(path, "utf-8");
  const parsed = JSON.parse(raw) as ClientConfig;
  return { ...parsed, clientId };
}
