import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { lockPath, readLock, writeLock } from "../src/lockfile.js";
import type { Lockfile } from "../src/types.js";
import { cli, makeCatalog, makeProject, readJson, serveCatalog, type Fixture } from "./helpers.js";

let fx: Fixture;
beforeAll(async () => {
  fx = await serveCatalog(makeCatalog());
});
afterAll(() => fx.close());

describe("lockfile", () => {
  it("lockfile shape and atomic write: door 4 shape, tmp + rename, no tmp left, skills-lock.json untouched", async () => {
    const p = makeProject(fx);
    const foreign = join(p.cwd, "skills-lock.json");
    writeFileSync(foreign, '{"version":1,"skills":{"grill-me":{"source":"x"}}}\n');
    const r = await cli(p, ["install", "mass-beta", "-a", "claude-code"]);
    expect(r.code, r.stderr).toBe(0);
    const lock = readJson<Lockfile>(join(p.cwd, "mass-skills.lock.json"));
    expect(Object.keys(lock)).toEqual(["version", "skills"]);
    expect(lock.version).toBe(1);
    expect(Object.keys(lock.skills["mass-beta"])).toEqual(["version", "contentHash", "ref", "agents", "installedAt"]);
    expect(lock.skills["mass-beta"].contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(readdirSync(p.cwd).filter((e) => e.endsWith(".tmp"))).toEqual([]);
    expect(readJson<{ skills: Record<string, unknown> }>(foreign).skills).toEqual({ "grill-me": { source: "x" } });
    expect(lock.skills["grill-me"]).toBeUndefined();
  });

  it("global lockfile lives under XDG_CONFIG_HOME or ~/.config", () => {
    const base = { cwd: "/p", home: "/h", env: {} as NodeJS.ProcessEnv };
    expect(lockPath({ ...base, global: false })).toBe("/p/mass-skills.lock.json");
    expect(lockPath({ ...base, global: true })).toBe("/h/.config/mass-skills/lock.json");
    expect(lockPath({ ...base, env: { XDG_CONFIG_HOME: "/x" }, global: true })).toBe("/x/mass-skills/lock.json");
  });

  it("writeLock leaves no tmp file and readLock round-trips", () => {
    const p = makeProject(fx);
    const path = join(p.cwd, "mass-skills.lock.json");
    const lock: Lockfile = { version: 1, skills: { "mass-z": { version: "1.0.0", contentHash: "a".repeat(64), ref: "main", agents: ["cursor"], installedAt: "2026-01-01T00:00:00.000Z" } } };
    writeLock(path, lock);
    expect(existsSync(`${path}.tmp`)).toBe(false);
    expect(readLock(path)).toEqual(lock);
  });
});
