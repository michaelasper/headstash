#!/usr/bin/env node

import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

function printHelp() {
  console.log(`Usage: node scripts/github-env-bootstrap.mjs [--plan|--apply] [options]

Configure GitHub deploy environments (staging/production) from AWS bootstrap artifact.

Actions:
- Create/update GitHub environments via gh api
- Set environment variables and secrets via gh variable/secret set
- Verify environment, variable, and secret presence via gh api queries
- Emit redacted JSON artifact (no secret values)

Options:
  --plan                            Plan mode (default)
  --apply                           Apply mode (executes gh mutations)
  --json                            Print full JSON payload
  --out=<path>                      Output artifact path (default: artifacts/github-env-bootstrap.json)

  --artifact=<path>                 AWS bootstrap JSON artifact path (default: artifacts/aws-bootstrap.json)
  --repo=<owner/name>               GitHub repo slug (default: from artifact.repository)

  --staging-env=<name>              Staging environment name (default: staging)
  --production-env=<name>           Production environment name (default: production)
  --production-wait-min=<minutes>   Production wait timer minutes (default: 5)

  --staging-role-secret=<name>      Secret name for staging role ARN (default: AWS_ROLE_ARN)
  --production-role-secret=<name>   Secret name for production role ARN (default: AWS_ROLE_ARN)
  --account-id-secret=<name>        Secret name for AWS account id (default: AWS_ACCOUNT_ID)

Examples:
  node scripts/github-env-bootstrap.mjs --plan --json
  node scripts/github-env-bootstrap.mjs --apply --artifact=artifacts/aws-bootstrap.json
  node scripts/github-env-bootstrap.mjs --apply --repo=michaelasper/headstash --production-wait-min=10`);
}

if (hasArg("--help") || hasArg("-h")) {
  printHelp();
  process.exit(0);
}

const mode = hasArg("--apply") ? "apply" : "plan";
const outputJson = hasArg("--json");

const artifactPath = getArgValue("--artifact", "artifacts/aws-bootstrap.json");
const outPath = getArgValue("--out", "artifacts/github-env-bootstrap.json");

const stagingEnvName = getArgValue("--staging-env", "staging");
const productionEnvName = getArgValue("--production-env", "production");
const productionWaitMin = Number.parseInt(getArgValue("--production-wait-min", "5"), 10);

const stagingRoleSecretName = getArgValue("--staging-role-secret", "AWS_ROLE_ARN");
const productionRoleSecretName = getArgValue("--production-role-secret", "AWS_ROLE_ARN");
const accountIdSecretName = getArgValue("--account-id-secret", "AWS_ACCOUNT_ID");

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

