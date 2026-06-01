import { Client } from "@hubspot/api-client";
import type { ApiCallRecord } from "./types.js";

export function createHubSpotClient(accessToken: string): Client {
  return new Client({
    accessToken,
    numberOfApiCallRetries: 3,
  });
}

export function formatHubSpotError(error: unknown): string {
  if (error instanceof Error) {
    const body = (error as Error & { body?: unknown }).body;
    if (body && typeof body === "object" && "message" in body) {
      return `${error.message}: ${String((body as { message: unknown }).message)}`;
    }
    return error.message;
  }

  return String(error);
}

export async function safeHubSpotCall<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<{ data?: T; error?: string }> {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    return { error: `${label}: ${formatHubSpotError(error)}` };
  }
}

export function recordApiCall(
  apiCalls: ApiCallRecord[],
  record: ApiCallRecord,
): void {
  apiCalls.push(record);
}

export async function fetchWorkflows(client: Client): Promise<unknown> {
  const response = await client.apiRequest({
    method: "GET",
    path: "/automation/v4/flows",
    qs: { limit: 100 },
  });

  if (!response.ok) {
    const legacyResponse = await client.apiRequest({
      method: "GET",
      path: "/automation/v3/workflows",
      qs: { limit: 100 },
    });

    if (!legacyResponse.ok) {
      throw new Error(
        `Workflow API unavailable (v4: ${response.status}, v3: ${legacyResponse.status}). Workflows must be reviewed manually in HubSpot.`,
      );
    }

    return legacyResponse.json();
  }

  return response.json();
}
