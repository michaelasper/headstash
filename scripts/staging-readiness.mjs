#!/usr/bin/env node

import { execSync } from "node:child_process";
import dns from "node:dns/promises";
import tls from "node:tls";

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

function toInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `"'"'`)}'`;
}

function printHelp() {
  console.log(`Usage: node scripts/staging-readiness.mjs [options]

Verifies staging readiness for rollback drills:
- optional Route53 UPSERT for staging record (AWS)
- optional Namecheap -> Route53 nameserver handoff guide
- DNS resolution
- TLS certificate validity
- health endpoint response

Options:
  --host=<hostname>               Host to validate (default: staging.headstash.app)
  --health-path=<path>            Health path (default: /api/health)
  --timeout-ms=<ms>               Timeout for TLS/HTTP checks (default: 12000)
  --json                          Output JSON summary

AWS Route53 automation (optional):
  --apply                         Apply Route53 UPSERT before validation
  --apply-route53                 Alias for --apply

  --aws-zone-id=<zoneId>          Hosted Zone ID (required with --apply)
  --route53-zone-id=<zoneId>      Alias for --aws-zone-id

  --aws-target=<target>           DNS target value (required with --apply)
  --route53-record-value=<target> Alias for --aws-target

  --aws-record-name=<name>        Record name to UPSERT (default: --host)
  --route53-record-name=<name>    Alias for --aws-record-name

  --aws-record-type=CNAME|A       Record type for UPSERT (default: CNAME)
  --route53-record-type=CNAME|A   Alias for --aws-record-type

  --aws-ttl=<seconds>             TTL for record (default: 60)
  --route53-ttl=<seconds>         Alias for --aws-ttl

  --aws-profile=<profile>         Optional AWS CLI profile

Namecheap handoff helper (optional):
  --namecheap-guide               Include nameserver handoff instructions from Route53 zone
  --namecheap-domain=<domain>     Domain in Namecheap (default: host apex)

Examples:
  node scripts/staging-readiness.mjs
  node scripts/staging-readiness.mjs --host=staging.headstash.app --health-path=/api/health

  node scripts/staging-readiness.mjs --apply --aws-zone-id=Z123 --aws-target=my-alb.us-east-1.elb.amazonaws.com --aws-profile=prod-admin

  node scripts/staging-readiness.mjs --apply-route53 --route53-zone-id=Z123 --route53-record-name=staging.headstash.app --route53-record-value=my-alb.us-east-1.elb.amazonaws.com

  node scripts/staging-readiness.mjs --namecheap-guide --route53-zone-id=Z123 --namecheap-domain=headstash.app --json`);
}

if (hasArg("--help") || hasArg("-h")) {
  printHelp();
  process.exit(0);
}

const host = getArgValue("--host", "staging.headstash.app");
const healthPath = getArgValue("--health-path", "/api/health");
const timeoutMs = toInt(getArgValue("--timeout-ms", 12000), 12000);
const outputJson = hasArg("--json");

const shouldApply = hasArg("--apply") || hasArg("--apply-route53");
const shouldPrintNamecheapGuide = hasArg("--namecheap-guide");

const awsZoneId = getArgValue("--aws-zone-id", getArgValue("--route53-zone-id"));
const awsTarget = getArgValue("--aws-target", getArgValue("--route53-record-value"));
const route53RecordName = getArgValue("--aws-record-name", getArgValue("--route53-record-name", host));
const awsRecordType = (
  getArgValue("--aws-record-type", getArgValue("--route53-record-type", "CNAME")) || "CNAME"
).toUpperCase();
const awsTtl = toInt(getArgValue("--aws-ttl", getArgValue("--route53-ttl", 60)), 60);
const awsProfile = getArgValue("--aws-profile", "");
const namecheapDomain = getArgValue("--namecheap-domain", host.split(".").slice(-2).join("."));

const allowedRecordTypes = new Set(["CNAME", "A"]);
if (!allowedRecordTypes.has(awsRecordType)) {
  console.error(`Unsupported record type '${awsRecordType}'. Use CNAME or A.`);
  process.exit(1);
}

