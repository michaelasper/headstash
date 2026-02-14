import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makePrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: env.DATABASE_URL });
  const isDevelopment = env.NODE_ENV === "development";

  const prisma = new PrismaClient({
    adapter,
    log: isDevelopment
      ? [{ emit: "event", level: "query" }, "error", "warn"]
      : ["error"],
  });

  if (isDevelopment) {
    const slowQueryThresholdMs = env.PRISMA_SLOW_QUERY_THRESHOLD_MS;

    prisma.$on("query", (event) => {
      if (event.duration < slowQueryThresholdMs) return;

      console.warn("[prisma:slow-query]", {
        durationMs: event.duration,
        thresholdMs: slowQueryThresholdMs,
        query: event.query,
        params: event.params,
      });
    });
  }

  return prisma;
}

export const prisma = globalForPrisma.prisma ?? makePrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
