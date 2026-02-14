#!/usr/bin/env node

/**
 * Prints a non-sensitive checklist for cloud identity + secret bootstrap.
 * This intentionally never handles secret values.
 */

const REQUIRED_SECRETS = [
  "TF_STATE_BACKEND",
  "CLOUD_PROJECT_ID_STAGING",
  "CLOUD_PROJECT_ID_PROD",
  "CI_DEPLOY_ROLE_ARN",
  "APP_DATABASE_URL",
  "APP_AUTH_SECRET",
  "APP_AUTH_URL",
];

const REQUIRED_IDENTITIES = [
  "staging-ci-deploy-role",
  "prod-ci-deploy-role",
];

const hasArg = (flag) => process.argv.includes(flag);

if (hasArg("--help") || hasArg("-h")) {
  console.log(`Usage: node scripts/secret-bootstrap.mjs [--json]\n\nPrint a bootstrap checklist for required cloud identities and secret names.\nNo secret values are read or written.\n\nExamples:\n  node scripts/secret-bootstrap.mjs\n  node scripts/secret-bootstrap.mjs --json`);
  process.exit(0);
}

if (hasArg("--json")) {
  console.log(
    JSON.stringify(
      {
        requiredSecrets: REQUIRED_SECRETS,
        requiredIdentities: REQUIRED_IDENTITIES,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

console.log("Headstash deploy bootstrap checklist (safe metadata only)\n");
console.log("1) Provision cloud projects/environments:");
console.log("   - staging");
console.log("   - production\n");

console.log("2) Create least-privilege CI identities:");
for (const identity of REQUIRED_IDENTITIES) {
  console.log(`   - ${identity}`);
}
console.log("");

console.log("3) Add these secret NAMES in your secret manager:");
for (const secret of REQUIRED_SECRETS) {
  console.log(`   - ${secret}`);
}
console.log("");

console.log("4) Wire GitHub Actions to identity provider (OIDC preferred).");
console.log("5) Share only secret names + principal names in task comments.");
