// What the repository verifies about each skill, read at build time: the validator run over the
// catalog, the Snyk scan status pages.yml downloaded next to the registry, the allowlist, and the
// catalog ref the CLI pins. Everything degrades to "absent" outside CI so a local or fixture build
// never claims a check it did not see.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateCatalog, type Finding } from "@mass-solutions/skills-core";
import { version as CLI_VERSION } from "@mass-solutions/skills-cli/package.json";
import { readAllowlist, type AllowlistEntry } from "@mass-solutions/tools/allowlist";
import { parseSecurityStatus, STATUS_FILE, type SecurityStatus } from "@mass-solutions/tools/security-status";
import { GITHUB_URL } from "./catalog";
import { REPO_ROOT } from "./paths";

export type { AllowlistEntry, SecurityStatus };

export const ALLOWLIST_FILE = "security-scan-allowlist.yaml";

/** The catalog ref the published CLI downloads from: `v<CLI version>` (DEFAULT_REF in packages/cli). */
export const CATALOG_REF = `v${CLI_VERSION}`;

function readStatus(): SecurityStatus | undefined {
  const file = join(REPO_ROOT, STATUS_FILE);
  if (!existsSync(file)) return undefined;
  try {
    return parseSecurityStatus(JSON.parse(readFileSync(file, "utf8")));
  } catch (e) {
    // A corrupt status is worse than none: the badges say "not scanned" instead of trusting it.
    console.warn(`[security] ignoring ${file}: ${(e as Error).message}`);
    return undefined;
  }
}

/** The Snyk Agent Scan run recorded for this build, or undefined when the build has none. */
export const scanStatus: SecurityStatus | undefined = readStatus();

/** Accepted findings from `security-scan-allowlist.yaml`; empty when the file is not next to the catalog. */
export const allowlist: AllowlistEntry[] = existsSync(join(REPO_ROOT, ALLOWLIST_FILE)) ? readAllowlist(join(REPO_ROOT, ALLOWLIST_FILE)) : [];

const validation = validateCatalog(REPO_ROOT);

/** Validator errors for one skill (warnings are not shown as a failed check). */
export function validatorErrors(name: string): Finding[] {
  return validation.findings.filter((f) => f.severity === "error" && f.path.startsWith(`skills/${name}/`));
}

export function allowlistFor(name: string): AllowlistEntry[] {
  return allowlist.filter((e) => e.skill === name);
}

/** `YYYY-MM-DD` of the scan, the granularity the badges show. */
export function scanDate(status: SecurityStatus): string {
  return status.scannedAt.slice(0, 10);
}

/** The catalog folder of a skill at the ref the CLI pins. */
export function refUrl(name?: string): string {
  return name ? `${GITHUB_URL}/tree/${CATALOG_REF}/skills/${name}` : `${GITHUB_URL}/tree/${CATALOG_REF}`;
}

export function commitUrl(sha: string): string {
  return `${GITHUB_URL}/commit/${sha}`;
}
