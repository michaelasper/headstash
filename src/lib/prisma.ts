import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makePrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const adapter = new PrismaBetterSqlite3({ url });
  const isDevelopment = process.env.NODE_ENV === "development";

  const prisma = new PrismaClient({
    adapter,
    log: isDevelopment
      ? [{ emit: "event", level: "query" }, "error", "warn"]
      : ["error"],
  });

  if (isDevelopment) {
    const slowQueryThresholdMs = Number(
      process.env.PRISMA_SLOW_QUERY_THRESHOLD_MS ?? 100,
    );

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

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
