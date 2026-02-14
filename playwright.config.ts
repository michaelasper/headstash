import { defineConfig, devices } from "@playwright/test";

const e2eServerEnv = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL ?? "file:./e2e.db",
  AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-secret",
  AUTH_URL: process.env.AUTH_URL ?? "http://127.0.0.1:3000",
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "e2e-secret",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000",
};

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run db:generate && npm run db:deploy && npm run db:seed && npm run dev",
    env: e2eServerEnv,
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 300_000,
  },
  projects: [
    {
      name: "setup",
      testDir: "./e2e/fixtures",
      testMatch: "auth.setup.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
});
