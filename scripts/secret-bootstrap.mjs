#!/usr/bin/env node

/**
 * Prints a non-sensitive checklist for cloud identity + secret bootstrap.
 * Optional AWS apply mode creates placeholder secret entries (names only) via AWS CLI.
 * This script intentionally never reads real secret values.
 */

import { execSync } from "node:child_process";

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

function getArgValue(flag, fallback) {
  const direct = args.find((a) => a.startsWith(`${flag}=`));
  if (direct) return direct.slice(flag.length + 1);

  const i = args.indexOf(flag);
  if (i >= 0 && args[i + 1] && !args[i + 1].startsWith("-")) {
    return args[i + 1];
  }

  return fallback;
}

const provider = getArgValue("--provider", "generic");
const awsRegion = getArgValue("--aws-region", "us-east-1");
const awsProfile = getArgValue("--aws-profile", "");
const awsSecretPrefixRaw = getArgValue("--aws-secret-prefix", "/headstash");
const shouldApply = hasArg("--apply");

const supportedProviders = ["generic", "aws", "gcp", "azure"];
if (!supportedProviders.includes(provider)) {
  console.error(
    `Unsupported provider '${provider}'. Valid values: ${supportedProviders.join(", ")}`,
  );
  process.exit(1);
}

if (hasArg("--help") || hasArg("-h")) {
  console.log(`Usage: node scripts/secret-bootstrap.mjs [options]

Print a bootstrap checklist for required cloud identities and secret names.
No real secret values are read or written by default.

Options:
  --json                          Output JSON
  --provider=aws|gcp|azure|generic
  --aws-region=<region>           AWS region for secret-manager commands (default: us-east-1)
  --aws-profile=<profile>         Optional AWS CLI profile to use
  --aws-secret-prefix=<prefix>    Prefix/path for AWS secret names (default: /headstash)
  --apply                         AWS-only: create placeholder secret entries via AWS CLI

Examples:
  node scripts/secret-bootstrap.mjs
  node scripts/secret-bootstrap.mjs --json
  node scripts/secret-bootstrap.mjs --provider=aws --aws-region=us-east-1
  node scripts/secret-bootstrap.mjs --provider=aws --apply --aws-profile=prod-admin`);
  process.exit(0);
}

function normalizeAwsPrefix(input) {
  const trimmed = (input || "").trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

const awsSecretPrefix = normalizeAwsPrefix(awsSecretPrefixRaw);

function awsSecretName(secretName) {
  return awsSecretPrefix ? `${awsSecretPrefix}/${secretName}` : secretName;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

function buildAwsCommands() {
  const profileFlag = awsProfile ? `--profile ${awsProfile}` : "";
  const base = `aws ${profileFlag}`.trim();

  const identityCommands = [
    `${base} sts get-caller-identity --output json`,
    `${base} iam get-open-id-connect-provider --open-id-connect-provider-arn <github-oidc-provider-arn>`,
    `${base} iam get-role --role-name staging-ci-deploy-role >/dev/null 2>&1 || ${base} iam create-role --role-name staging-ci-deploy-role --assume-role-policy-document file://infra/iam/github-oidc-trust-policy-staging.json`,
    `${base} iam get-role --role-name prod-ci-deploy-role >/dev/null 2>&1 || ${base} iam create-role --role-name prod-ci-deploy-role --assume-role-policy-document file://infra/iam/github-oidc-trust-policy-prod.json`,
  ];

  const createSecretCommands = REQUIRED_SECRETS.map((secret) => {
    const name = awsSecretName(secret);
    const placeholder = JSON.stringify({ bootstrap: "REPLACE_ME" });

    return `${base} secretsmanager describe-secret --region ${awsRegion} --secret-id ${shellQuote(
      name,
    )} >/dev/null 2>&1 || ${base} secretsmanager create-secret --region ${awsRegion} --name ${shellQuote(
      name,
    )} --description ${shellQuote(
      `Headstash bootstrap placeholder for ${secret}`,
    )} --secret-string ${shellQuote(placeholder)}`;
  });

  const updateSecretCommands = REQUIRED_SECRETS.map((secret) => {
    const name = awsSecretName(secret);

    return `${base} secretsmanager put-secret-value --region ${awsRegion} --secret-id ${shellQuote(
      name,
    )} --secret-string ${shellQuote("<SET_REAL_VALUE_IN_TERMINAL>")}`;
  });

  return {
    identityCommands,
    createSecretCommands,
    updateSecretCommands,
    allSuggestedCommands: [...identityCommands, ...createSecretCommands],
    applyCommands: createSecretCommands,
  };
}

const providerCommands = {
  generic: [],
  aws: buildAwsCommands().allSuggestedCommands,
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
  const awsDetails = provider === "aws" ? buildAwsCommands() : null;
  console.log(
    JSON.stringify(
      {
        provider,
        requiredSecrets: REQUIRED_SECRETS,
        requiredIdentities: REQUIRED_IDENTITIES,
        awsRegion: provider === "aws" ? awsRegion : undefined,
        awsSecretPrefix: provider === "aws" ? awsSecretPrefix : undefined,
        suggestedCliCommands: providerCommands[provider] ?? [],
        awsCreateSecretCommands: awsDetails?.createSecretCommands,
        awsPutSecretValueCommands: awsDetails?.updateSecretCommands,
        applyMode: shouldApply,
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

console.log("3) Configure these secret names in your secret manager:");
for (const secret of REQUIRED_SECRETS) {
  if (provider === "aws") {
    console.log(`   - ${awsSecretName(secret)}`);
  } else {
    console.log(`   - ${secret}`);
  }
}
console.log("");

if (providerCommands[provider]?.length) {
  console.log(`4) Suggested ${provider.toUpperCase()} CLI bootstrap commands:`);
  for (const cmd of providerCommands[provider]) {
    console.log(`   - ${cmd}`);
  }
  console.log("");

  if (provider === "aws") {
    console.log(
      "5) Set real secret values after placeholder creation (do not store values in git/history):",
    );
    for (const cmd of buildAwsCommands().updateSecretCommands) {
      console.log(`   - ${cmd}`);
    }
    console.log("");
  }
} else {
  console.log("4) Wire cloud CLI bootstrap commands for your provider.\n");
}

console.log("6) Wire GitHub Actions to identity provider (OIDC preferred).");
console.log("7) Share only secret names + principal names in task comments.");

if (provider === "aws" && shouldApply) {
  const { applyCommands } = buildAwsCommands();

  console.log("\nApplying AWS secret-name bootstrap with placeholder values...");
  for (const command of applyCommands) {
    console.log(`$ ${command}`);
    execSync(command, { stdio: "inherit" });
  }

  console.log("\nAWS placeholder secret bootstrap complete.");
  console.log(
    "Next: run the printed put-secret-value commands to set real values in a secure terminal session.",
  );
}
