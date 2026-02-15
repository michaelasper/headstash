import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";
import sharp from "sharp";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./e2e.db",
});

const prisma = new PrismaClient({ adapter });

async function createValidPngBuffer() {
  return sharp({
    create: {
      width: 8,
      height: 8,
      channels: 3,
      background: { r: 78, g: 112, b: 214 },
    },
  })
    .png()
    .toBuffer();
}

const pngMagicOnlyPolyglot = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from("<script>alert('x')</script>", "utf8"),
]);

function authCookie(sessionToken: string) {
  return `next-auth.session-token=${sessionToken}`;
}

test.afterAll(async () => {
  await prisma.session.deleteMany({ where: { sessionToken: { startsWith: "e2e-avatar-hardening-" } } });
  await prisma.user.update({ where: { id: "seed_user_alice" }, data: { avatarUrl: null } });
  await prisma.$disconnect();
});

test("accepts valid avatar upload, re-encodes, and stores private-served path", async ({ request }) => {
  const sessionToken = `e2e-avatar-hardening-${Date.now()}`;
  const validPng = await createValidPngBuffer();

  await prisma.session.create({
    data: {
      sessionToken,
      userId: "seed_user_alice",
      expires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const response = await request.post("/api/profile/avatar", {
    headers: { cookie: authCookie(sessionToken) },
    multipart: {
      avatar: {
        name: "avatar.png",
        mimeType: "image/png",
        buffer: validPng,
      },
    },
  });

  const payload = (await response.json()) as
    | { ok: true; avatarUrl: string }
    | { ok: false; error: string };
  expect(response.ok(), `status=${response.status()} payload=${JSON.stringify(payload)}`).toBeTruthy();
  if (!payload.ok) {
    throw new Error(`Expected success payload but received error: ${payload.error}`);
  }

  expect(payload.avatarUrl).toMatch(/^\/api\/profile\/avatar\/seed_user_alice-[A-Za-z0-9-]+\.webp$/);

  const stored = await prisma.user.findUnique({
    where: { id: "seed_user_alice" },
    select: { avatarUrl: true },
  });
  expect(stored?.avatarUrl).toBe(payload.avatarUrl);

  const imageResponse = await request.get(payload.avatarUrl);
  expect(imageResponse.ok()).toBeTruthy();
  expect(imageResponse.headers()["content-type"]).toContain("image/webp");
});

test("rejects MIME mismatch and malformed polyglot payloads", async ({ request }) => {
  const sessionToken = `e2e-avatar-hardening-${Date.now()}-reject`;
  const validPng = await createValidPngBuffer();

  await prisma.session.create({
    data: {
      sessionToken,
      userId: "seed_user_alice",
      expires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const mismatchedMime = await request.post("/api/profile/avatar", {
    headers: { cookie: authCookie(sessionToken) },
    multipart: {
      avatar: {
        name: "avatar.jpg",
        mimeType: "image/jpeg",
        buffer: validPng,
      },
    },
  });

  expect(mismatchedMime.status()).toBe(400);
  const mismatchPayload = (await mismatchedMime.json()) as { ok: boolean; error: string };
  expect(mismatchPayload.ok).toBeFalsy();
  expect(mismatchPayload.error).toContain("does not match file signature");

  const polyglot = await request.post("/api/profile/avatar", {
    headers: { cookie: authCookie(sessionToken) },
    multipart: {
      avatar: {
        name: "polyglot.png",
        mimeType: "image/png",
        buffer: pngMagicOnlyPolyglot,
      },
    },
  });

  expect(polyglot.status()).toBe(400);
  const polyglotPayload = (await polyglot.json()) as { ok: boolean; error: string };
  expect(polyglotPayload.ok).toBeFalsy();
  expect(polyglotPayload.error).toMatch(/safely processed|unsupported image signature/i);
});
