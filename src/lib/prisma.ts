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
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
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
