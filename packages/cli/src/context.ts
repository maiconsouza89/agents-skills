import { homedir } from "node:os";
import type { Registry } from "@mass-solutions/skills-core";
import { fetchRegistry } from "./download.js";
import { lockPath, readLock, type LockScope } from "./lockfile.js";
import type { Lockfile, RunContext } from "./types.js";

export interface CommonOptions {
  ref: string;
  global: boolean;
}

export interface Session {
  ctx: RunContext;
  opts: CommonOptions;
  scope: LockScope;
  lockFile: string;
  now: Date;
  fetchImpl: typeof fetch;
}

export function homeOf(env: NodeJS.ProcessEnv): string {
  return env.HOME?.trim() || homedir();
}

export function openSession(ctx: RunContext, opts: CommonOptions, fetchImpl: typeof fetch = fetch, now: Date = new Date()): Session {
  const scope: LockScope = { cwd: ctx.cwd, home: homeOf(ctx.env), env: ctx.env, global: opts.global };
  return { ctx, opts, scope, lockFile: lockPath(scope), now, fetchImpl };
}

export function loadLock(s: Session): Lockfile {
  return readLock(s.lockFile);
}

export function loadRegistry(s: Session): Promise<Registry> {
  return fetchRegistry(s.ctx.env, s.opts.ref, s.fetchImpl);
}
