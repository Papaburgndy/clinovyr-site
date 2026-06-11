import { AsyncLocalStorage } from "node:async_hooks";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaPg } from "@prisma/adapter-pg";
// Edge entry avoids bundling query_compiler_fast_bg.wasm-base64.js (~4.7 MiB) into the Worker.
import { PrismaClient } from "@prisma/client/edge";
import { Pool } from "pg";

const BUILD_PLACEHOLDER_DATABASE_URL =
  "postgresql://build:build@localhost:5432/build";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

/**
 * Per-request scope for Prisma on Cloudflare Workers.
 *
 * A PrismaClient holds a pg socket, and workerd forbids using I/O objects
 * created during one request from a different request — a cached global
 * client makes every isolate serve exactly one successful request and then
 * hang ("Worker's code had hung" / error 1101). So in production each
 * request gets its own client, memoized for the duration of that request.
 *
 * - In the Next.js site worker, OpenNext's getCloudflareContext().ctx is a
 *   unique per-request object we can key on.
 * - In the standalone deliverables worker, the fetch handler wraps its work
 *   in prismaRequestScope.run({}, ...) to provide the per-request key.
 * - Outside any request (build, scripts, dev server) we fall back to the
 *   traditional global singleton, which is correct there.
 */
export const prismaRequestScope = new AsyncLocalStorage<object>();

const prismaByRequest = new WeakMap<object, PrismaClient>();

function getRequestScopeKey(): object | null {
  const manual = prismaRequestScope.getStore();
  if (manual) return manual;

  try {
    // Throws outside an OpenNext request (deliverables worker, build, scripts).
    return getCloudflareContext().ctx ?? null;
  } catch {
    return null;
  }
}

function isNextProductionBuild(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    (process.env.CI === "true" && process.env.NODE_ENV === "production")
  );
}

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (isNextProductionBuild()) {
    return BUILD_PLACEHOLDER_DATABASE_URL;
  }

  throw new Error("DATABASE_URL is not set");
}

function createPrismaClient(): PrismaClient {
  const connectionString = resolveDatabaseUrl();

  const pool = globalForPrisma.pgPool ?? new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
  }

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

function getPrismaClient(): PrismaClient {
  // Dev / build / scripts: classic global singleton (Node keeps sockets fine).
  if (process.env.NODE_ENV !== "production") {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return globalForPrisma.prisma;
  }

  const key = getRequestScopeKey();

  if (!key) {
    // No request context available (e.g. build-time prerender) — fall back
    // to the global singleton; there is no cross-request reuse risk there.
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return globalForPrisma.prisma;
  }

  let client = prismaByRequest.get(key);
  if (!client) {
    client = createPrismaClient();
    prismaByRequest.set(key, client);
  }
  return client;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client) as unknown;
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
