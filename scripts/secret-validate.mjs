#!/usr/bin/env node

/**
 * Validates required deploy variables are present in the current environment.
 * Does not print values.
 */

const REQUIRED_ENV = [
  "TF_STATE_BACKEND",
  "CLOUD_PROJECT_ID_STAGING",
  "CLOUD_PROJECT_ID_PROD",
  "CI_DEPLOY_ROLE_ARN",
  "APP_DATABASE_URL",
  "APP_AUTH_SECRET",
  "APP_AUTH_URL",
];

const hasArg = (flag) => process.argv.includes(flag);
const isCi = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

if (hasArg("--help") || hasArg("-h")) {
  console.log(`Usage: node scripts/secret-validate.mjs [--ci]\n\nChecks that required deploy environment variables exist.\nOutput is metadata only (present/missing), never secret values.\n\nOptions:\n  --ci   Exit non-zero when variables are missing\n\nExamples:\n  node scripts/secret-validate.mjs\n  node scripts/secret-validate.mjs --ci`);
  process.exit(0);
}

const forceCiMode = hasArg("--ci") || isCi;
const missing = REQUIRED_ENV.filter((name) => {
  const val = process.env[name];
  return !val || !String(val).trim();
});

if (missing.length === 0) {
  console.log("✅ All required deploy variables are present.");
  process.exit(0);
}

console.log("❌ Missing required deploy variables:");
for (const key of missing) {
  console.log(` - ${key}`);
}

if (!forceCiMode) {
  console.log("\nTip: run with --ci to fail fast in local preflight.");
}

process.exit(forceCiMode ? 1 : 0);
