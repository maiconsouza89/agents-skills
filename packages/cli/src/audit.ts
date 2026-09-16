import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Session } from "./context.js";
import { globalConfigDir, type LockScope } from "./lockfile.js";

export const PROJECT_AUDIT = "mass-skills.audit.jsonl";
export const GLOBAL_AUDIT_FILE = "audit.jsonl";
/** Errors are stored short: the audit log records what happened, not a stack trace. */
export const MAX_ERROR_LENGTH = 200;

/** One mutation of one skill, as the commands report it. */
export interface AuditEvent {
  command: "install" | "update" | "remove";
  skill: string;
  result: "ok" | "failed";
  version?: string;
  contentHash?: string;
  ref?: string;
  agents?: string[];
  error?: unknown;
}

/** One line of the log, in the order the fields are written. */
export interface AuditLine {
  ts: string;
  command: string;
  skill: string;
  version?: string;
  contentHash?: string;
  ref?: string;
  agents?: string[];
  scope: "project" | "global";
  result: "ok" | "failed";
  error?: string;
}

/** `mass-skills.audit.jsonl` next to the project lockfile, or `<config>/mass-skills/audit.jsonl` with `-g`. */
export function auditPath(scope: LockScope): string {
  if (!scope.global) return join(scope.cwd, PROJECT_AUDIT);
  return join(globalConfigDir(scope), GLOBAL_AUDIT_FILE);
}

/** The log is on by default; any non-empty `MASS_SKILLS_NO_AUDIT` other than `0` turns it off. */
export function auditEnabled(env: NodeJS.ProcessEnv): boolean {
  const raw = env.MASS_SKILLS_NO_AUDIT?.trim();
  return !raw || raw === "0";
}

function shortError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const single = message.replace(/\s+/g, " ").trim();
  return single.length > MAX_ERROR_LENGTH ? `${single.slice(0, MAX_ERROR_LENGTH - 1)}…` : single;
}

export function auditLine(s: Session, event: AuditEvent): AuditLine {
  return {
    ts: s.now.toISOString(),
    command: event.command,
    skill: event.skill,
    ...(event.version !== undefined ? { version: event.version } : {}),
    ...(event.contentHash !== undefined ? { contentHash: event.contentHash } : {}),
    ...(event.ref !== undefined ? { ref: event.ref } : {}),
    ...(event.agents !== undefined ? { agents: event.agents } : {}),
    scope: s.opts.global ? "global" : "project",
    result: event.result,
    ...(event.result === "failed" ? { error: shortError(event.error) } : {}),
  };
}

/**
 * Append one JSON Lines entry for one skill. The log is never allowed to change the outcome of a
 * command: a write that fails is a warning on stderr, not an exit code.
 */
export function audit(s: Session, event: AuditEvent): void {
  if (!auditEnabled(s.ctx.env)) return;
  const path = auditPath(s.scope);
  try {
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, `${JSON.stringify(auditLine(s, event))}\n`);
  } catch (e) {
    s.ctx.stderr.write(`Warning: could not write the audit log at ${path}: ${(e as Error).message}\n`);
  }
}
