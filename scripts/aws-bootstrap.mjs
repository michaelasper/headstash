#!/usr/bin/env node

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const hasArg = (flag) => args.includes(flag);

function getArgValue(flag, fallback = undefined) {
  const inline = args.find((a) => a.startsWith(`${flag}=`));
  if (inline) return inline.slice(flag.length + 1);

  const idx = args.indexOf(flag);
  if (idx >= 0 && args[idx + 1] && !args[idx + 1].startsWith("-")) {
    return args[idx + 1];
  }

  return fallback;
}

function shellQuote(value) {
  return `'${String(value ?? "").replace(/'/g, `'"'"'`)}'`;
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function printHelp() {
  console.log(`Usage: node scripts/aws-bootstrap.mjs [--plan|--apply] [options]

Idempotent AWS bootstrap scaffold for CI/CD foundations:
- Terraform backend bucket (S3) + secure settings
- Terraform lock table (DynamoDB)
- GitHub OIDC provider
- Staging/production deploy IAM roles + baseline inline policy scaffolding

Options:
  --plan                           Plan mode (default)
  --apply                          Apply mode (executes AWS CLI mutations)
  --json                           Print full JSON payload
  --out=<path>                     Output artifact path (default: artifacts/aws-bootstrap.json)

  --repo=<owner/name>              GitHub repo slug (default: $GITHUB_REPOSITORY or michaelasper/headstash)
  --region=<aws-region>            AWS region (default: $AWS_REGION or us-east-1)
  --profile=<aws-profile>          Optional AWS CLI profile
  --account-id=<id>                Optional AWS account id (auto-resolved in apply mode)

  --state-bucket=<name>            S3 bucket for terraform state
  --lock-table=<name>              DynamoDB table for terraform lock
  --state-key-prefix=<prefix>      State key prefix (default: headstash)

  --oidc-url=<url>                 OIDC provider URL (default: token.actions.githubusercontent.com)
  --oidc-audience=<aud>            OIDC audience (default: sts.amazonaws.com)
  --oidc-thumbprint=<thumbprint>   OIDC thumbprint (default: GitHub Actions thumbprint)

  --staging-role-name=<name>       IAM role for staging deploys
  --production-role-name=<name>    IAM role for production deploys
  --staging-policy-name=<name>     Inline policy name for staging role (default: HeadstashDeployBaseline)
  --production-policy-name=<name>  Inline policy name for production role (default: HeadstashDeployBaseline)

Examples:
  node scripts/aws-bootstrap.mjs --plan --json
  node scripts/aws-bootstrap.mjs --apply --profile=prod-admin --region=us-east-1
  node scripts/aws-bootstrap.mjs --plan --account-id=123456789012 --repo=michaelasper/headstash`);
}

if (hasArg("--help") || hasArg("-h")) {
  printHelp();
  process.exit(0);
}

const mode = hasArg("--apply") ? "apply" : "plan";
const outputJson = hasArg("--json");

const repo = getArgValue("--repo", process.env.GITHUB_REPOSITORY || "michaelasper/headstash");
const region = getArgValue("--region", process.env.AWS_REGION || "us-east-1");
const profile = getArgValue("--profile", "");
let accountId = getArgValue("--account-id", "");

const repoSlug = slug(repo.replace("/", "-"));
const stateBucket = getArgValue("--state-bucket", `headstash-tf-state-${repoSlug}`);
const lockTable = getArgValue("--lock-table", "headstash-terraform-locks");
const stateKeyPrefix = getArgValue("--state-key-prefix", "headstash");

const oidcUrl = getArgValue("--oidc-url", "token.actions.githubusercontent.com").replace(/^https:\/\//, "");
const oidcAudience = getArgValue("--oidc-audience", "sts.amazonaws.com");
const oidcThumbprint = getArgValue("--oidc-thumbprint", "6938fd4d98bab03faadb97b34396831e3780aea1");

const stagingRoleName = getArgValue("--staging-role-name", "HeadstashDeployStaging");
const productionRoleName = getArgValue("--production-role-name", "HeadstashDeployProduction");
const stagingPolicyName = getArgValue("--staging-policy-name", "HeadstashDeployBaseline");
const productionPolicyName = getArgValue("--production-policy-name", "HeadstashDeployBaseline");

const outPath = getArgValue("--out", "artifacts/aws-bootstrap.json");

const steps = [];
const warnings = [];

function addStep(resource, action, status, details = undefined) {
  steps.push({
    at: new Date().toISOString(),
    resource,
    action,
    status,
    ...(details ? { details } : {}),
  });
}

function awsExec(command, { parseJson = true, allowFailure = false } = {}) {
  const profileArg = profile ? `--profile ${shellQuote(profile)}` : "";
  const fullCommand = `aws ${profileArg} --region ${shellQuote(region)} ${command}`.replace(/\s+/g, " ").trim();

  try {
    const out = execSync(fullCommand, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();

    if (!parseJson) return out;
    if (!out) return {};
    return JSON.parse(out);
  } catch (error) {
    if (allowFailure) {
      return {
        __error: true,
        code: error.status ?? 1,
        stderr: String(error.stderr || error.message || "").trim(),
      };
    }
    throw error;
  }
}

function roleArn(name) {
  const acct = accountId || "<account-id>";
  return `arn:aws:iam::${acct}:role/${name}`;
}

function oidcProviderArn() {
  const acct = accountId || "<account-id>";
  return `arn:aws:iam::${acct}:oidc-provider/${oidcUrl}`;
}

function requireAwsCliIfApply() {
  if (mode !== "apply") return;
  try {
    execSync("aws --version", { stdio: ["ignore", "pipe", "pipe"] });
    addStep("aws-cli", "verify", "ok");
  } catch {
    addStep("aws-cli", "verify", "failed", "aws CLI not found");
    throw new Error("aws CLI is required for --apply mode");
  }
}

function resolveAccountIdIfNeeded() {
  if (accountId) {
    addStep("sts", "get-caller-identity", "ok", "using provided --account-id");
    return;
  }

  if (mode !== "apply") {
    warnings.push("No --account-id provided in plan mode; output ARNs use <account-id> placeholder.");
    addStep("sts", "get-caller-identity", "skipped", "plan mode without --account-id");
    return;
  }

  const identity = awsExec("sts get-caller-identity --output json");
  accountId = identity.Account;
  addStep("sts", "get-caller-identity", "ok", `resolved account ${accountId}`);
}

function ensureStateBucket() {
  const existsResp = awsExec(`s3api head-bucket --bucket ${shellQuote(stateBucket)}`, {
    parseJson: false,
    allowFailure: true,
  });

  const exists = !(existsResp && existsResp.__error);

  if (!exists && mode === "apply") {
    const createCmd =
      region === "us-east-1"
        ? `s3api create-bucket --bucket ${shellQuote(stateBucket)}`
        : `s3api create-bucket --bucket ${shellQuote(stateBucket)} --create-bucket-configuration ${shellQuote(JSON.stringify({ LocationConstraint: region }))}`;
    awsExec(createCmd, { parseJson: false });
    addStep("s3-backend", "create-bucket", "ok", stateBucket);
  } else {
    addStep("s3-backend", "create-bucket", exists ? "already-exists" : "planned", stateBucket);
  }

  if (mode === "apply") {
    awsExec(
      `s3api put-public-access-block --bucket ${shellQuote(stateBucket)} --public-access-block-configuration ${shellQuote(
        JSON.stringify({
          BlockPublicAcls: true,
          IgnorePublicAcls: true,
          BlockPublicPolicy: true,
          RestrictPublicBuckets: true,
        }),
      )}`,
      { parseJson: false },
    );
    awsExec(
      `s3api put-bucket-versioning --bucket ${shellQuote(stateBucket)} --versioning-configuration ${shellQuote(
        JSON.stringify({ Status: "Enabled" }),
      )}`,
      { parseJson: false },
    );
    awsExec(
      `s3api put-bucket-encryption --bucket ${shellQuote(stateBucket)} --server-side-encryption-configuration ${shellQuote(
        JSON.stringify({
          Rules: [
            {
              ApplyServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" },
              BucketKeyEnabled: true,
            },
          ],
        }),
      )}`,
      { parseJson: false },
    );
    addStep("s3-backend", "secure-settings", "ok", "public-access-block + versioning + encryption");
  } else {
    addStep("s3-backend", "secure-settings", "planned", "public-access-block + versioning + encryption");
  }
}

function ensureLockTable() {
  const describe = awsExec(`dynamodb describe-table --table-name ${shellQuote(lockTable)} --output json`, {
    allowFailure: true,
  });

  const exists = !(describe && describe.__error);

  if (!exists && mode === "apply") {
    awsExec(
      `dynamodb create-table --table-name ${shellQuote(lockTable)} --attribute-definitions ${shellQuote(
        JSON.stringify([{ AttributeName: "LockID", AttributeType: "S" }]),
      )} --key-schema ${shellQuote(JSON.stringify([{ AttributeName: "LockID", KeyType: "HASH" }]))} --billing-mode PAY_PER_REQUEST --output json`,
    );
    awsExec(`dynamodb wait table-exists --table-name ${shellQuote(lockTable)}`, { parseJson: false });
    addStep("dynamodb-lock", "create-table", "ok", lockTable);
  } else {
    addStep("dynamodb-lock", "create-table", exists ? "already-exists" : "planned", lockTable);
  }
}

function ensureOidcProvider() {
  if (!accountId && mode !== "apply") {
    addStep("github-oidc", "ensure-provider", "planned", "account id unavailable in plan mode");
    return;
  }

  const list = awsExec("iam list-open-id-connect-providers --output json", { allowFailure: mode !== "apply" });
  let foundArn = "";

  if (list?.OpenIDConnectProviderList?.length) {
    for (const entry of list.OpenIDConnectProviderList) {
      const details = awsExec(
        `iam get-open-id-connect-provider --open-id-connect-provider-arn ${shellQuote(entry.Arn)} --output json`,
        { allowFailure: true },
      );
      if (!details?.__error && details.Url === oidcUrl) {
        foundArn = entry.Arn;
        break;
      }
    }
  }

  if (!foundArn && mode === "apply") {
    const created = awsExec(
      `iam create-open-id-connect-provider --url ${shellQuote(`https://${oidcUrl}`)} --client-id-list ${shellQuote(oidcAudience)} --thumbprint-list ${shellQuote(oidcThumbprint)} --output json`,
    );
    foundArn = created.OpenIDConnectProviderArn;
    addStep("github-oidc", "create-provider", "ok", foundArn);
  } else {
    addStep("github-oidc", "create-provider", foundArn ? "already-exists" : "planned", foundArn || oidcProviderArn());
  }
}

function buildTrustPolicy({ environment }) {
  const oidcHost = oidcUrl;
  const sub = `repo:${repo}:environment:${environment}`;

  return {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: {
          Federated: oidcProviderArn(),
        },
        Action: "sts:AssumeRoleWithWebIdentity",
        Condition: {
          StringEquals: {
            [`${oidcHost}:aud`]: oidcAudience,
          },
          StringLike: {
            [`${oidcHost}:sub`]: sub,
          },
        },
      },
    ],
  };
}

function buildBaselineDeployPolicy() {
  const bucketArn = `arn:aws:s3:::${stateBucket}`;
  const objectArn = `${bucketArn}/*`;
  const lockArn = accountId
    ? `arn:aws:dynamodb:${region}:${accountId}:table/${lockTable}`
    : `arn:aws:dynamodb:${region}:<account-id>:table/${lockTable}`;

  return {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "StateBackendAccess",
        Effect: "Allow",
        Action: [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
        ],
        Resource: [bucketArn, objectArn],
      },
      {
        Sid: "StateLockAccess",
        Effect: "Allow",
        Action: [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:UpdateItem",
          "dynamodb:DescribeTable",
        ],
        Resource: [lockArn],
      },
      {
        Sid: "IdentityRead",
        Effect: "Allow",
        Action: ["sts:GetCallerIdentity"],
        Resource: ["*"],
      },
    ],
  };
}

