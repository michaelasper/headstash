import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./e2e.db",
});

const prisma = new PrismaClient({ adapter });

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("signed-out users are redirected away from review mutation routes", async ({ page }) => {
  await page.goto("/reviews/new");
  await expect(page).toHaveURL(/\/auth\/signin/);

  await page.goto("/reviews/seed_review_alice_blue_dream/edit");
  await expect(page).toHaveURL(/\/auth\/signin/);

  await page.goto("/reviews/seed_review_bob_northern_lights/edit");
  await expect(page).toHaveURL(/\/auth\/signin/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("authenticated user cannot open edit screen for another user's review", async ({ page }) => {
  const sessionToken = `e2e-session-${Date.now()}`;

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

  await page.goto("/reviews/seed_review_bob_northern_lights/edit");
  await expect(page).toHaveURL(/\/reviews/);
  await expect(page.getByRole("heading", { name: "Reviews" })).toBeVisible();

  await prisma.session.deleteMany({ where: { sessionToken } });
});
