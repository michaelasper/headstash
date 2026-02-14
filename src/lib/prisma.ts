import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function reportSlowQuery(event: { duration: number; query: string; params: string }) {
  const slowQueryThresholdMs = env.PRISMA_SLOW_QUERY_THRESHOLD_MS;
  if (event.duration < slowQueryThresholdMs) return;

  const includeQuery = env.PRISMA_LOG_INCLUDE_QUERY;
  const format = env.PRISMA_LOG_FORMAT;

  if (format === "json") {
    console.warn(
      JSON.stringify({
        level: "warn",
        source: "prisma",
        event: "slow_query",
        durationMs: event.duration,
        thresholdMs: slowQueryThresholdMs,
        query: includeQuery ? event.query : undefined,
        params: includeQuery ? event.params : undefined,
      }),
    );
    return;
  }

  console.warn("[prisma:slow-query]", {
    durationMs: event.duration,
    thresholdMs: slowQueryThresholdMs,
    query: includeQuery ? event.query : "<redacted; set PRISMA_LOG_INCLUDE_QUERY=1>",
    params: includeQuery ? event.params : "<redacted; set PRISMA_LOG_INCLUDE_QUERY=1>",
  });
}

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
    prisma.$on("query", (event) => {
      reportSlowQuery({
        duration: event.duration,
        query: event.query,
        params: event.params,
      });
    });
  }

  return prisma;
}

export const prisma = globalForPrisma.prisma ?? makePrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