function ensureRolePolicy(name, environment, policyName) {
  const policyDoc = buildBaselineDeployPolicy();

  if (mode === "apply") {
    awsExec(
      `iam put-role-policy --role-name ${shellQuote(name)} --policy-name ${shellQuote(policyName)} --policy-document ${shellQuote(JSON.stringify(policyDoc))}`,
      { parseJson: false },
    );
    addStep(`iam-role-${environment}`, "put-inline-policy", "ok", `${name}:${policyName}`);

    const listed = awsExec(`iam list-role-policies --role-name ${shellQuote(name)} --output json`, {
      allowFailure: true,
    });
    const attached = Array.isArray(listed?.PolicyNames) && listed.PolicyNames.includes(policyName);
    addStep(
      `iam-role-${environment}`,
      "verify-inline-policy",
      attached ? "ok" : "failed",
      `${name}:${policyName}`,
    );

    if (!attached) {
      throw new Error(`Failed to verify inline policy '${policyName}' on role '${name}'`);
    }
  } else {
    addStep(`iam-role-${environment}`, "put-inline-policy", "planned", `${name}:${policyName}`);
    addStep(`iam-role-${environment}`, "verify-inline-policy", "planned", `${name}:${policyName}`);
  }
}

function ensureRole(name, environment) {

  const get = awsExec(`iam get-role --role-name ${shellQuote(name)} --output json`, { allowFailure: true });
  const exists = !(get && get.__error);
  const trust = buildTrustPolicy({ environment });

  if (!exists && mode === "apply") {
    awsExec(
      `iam create-role --role-name ${shellQuote(name)} --assume-role-policy-document ${shellQuote(JSON.stringify(trust))} --description ${shellQuote(`Headstash ${environment} deploy role (bootstrap scaffold)`)}`,
    );
    addStep(`iam-role-${environment}`, "create-role", "ok", roleArn(name));
  } else {
    addStep(`iam-role-${environment}`, "create-role", exists ? "already-exists" : "planned", roleArn(name));
  }

  if (mode === "apply") {
    awsExec(
      `iam update-assume-role-policy --role-name ${shellQuote(name)} --policy-document ${shellQuote(JSON.stringify(trust))}`,
      { parseJson: false },
    );
    addStep(`iam-role-${environment}`, "update-trust", "ok", roleArn(name));
  } else {
    addStep(`iam-role-${environment}`, "update-trust", "planned", roleArn(name));
  }

}

