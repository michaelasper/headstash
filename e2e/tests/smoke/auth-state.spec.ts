import { expect, test } from "../../fixtures/test-data.fixture";

test("authenticated project reuses storage state without login UI", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Headstash" })).toBeVisible();
  // Auth setup scaffold should allow tests to run without per-test sign-in flow.
  await expect(page.getByRole("link", { name: "Your account" })).toBeVisible();
});

test("data fixture is available for setup/cleanup helpers", async ({ dataApi }) => {
  expect(dataApi).toBeTruthy();
});
