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

const REQUIRED_IDENTITIES = ["staging-ci-deploy-role", "prod-ci-deploy-role"];

const args = process.argv.slice(2);
const hasArg = (flag) => args.includes(flag);

const providerArg = args.find((a) => a.startsWith("--provider="));
const provider = providerArg ? providerArg.split("=")[1] : "generic";

if (hasArg("--help") || hasArg("-h")) {
  console.log(`Usage: node scripts/secret-bootstrap.mjs [--json] [--provider=aws|gcp|azure]\n\nPrint a bootstrap checklist for required cloud identities and secret names.\nNo secret values are read or written.\n\nExamples:\n  node scripts/secret-bootstrap.mjs\n  node scripts/secret-bootstrap.mjs --json\n  node scripts/secret-bootstrap.mjs --provider=aws`);
  process.exit(0);
}

const providerCommands = {
  aws: [
    "aws sts get-caller-identity",
    "aws iam create-role --role-name staging-ci-deploy-role --assume-role-policy-document file://trust-policy.json",
    "aws iam create-role --role-name prod-ci-deploy-role --assume-role-policy-document file://trust-policy.json",
    "aws secretsmanager create-secret --name APP_AUTH_SECRET --secret-string '<set-in-terminal>'",
  ],
  gcp: [
    "gcloud auth list",
    "gcloud iam service-accounts create staging-ci-deploy-role",
    "gcloud iam service-accounts create prod-ci-deploy-role",
    "gcloud secrets create APP_AUTH_SECRET --replication-policy=automatic",
  ],
  azure: [
    "az account show",
    "az ad sp create-for-rbac --name staging-ci-deploy-role",
    "az ad sp create-for-rbac --name prod-ci-deploy-role",
    "az keyvault secret set --vault-name <kv-name> --name APP_AUTH_SECRET --value '<set-in-terminal>'",
  ],
};

if (hasArg("--json")) {
  console.log(
    JSON.stringify(
      {
        provider,
        requiredSecrets: REQUIRED_SECRETS,
        requiredIdentities: REQUIRED_IDENTITIES,
        suggestedCliCommands: providerCommands[provider] ?? [],
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

console.log("Headstash deploy bootstrap checklist (safe metadata only)\n");
console.log(`Provider mode: ${provider}\n`);
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

if (providerCommands[provider]) {
  console.log(`4) Suggested ${provider.toUpperCase()} CLI bootstrap commands:`);
  for (const cmd of providerCommands[provider]) {
    console.log(`   - ${cmd}`);
  }
  console.log("");
} else {
  console.log("4) Wire cloud CLI bootstrap commands for your provider.");
}

console.log("5) Wire GitHub Actions to identity provider (OIDC preferred).");
console.log("6) Share only secret names + principal names in task comments.");