function runCommand(command, { parseJson = false, allowFailure = false, input } = {}) {
  try {
    const out = execSync(command, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      ...(input !== undefined ? { input } : {}),
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

function ghApi(endpoint, { method = "GET", body, allowFailure = false } = {}) {
  const cmd = `gh api --method ${shellQuote(method)} ${shellQuote(endpoint)}`;
  return runCommand(cmd, {
    parseJson: true,
    allowFailure,
    ...(body !== undefined ? { input: JSON.stringify(body) } : {}),
  });
}

function ghExec(command, { allowFailure = false } = {}) {
  return runCommand(command, { allowFailure, parseJson: false });
}

function readBootstrapArtifact(filePath) {
  const absolute = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
  const raw = readFileSync(absolute, "utf8");
  return {
    absolute,
    data: JSON.parse(raw),
  };
}

function validateBootstrapArtifact(payload) {
  const missing = [];
  if (!payload || typeof payload !== "object") missing.push("root object");
  if (!payload.repository) missing.push("repository");
  if (!payload.region) missing.push("region");
  if (!payload.backend?.bucket) missing.push("backend.bucket");
  if (!payload.backend?.lockTable) missing.push("backend.lockTable");
  if (!payload.backend?.keyPrefix) missing.push("backend.keyPrefix");
  if (!payload.oidc?.providerArn) missing.push("oidc.providerArn");
  if (!payload.roles?.staging?.arn) missing.push("roles.staging.arn");
  if (!payload.roles?.production?.arn) missing.push("roles.production.arn");

  if (missing.length) {
    throw new Error(`Invalid bootstrap artifact. Missing fields: ${missing.join(", ")}`);
  }
}

function ensureGhReady() {
  try {
    ghExec("gh --version");
    addStep("gh-cli", "verify-install", "ok");
  } catch {
    addStep("gh-cli", "verify-install", "failed", "gh CLI not found");
    throw new Error("gh CLI is required");
  }

  const auth = ghExec("gh auth status", { allowFailure: true });
  if (auth?.__error) {
    addStep("gh-cli", "verify-auth", "failed", "gh auth status failed");
    throw new Error("gh CLI is not authenticated. Run `gh auth login`.");
  }

  addStep("gh-cli", "verify-auth", "ok");
}

function normalizeRepo(value) {
  return String(value || "").trim().replace(/^https?:\/\/github.com\//, "").replace(/\.git$/, "");
}

function buildEnvironmentConfig({ production }) {
  return {
    wait_timer: production ? Math.max(0, productionWaitMin) : 0,
    prevent_self_review: production,
    deployment_branch_policy: {
      protected_branches: true,
      custom_branch_policies: false,
    },
  };
}

function setEnvironment(repo, envName, config) {
  const endpoint = `/repos/${repo}/environments/${encodeURIComponent(envName)}`;

  if (mode === "apply") {
    const result = ghApi(endpoint, {
      method: "PUT",
      body: config,
      allowFailure: true,
    });

    if (result?.__error) {
      addStep(`github-env-${envName}`, "upsert", "failed", result.stderr);
      throw new Error(`Failed to configure environment '${envName}': ${result.stderr}`);
    }

    addStep(`github-env-${envName}`, "upsert", "ok", envName);
    return result;
  }

  addStep(`github-env-${envName}`, "upsert", "planned", envName);
  return null;
}

function setEnvVariable(repo, envName, name, value) {
  if (mode === "apply") {
    const cmd = `gh variable set ${shellQuote(name)} --repo ${shellQuote(repo)} --env ${shellQuote(envName)} --body ${shellQuote(value)}`;
    const result = ghExec(cmd, { allowFailure: true });
    if (result?.__error) {
      addStep(`github-env-${envName}`, `set-var:${name}`, "failed", result.stderr);
      throw new Error(`Failed to set variable ${name} on ${envName}: ${result.stderr}`);
    }
    addStep(`github-env-${envName}`, `set-var:${name}`, "ok");
    return;
  }

  addStep(`github-env-${envName}`, `set-var:${name}`, "planned");
}

function setEnvSecret(repo, envName, name, value) {
  if (mode === "apply") {
    const cmd = `gh secret set ${shellQuote(name)} --repo ${shellQuote(repo)} --env ${shellQuote(envName)} --body ${shellQuote(value)}`;
    const result = ghExec(cmd, { allowFailure: true });
    if (result?.__error) {
      addStep(`github-env-${envName}`, `set-secret:${name}`, "failed", result.stderr);
      throw new Error(`Failed to set secret ${name} on ${envName}: ${result.stderr}`);
    }
    addStep(`github-env-${envName}`, `set-secret:${name}`, "ok", "[REDACTED]");
    return;
  }

  addStep(`github-env-${envName}`, `set-secret:${name}`, "planned", "[REDACTED]");
}

function verifyEnvironment(repo, envName, expectedVariables, expectedSecrets) {
  const base = `/repos/${repo}/environments/${encodeURIComponent(envName)}`;

  const envDetails = ghApi(base, { allowFailure: true });
  const vars = ghApi(`${base}/variables?per_page=100`, { allowFailure: true });
  const secrets = ghApi(`${base}/secrets?per_page=100`, { allowFailure: true });

  if (envDetails?.__error) {
    addStep(`github-env-${envName}`, "verify", "failed", envDetails.stderr);
    return {
      ok: false,
      error: envDetails.stderr,
      variables: { found: [], expected: expectedVariables, ok: false },
      secrets: { found: [], expected: expectedSecrets, ok: false },
      protection: null,
    };
  }

  const foundVariables = Array.isArray(vars?.variables) ? vars.variables.map((v) => v.name) : [];
  const foundSecrets = Array.isArray(secrets?.secrets) ? secrets.secrets.map((s) => s.name) : [];

  const variableOk = expectedVariables.every((name) => foundVariables.includes(name));
  const secretOk = expectedSecrets.every((name) => foundSecrets.includes(name));

  const waitRule = Array.isArray(envDetails?.protection_rules)
    ? envDetails.protection_rules.find((rule) => rule?.type === "wait_timer")
    : null;

  const requiredReviewersRule = Array.isArray(envDetails?.protection_rules)
    ? envDetails.protection_rules.find((rule) => rule?.type === "required_reviewers")
    : null;

  const protection = {
    preventSelfReview: Boolean(envDetails?.prevent_self_review),
    waitTimerMinutes: Number(waitRule?.wait_timer ?? 0),
    deploymentBranchPolicy: envDetails?.deployment_branch_policy ?? null,
    requiredReviewersCount: Array.isArray(requiredReviewersRule?.reviewers)
      ? requiredReviewersRule.reviewers.length
      : 0,
  };

  const ok = variableOk && secretOk;
  addStep(`github-env-${envName}`, "verify", ok ? "ok" : "failed");

  return {
    ok,
    variables: {
      ok: variableOk,
      expected: expectedVariables,
      found: foundVariables,
    },
    secrets: {
      ok: secretOk,
      expected: expectedSecrets,
      found: foundSecrets,
    },
    protection,
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

function printSummary(payload, artifact) {
  console.log(`GitHub env bootstrap (${mode})`);
  console.log(`repo: ${payload.repository}`);
  console.log(`artifact-in: ${payload.bootstrapArtifact}`);
  console.log(`artifact-out: ${artifact}`);
  for (const env of payload.environments) {
    const vars = env.verification?.variables?.ok ? "vars:ok" : "vars:missing";
    const secrets = env.verification?.secrets?.ok ? "secrets:ok" : "secrets:missing";
    console.log(`- ${env.name}: ${vars}, ${secrets}`);
  }
  if (payload.warnings.length) {
    console.log("warnings:");
    for (const warning of payload.warnings) console.log(`- ${warning}`);
  }
}

function redactEnvConfig(config) {
  return {
    wait_timer: config.wait_timer,
    prevent_self_review: config.prevent_self_review,
    deployment_branch_policy: config.deployment_branch_policy,
  };
}

async function main() {
  try {
    ensureGhReady();

    const { absolute: bootstrapAbsolute, data: bootstrap } = readBootstrapArtifact(artifactPath);
    validateBootstrapArtifact(bootstrap);
    addStep("artifact", "read-bootstrap", "ok", bootstrapAbsolute);

    const repository = normalizeRepo(getArgValue("--repo", bootstrap.repository));
    if (!repository.includes("/")) {
      throw new Error(`Invalid repository slug '${repository}'. Expected owner/name.`);
    }

    if (!bootstrap.accountId) {
      warnings.push("Bootstrap artifact does not include accountId; AWS_ACCOUNT_ID secret will be skipped.");
    }

    const hasPlaceholderArn =
      String(bootstrap.roles?.staging?.arn || "").includes("<account-id>") ||
      String(bootstrap.roles?.production?.arn || "").includes("<account-id>");
    if (hasPlaceholderArn) {
      warnings.push("Detected placeholder role ARN values (<account-id>) in bootstrap artifact.");
    }

    const commonVariables = {
      AWS_REGION: bootstrap.region,
      TF_STATE_BUCKET: bootstrap.backend.bucket,
      TF_STATE_LOCK_TABLE: bootstrap.backend.lockTable,
      TF_STATE_KEY_PREFIX: bootstrap.backend.keyPrefix,
      AWS_OIDC_PROVIDER_ARN: bootstrap.oidc.providerArn,
    };

    const environmentPlans = [
      {
        name: stagingEnvName,
        production: false,
        roleArn: bootstrap.roles.staging.arn,
        roleName: bootstrap.roles.staging.name,
        roleSecretName: stagingRoleSecretName,
      },
      {
        name: productionEnvName,
        production: true,
        roleArn: bootstrap.roles.production.arn,
        roleName: bootstrap.roles.production.name,
        roleSecretName: productionRoleSecretName,
      },
    ];

    const environments = [];

    for (const env of environmentPlans) {
      const config = buildEnvironmentConfig({
        name: env.name,
        production: env.production,
      });

      setEnvironment(repository, env.name, config);

      const varsForEnv = {
        ...commonVariables,
        AWS_DEPLOY_ROLE_NAME: env.roleName,
      };

      for (const [name, value] of Object.entries(varsForEnv)) {
        setEnvVariable(repository, env.name, name, value);
      }

      const secretsForEnv = {
        [env.roleSecretName]: env.roleArn,
        ...(bootstrap.accountId ? { [accountIdSecretName]: String(bootstrap.accountId) } : {}),
      };

      for (const [name, value] of Object.entries(secretsForEnv)) {
        setEnvSecret(repository, env.name, name, value);
      }

      const verification = verifyEnvironment(
        repository,
        env.name,
        Object.keys(varsForEnv),
        Object.keys(secretsForEnv),
      );

      environments.push({
        name: env.name,
        config: redactEnvConfig(config),
        variables: Object.entries(varsForEnv).map(([name, value]) => ({
          name,
          value,
        })),
        secrets: Object.keys(secretsForEnv).map((name) => ({ name })),
        verification,
      });
    }

    const ok = environments.every((env) => env.verification?.ok);

    const payload = {
      ok,
      generatedAt: new Date().toISOString(),
      mode,
      repository,
      bootstrapArtifact: bootstrapAbsolute,
      environments,
      steps,
      warnings,
    };

    const artifact = writeArtifact(payload);

    if (outputJson) {
      console.log(JSON.stringify({ ...payload, artifactPath: artifact }, null, 2));
    } else {
      printSummary(payload, artifact);
    }
  } catch (error) {
    const failure = {
      ok: false,
      generatedAt: new Date().toISOString(),
      mode,
      steps,
      error: error?.message || String(error),
    };

    if (outputJson) {
      console.error(JSON.stringify(failure, null, 2));
    } else {
      console.error(`GitHub env bootstrap failed: ${failure.error}`);
    }

    process.exit(1);
  }
}

main();
