#!/usr/bin/env node
// Write security-status.json, the record of one Snyk Agent Scan run that the site turns into the
// per-skill "security scan" badge and the /security page. security-scan.yml produces it on every
// run that is not a pull request and uploads it as the `security-status` artifact; pages.yml
// downloads that artifact next to skills-registry.json before building the site. The site reads
// the file through parseSecurityStatus, so a malformed file is rejected here and there alike.
// Usage: pnpm exec tsx tools/security-status.ts --result passed|failed|skipped --commit <sha> --run-url <url> [--reason quota] [--scanner-version 0.6.3] [--out security-status.json]
import { writeFileSync } from "node:fs";

export const STATUS_FILE = "security-status.json";
export const SCANNER = "snyk-agent-scan";
export const RESULTS = ["passed", "failed", "skipped"] as const;
export type ScanResult = (typeof RESULTS)[number];

export interface SecurityStatus {
  version: 1;
  /** When the scan ran, ISO 8601. */
  scannedAt: string;
  /** Full sha of the commit that was scanned. */
  commit: string;
  /** passed: no findings; failed: findings or the scan errored; skipped: the scanner did not run (daily quota). */
  result: ScanResult;
  /** Why a scan was skipped, e.g. `quota`. */
  reason?: string;
  scanner: typeof SCANNER;
  /** Version the scanner printed, when it could be read from its output. */
  scannerVersion?: string;
  /** The GitHub Actions run that produced this status. */
  runUrl: string;
}

const SHA_RE = /^[0-9a-f]{40}$/;
const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const REASON_RE = /^[a-z][a-z0-9-]{0,39}$/;
const RUN_URL_RE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/actions\/runs\/\d+$/;

const USAGE = `Usage: tools/security-status.ts --result ${RESULTS.join("|")} --commit <sha> --run-url <url> [--reason quota] [--scanner-version x.y.z] [--out ${STATUS_FILE}]\n`;

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

/** Validate a decoded status object; throws naming the offending field on the first problem. */
export function parseSecurityStatus(input: unknown): SecurityStatus {
  if (typeof input !== "object" || input === null) throw new Error(`${STATUS_FILE}: expected an object`);
  const s = input as Record<string, unknown>;
  if (s.version !== 1) throw new Error(`${STATUS_FILE}: unsupported version ${JSON.stringify(s.version)}`);
  if (typeof s.scannedAt !== "string" || Number.isNaN(Date.parse(s.scannedAt))) throw new Error(`${STATUS_FILE}: "scannedAt" is not a date`);
  if (typeof s.commit !== "string" || !SHA_RE.test(s.commit)) throw new Error(`${STATUS_FILE}: "commit" is not a full sha`);
  if (!RESULTS.includes(s.result as ScanResult)) throw new Error(`${STATUS_FILE}: "result" must be one of ${RESULTS.join(", ")}`);
  if (s.reason !== undefined && (typeof s.reason !== "string" || !REASON_RE.test(s.reason))) throw new Error(`${STATUS_FILE}: "reason" is malformed`);
  if (s.scanner !== SCANNER) throw new Error(`${STATUS_FILE}: "scanner" must be ${SCANNER}`);
  if (s.scannerVersion !== undefined && (typeof s.scannerVersion !== "string" || !SEMVER_RE.test(s.scannerVersion))) {
    throw new Error(`${STATUS_FILE}: "scannerVersion" is not x.y.z`);
  }
  if (typeof s.runUrl !== "string" || !RUN_URL_RE.test(s.runUrl)) throw new Error(`${STATUS_FILE}: "runUrl" is not a GitHub Actions run url`);
  const status: SecurityStatus = {
    version: 1,
    scannedAt: new Date(s.scannedAt).toISOString(),
    commit: s.commit,
    result: s.result as ScanResult,
    scanner: SCANNER,
    runUrl: s.runUrl,
  };
  if (s.reason !== undefined) status.reason = s.reason as string;
  if (s.scannerVersion !== undefined) status.scannerVersion = s.scannerVersion as string;
  return status;
}

export function main(
  argv: string[],
  out: { write(s: string): unknown } = process.stdout,
  err: { write(s: string): unknown } = process.stderr,
  now: () => Date = () => new Date(),
): number {
  const result = flag(argv, "--result");
  const commit = flag(argv, "--commit");
  const runUrl = flag(argv, "--run-url");
  if (!result || !commit || !runUrl) {
    err.write(USAGE);
    return 2;
  }
  const reason = flag(argv, "--reason");
  // The version is read from the scanner's stdout, which also echoes attacker-controlled skill
  // content: anything but a bare x.y.z is dropped rather than recorded.
  const scannerVersion = flag(argv, "--scanner-version");
  const file = flag(argv, "--out") ?? STATUS_FILE;
  let status: SecurityStatus;
  try {
    status = parseSecurityStatus({
      version: 1,
      scannedAt: now().toISOString(),
      commit,
      result,
      reason: reason || undefined,
      scanner: SCANNER,
      scannerVersion: scannerVersion && SEMVER_RE.test(scannerVersion) ? scannerVersion : undefined,
      runUrl,
    });
  } catch (e) {
    err.write(`${(e as Error).message}\n`);
    return 1;
  }
  writeFileSync(file, `${JSON.stringify(status, null, 2)}\n`);
  out.write(`${file}: ${status.result}${status.reason ? ` (${status.reason})` : ""} at ${status.scannedAt} for ${status.commit.slice(0, 7)}\n`);
  return 0;
}

if (process.argv[1]?.endsWith("security-status.ts") || process.argv[1]?.endsWith("security-status.js")) {
  process.exit(main(process.argv.slice(2)));
}
