import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";

type HeaderValue = string | string[] | undefined;

type HeaderRecord = Record<string, HeaderValue>;

type CheckRateLimitInput = {
  scope: string;
  identity: string;
  ip?: string | null;
  windowMs?: number;
  max?: number;
};

function normalizeIdentity(identity: string) {
  return identity.trim().toLowerCase();
}

function normalizeIp(ip?: string | null) {
  if (!ip) return "unknown";

  const first = ip.split(",")[0]?.trim();
  if (!first) return "unknown";

  return first.toLowerCase();
}

function readHeader(headers: Headers | HeaderRecord, name: string): string | undefined {
  if (headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }

  const direct = headers[name];
  if (Array.isArray(direct)) return direct[0];
  if (typeof direct === "string") return direct;

  const lower = headers[name.toLowerCase()];
  if (Array.isArray(lower)) return lower[0];
  if (typeof lower === "string") return lower;

  return undefined;
}

function extractHeaders(source: unknown): Headers | HeaderRecord | null {
  if (!source) return null;

  if (source instanceof Request) {
    return source.headers;
  }

  if (typeof source === "object" && source !== null && "headers" in source) {
    const candidate = (source as { headers?: unknown }).headers;

    if (candidate instanceof Headers) {
      return candidate;
    }

    if (candidate && typeof candidate === "object") {
      return candidate as HeaderRecord;
    }
  }

  return null;
}

export function resolveClientIp(source: unknown): string {
  const headers = extractHeaders(source);
  if (!headers) return "unknown";

  const forwarded = readHeader(headers, "x-forwarded-for");
  if (forwarded) return normalizeIp(forwarded);

  const realIp = readHeader(headers, "x-real-ip");
  return normalizeIp(realIp);
}

function buildBucketKey({ scope, identity, ip }: { scope: string; identity: string; ip: string }) {
  return `${scope}:${normalizeIdentity(identity)}:${normalizeIp(ip)}`;
}

export async function checkRateLimit(input: CheckRateLimitInput) {
  const windowMs = input.windowMs ?? 60_000;
  const max = input.max ?? 8;

  const windowSec = Math.max(1, Math.floor(windowMs / 1000));
  const nowSec = Math.floor(Date.now() / 1000);
  const windowStartSec = Math.floor(nowSec / windowSec) * windowSec;
  const expiresAtSec = windowStartSec + windowSec;

  const bucketKey = buildBucketKey({
    scope: input.scope,
    identity: input.identity,
    ip: input.ip ?? "unknown",
  });

  await prisma.$executeRaw`
    DELETE FROM "RateLimitBucket"
    WHERE "expiresAt" <= ${new Date(nowSec * 1000)}
  `;

  const now = new Date();
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitBucket"
      ("id", "bucketKey", "windowStartSec", "count", "expiresAt", "createdAt", "updatedAt")
    VALUES
      (${randomUUID()}, ${bucketKey}, ${windowStartSec}, 1, ${new Date(expiresAtSec * 1000)}, ${now}, ${now})
    ON CONFLICT ("bucketKey", "windowStartSec")
    DO UPDATE SET
      "count" = "RateLimitBucket"."count" + 1,
      "updatedAt" = ${now}
    RETURNING "count"
  `;

  const count = Number(rows[0]?.count ?? 0);
  const remaining = Math.max(0, max - count);

  return {
    ok: count <= max,
    remaining,
    resetAtMs: expiresAtSec * 1000,
  };
}
