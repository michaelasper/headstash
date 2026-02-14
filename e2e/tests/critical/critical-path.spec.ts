import { expect, test } from "@playwright/test";

test("login flow entry page renders credential controls", async ({ page }) => {
  await page.goto("/auth/signin");

  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email", exact: true })).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("global feed loads with social navigation affordances", async ({ page }) => {
  await page.goto("/posts");

  await expect(page.getByRole("heading", { name: "Posts" })).toBeVisible();
  const main = page.getByRole("main");
  await expect(main.getByRole("link", { name: "Global" })).toBeVisible();
  await expect(main.getByRole("link", { name: "Following" })).toBeVisible();
});

test("post interaction path routes signed-out user to auth", async ({ page }) => {
  await page.goto("/posts");

  const reactSignInLink = page.getByRole("link", { name: "Sign in to react" }).first();
  const composeSignInLink = page.getByRole("link", { name: "Sign in" }).first();

  if (await reactSignInLink.count()) {
    await reactSignInLink.click();
  } else {
    await composeSignInLink.click();
  }

  await expect(page).toHaveURL(/\/auth\/signin/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});