function renderResult() {
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    mode,
    repository: repo,
    region,
    accountId: accountId || null,
    backend: {
      bucket: stateBucket,
      lockTable,
      keyPrefix: stateKeyPrefix,
      region,
    },
    oidc: {
      url: oidcUrl,
      audience: oidcAudience,
      providerArn: oidcProviderArn(),
    },
    roles: {
      staging: {
        name: stagingRoleName,
        arn: roleArn(stagingRoleName),
        policyName: stagingPolicyName,
      },
      production: {
        name: productionRoleName,
        arn: roleArn(productionRoleName),
        policyName: productionPolicyName,
      },
    },
    steps,
    warnings,
  };
}

function writeArtifact(payload) {
  const absolute = path.isAbsolute(outPath)
    ? outPath
    : path.resolve(process.cwd(), outPath);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return absolute;
}

function printSummary(payload, artifactPath) {
  console.log(`AWS bootstrap (${mode})`);
  console.log(`repo:   ${payload.repository}`);
  console.log(`region: ${payload.region}`);
  console.log(`bucket: ${payload.backend.bucket}`);
  console.log(`table:  ${payload.backend.lockTable}`);
  console.log(`oidc:   ${payload.oidc.providerArn}`);
  console.log(`roles:  ${payload.roles.staging.arn} | ${payload.roles.production.arn}`);
  console.log(`artifact: ${artifactPath}`);
  if (payload.warnings.length) {
    console.log("warnings:");
    for (const warning of payload.warnings) console.log(`- ${warning}`);
  }
}

async function main() {
  try {
    requireAwsCliIfApply();
    resolveAccountIdIfNeeded();
    ensureStateBucket();
    ensureLockTable();
    ensureOidcProvider();
    ensureRole(stagingRoleName, "staging");
    ensureRolePolicy(stagingRoleName, "staging", stagingPolicyName);
    ensureRole(productionRoleName, "production");
    ensureRolePolicy(productionRoleName, "production", productionPolicyName);

    const payload = renderResult();
    const artifactPath = writeArtifact(payload);

    if (outputJson) {
      console.log(JSON.stringify({ ...payload, artifactPath }, null, 2));
    } else {
      printSummary(payload, artifactPath);
    }
  } catch (error) {
    const failure = {
      ok: false,
      generatedAt: new Date().toISOString(),
      mode,
      repository: repo,
      region,
      steps,
      error: error?.message || String(error),
    };

    if (outputJson) {
      console.error(JSON.stringify(failure, null, 2));
    } else {
      console.error(`AWS bootstrap failed: ${failure.error}`);
    }

    process.exit(1);
  }
}

main();
