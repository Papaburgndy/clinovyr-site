import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { ClientConfig, CliOptions } from "./types.js";

function loadEnvFile(): void {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    return;
  }

  const contents = readFileSync(envPath, "utf-8");
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export function parseCliArgs(argv: string[]): CliOptions {
  let clientConfigPath = "configs/client.json";
  let dryRun = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--client" && argv[index + 1]) {
      clientConfigPath = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--client=")) {
      clientConfigPath = arg.slice("--client=".length);
    }
  }

  return { clientConfigPath, dryRun };
}

export function loadClientConfig(configPath: string): ClientConfig {
  loadEnvFile();

  const absolutePath = resolve(process.cwd(), configPath);
  if (!existsSync(absolutePath)) {
    throw new Error(
      `Client config not found at ${absolutePath}. Copy configs/client.example.json to configs/client.json and fill in your keys.`,
    );
  }

  const raw = JSON.parse(readFileSync(absolutePath, "utf-8")) as ClientConfig;

  if (!raw.clientId || !raw.companyName || !raw.hubspotApiKey) {
    throw new Error(
      "Client config must include clientId, companyName, and hubspotApiKey.",
    );
  }

  return raw;
}

export function resolveAnthropicApiKey(config: ClientConfig): string {
  const key = config.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "Anthropic API key not found. Set ANTHROPIC_API_KEY in .env.local or anthropicApiKey in client config.",
    );
  }
  return key;
}