if (shouldApply && (!awsZoneId || !awsTarget)) {
  console.error("--apply/--apply-route53 requires both --aws-zone-id/--route53-zone-id and --aws-target/--route53-record-value.");
  process.exit(1);
}

if (shouldPrintNamecheapGuide && !awsZoneId) {
  console.error("--namecheap-guide requires --aws-zone-id (or --route53-zone-id).\n");
  process.exit(1);
}

function normalizeDnsName(name) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return trimmed;
  return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
}

function buildRoute53ChangeBatch() {
  const name = normalizeDnsName(route53RecordName);
  const target = awsRecordType === "CNAME" ? normalizeDnsName(awsTarget) : awsTarget;

  return {
    Comment: `headstash staging readiness UPSERT for ${route53RecordName}`,
    Changes: [
      {
        Action: "UPSERT",
        ResourceRecordSet: {
          Name: name,
          Type: awsRecordType,
          TTL: awsTtl,
          ResourceRecords: [{ Value: target }],
        },
      },
    ],
  };
}

function applyRoute53Record() {
  const profileArg = awsProfile ? `--profile ${awsProfile}` : "";
  const batch = JSON.stringify(buildRoute53ChangeBatch());
  const command = [
    "aws",
    profileArg,
    "route53 change-resource-record-sets",
    `--hosted-zone-id ${shellQuote(awsZoneId)}`,
    `--change-batch ${shellQuote(batch)}`,
  ]
    .filter(Boolean)
    .join(" ");

  const output = execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  let parsed = null;
  try {
    parsed = JSON.parse(output);
  } catch {
    // keep raw output when non-json appears
  }

  return {
    command,
    output: parsed ?? output,
  };
}

function getRoute53HostedZone() {
  const profileArg = awsProfile ? `--profile ${awsProfile}` : "";
  const command = ["aws", profileArg, "route53 get-hosted-zone", `--id ${shellQuote(awsZoneId)}`]
    .filter(Boolean)
    .join(" ");

  const raw = execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const parsed = JSON.parse(raw);

  const nameServers = parsed?.DelegationSet?.NameServers ?? [];
  const hostedZoneName = parsed?.HostedZone?.Name ?? null;

  return {
    command,
    hostedZoneName,
    nameServers,
  };
}

function buildNamecheapGuide(hostedZone) {
  const nameServers = (hostedZone?.nameServers ?? []).map((ns) => normalizeDnsName(ns));
  const route53ZoneName = hostedZone?.hostedZoneName ? normalizeDnsName(hostedZone.hostedZoneName) : null;

  return {
    domain: namecheapDomain,
    route53ZoneId: awsZoneId,
    route53ZoneName,
    stagingRecord: {
      name: normalizeDnsName(route53RecordName),
      type: awsRecordType,
      target: awsRecordType === "CNAME" ? normalizeDnsName(awsTarget || "<staging-target>") : awsTarget || "<staging-target>",
      ttl: awsTtl,
    },
    nameServers,
    instructions: [
      `In Namecheap: Domain List -> ${namecheapDomain} -> Manage -> Nameservers -> Custom DNS.`,
      "Replace existing nameservers with the Route53 nameservers listed below and save.",
      "Wait for Namecheap/registry propagation (typically minutes, sometimes up to 24h).",
      `Then run this to upsert staging record in Route53: npm run -s staging:readiness -- --apply-route53 --route53-zone-id=${awsZoneId} --route53-record-name=${route53RecordName} --route53-record-value=<staging-target> --route53-record-type=${awsRecordType} --route53-ttl=${awsTtl}`,
      `Finally verify readiness: npm run -s staging:readiness -- --host=${host} --health-path=${healthPath} --json`,
    ],
  };
}

