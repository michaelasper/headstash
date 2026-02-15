import { expect, test } from "@playwright/test";

test("signed-out users are redirected away from review mutation routes", async ({ page }) => {
  await page.goto("/reviews/new");
  await expect(page).toHaveURL(/\/auth\/signin/);

  await page.goto("/reviews/seed_review_alice_blue_dream/edit");
  await expect(page).toHaveURL(/\/auth\/signin/);

  await page.goto("/reviews/seed_review_bob_northern_lights/edit");
  await expect(page).toHaveURL(/\/auth\/signin/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});
