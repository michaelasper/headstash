import { test as setup } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../.auth/user.json");

setup("auth setup scaffold", async ({ page }) => {
  // Placeholder scaffold for real login flow.
  // Replace with actual sign-in steps once credentials/fixtures are wired.
  await page.goto("/");
  await page.context().storageState({ path: authFile });
});