async function runTlsCheck() {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host,
        servername: host,
        port: 443,
        timeout: timeoutMs,
        rejectUnauthorized: true,
      },
      () => {
        const cert = socket.getPeerCertificate?.();
        const summary = {
          authorized: socket.authorized,
          authorizationError: socket.authorizationError || null,
          validFrom: cert?.valid_from || null,
          validTo: cert?.valid_to || null,
          issuer: cert?.issuer?.O || cert?.issuer?.CN || null,
          subject: cert?.subject?.CN || null,
        };
        socket.end();
        resolve({ ok: true, summary });
      },
    );

    socket.on("error", (error) => {
      resolve({ ok: false, error: error.message });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({ ok: false, error: `TLS timeout after ${timeoutMs}ms` });
    });
  });
}

async function runHealthCheck() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const url = `https://${host}${healthPath}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "user-agent": "headstash-staging-readiness/1.0" },
    });

    const bodyText = await response.text();
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      url,
      bodyPreview: bodyText.slice(0, 300),
    };
  } catch (error) {
    return {
      ok: false,
      url,
      error: error?.name === "AbortError" ? `HTTP timeout after ${timeoutMs}ms` : error.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const result = {
    host,
    healthPath,
    route53RecordName,
    appliedRoute53: null,
    namecheapGuide: null,
    dns: null,
    tls: null,
    health: null,
    ok: false,
  };

  if (shouldPrintNamecheapGuide) {
    try {
      const hostedZone = getRoute53HostedZone();
      result.namecheapGuide = {
        ok: true,
        source: { command: hostedZone.command },
        ...buildNamecheapGuide(hostedZone),
      };
    } catch (error) {
      result.namecheapGuide = {
        ok: false,
        error: error.message,
      };
    }
  }

  if (shouldApply) {
    try {
      const applied = applyRoute53Record();
      result.appliedRoute53 = { ok: true, ...applied };
    } catch (error) {
      result.appliedRoute53 = {
        ok: false,
        error: error.message,
      };
    }
  }

  try {
    const addresses = await dns.lookup(host, { all: true });
    result.dns = {
      ok: Array.isArray(addresses) && addresses.length > 0,
      addresses,
    };
  } catch (error) {
    result.dns = {
      ok: false,
      error: error.message,
    };
  }

  result.tls = await runTlsCheck();
  result.health = await runHealthCheck();

  result.ok = Boolean(result.dns?.ok && result.tls?.ok && result.health?.ok);

  if (outputJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Staging readiness check for ${host}`);

    if (result.namecheapGuide) {
      console.log(`NAMECHEAP GUIDE: ${result.namecheapGuide.ok ? "READY" : "FAIL"}`);
      if (!result.namecheapGuide.ok) {
        console.log(`  ${result.namecheapGuide.error}`);
      } else {
        console.log(`  Domain: ${result.namecheapGuide.domain}`);
        if (Array.isArray(result.namecheapGuide.nameServers) && result.namecheapGuide.nameServers.length) {
          console.log("  Route53 nameservers:");
          for (const ns of result.namecheapGuide.nameServers) {
            console.log(`    - ${ns}`);
          }
        }
      }
    }

    console.log(`DNS:    ${result.dns?.ok ? "PASS" : "FAIL"}`);
    if (!result.dns?.ok) console.log(`  ${result.dns?.error || "No DNS records found"}`);

    console.log(`TLS:    ${result.tls?.ok ? "PASS" : "FAIL"}`);
    if (!result.tls?.ok) {
      console.log(`  ${result.tls?.error || "TLS validation failed"}`);
    } else if (result.tls?.summary) {
      console.log(`  CN=${result.tls.summary.subject} validTo=${result.tls.summary.validTo}`);
    }

    console.log(`HEALTH: ${result.health?.ok ? "PASS" : "FAIL"}`);
    if (!result.health?.ok) {
      console.log(`  ${result.health?.error || `status ${result.health?.status}`}`);
    } else {
      console.log(`  status=${result.health.status} url=${result.health.url}`);
    }

    if (result.appliedRoute53) {
      console.log(`ROUTE53 APPLY: ${result.appliedRoute53.ok ? "PASS" : "FAIL"}`);
      if (!result.appliedRoute53.ok) {
        console.log(`  ${result.appliedRoute53.error}`);
      }
    }

    console.log(`OVERALL: ${result.ok ? "PASS" : "FAIL"}`);
  }

  process.exit(result.ok ? 0 : 1);
}

main();
