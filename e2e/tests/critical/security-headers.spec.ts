import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./e2e.db",
});

const prisma = new PrismaClient({ adapter });

const commonHeaderAssertions = (headers: Record<string, string>) => {
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
};

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("security headers are present on representative public routes", async ({ request }) => {
  for (const route of ["/", "/posts", "/auth/signin"]) {
    const response = await request.get(route);
    expect(response.ok()).toBeTruthy();

    commonHeaderAssertions(response.headers());
  }
});

test("security headers are present on authenticated route", async ({ page }) => {
  const sessionToken = `e2e-security-headers-${Date.now()}`;

  await prisma.session.create({
    data: {
      sessionToken,
      userId: "seed_user_alice",
      expires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  await page.context().addCookies([
    {
      name: "next-auth.session-token",
      value: sessionToken,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const response = await page.goto("/me");
  expect(response).not.toBeNull();

  const headers = response!.headers();
  commonHeaderAssertions(headers);

  if (process.env.NODE_ENV === "production") {
    expect(headers["strict-transport-security"]).toContain("max-age=");
  }

  await prisma.session.deleteMany({ where: { sessionToken } });
});
