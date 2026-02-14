import { expect, test } from "@playwright/test";

test("home page renders key navigation", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Headstash" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse posts" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse reviews" })).toBeVisible();
});
