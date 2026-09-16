import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AuditLine } from "../src/audit.js";
import { DEFAULT_REF } from "../src/download.js";
import { cli, makeCatalog, makeProject, serveCatalog, type Fixture, type Project } from "./helpers.js";

let fx: Fixture;
beforeAll(async () => {
  fx = await serveCatalog(makeCatalog());
});
afterAll(() => fx.close());

const PROJECT_LOG = "mass-skills.audit.jsonl";
const GLOBAL_LOG = ".config/mass-skills/audit.jsonl";

/** Every line parsed on its own, the way a log reader consumes JSON Lines. */
function readLog(path: string): AuditLine[] {
  const raw = readFileSync(path, "utf8");
  expect(raw.endsWith("\n"), "log ends with a newline").toBe(true);
  return raw
    .split("\n")
    .filter((l) => l.length > 0)
    .map((l) => JSON.parse(l) as AuditLine);
}

function projectLog(p: Project): AuditLine[] {
  return readLog(join(p.cwd, PROJECT_LOG));
}

function bumpRemote(name: string, version: string) {
  const original = fx.registry;
  const next = structuredClone(original);
  next.skills.find((s) => s.name === name)!.version = version;
  fx.registry = next;
  return () => (fx.registry = original);
}

describe("audit log", () => {
  it("install writes one line per skill with the fields of the operation", async () => {
    const p = makeProject(fx);
    const r = await cli(p, ["install", "mass-alpha", "mass-beta", "-a", "claude-code", "cursor"]);
    expect(r.code, r.stderr).toBe(0);
    const lines = projectLog(p);
    expect(lines).toHaveLength(2);
    const alpha = fx.registry.skills.find((s) => s.name === "mass-alpha")!;
    expect(lines[0]).toEqual({
      ts: "2026-09-14T12:00:00.000Z",
      command: "install",
      skill: "mass-alpha",
      version: "0.1.0",
      contentHash: alpha.contentHash,
      ref: DEFAULT_REF,
      agents: ["claude-code", "cursor"],
      scope: "project",
      result: "ok",
    });
    expect(lines[1].skill).toBe("mass-beta");
    expect(lines[1].result).toBe("ok");
  });

  it("update and remove append to the same file instead of overwriting it", async () => {
    const p = makeProject(fx);
    await cli(p, ["install", "mass-alpha", "-a", "claude-code"]);
    const restore = bumpRemote("mass-alpha", "0.2.0");
    try {
      expect((await cli(p, ["update"])).code).toBe(0);
    } finally {
      restore();
    }
    expect((await cli(p, ["update", "--check"])).code).toBe(0);
    expect((await cli(p, ["remove", "mass-alpha"])).code).toBe(0);
    const lines = projectLog(p);
    expect(lines.map((l) => [l.command, l.skill, l.result])).toEqual([
      ["install", "mass-alpha", "ok"],
      ["update", "mass-alpha", "ok"],
      ["remove", "mass-alpha", "ok"],
    ]);
    expect(lines[1].version).toBe("0.2.0");
    expect(lines[2].agents).toEqual(["claude-code"]);
  });

  it("global scope writes the log next to the global lockfile and nothing in the project", async () => {
    const p = makeProject(fx);
    const r = await cli(p, ["install", "mass-alpha", "-a", "claude-code", "--global"]);
    expect(r.code, r.stderr).toBe(0);
    expect(existsSync(join(p.cwd, PROJECT_LOG))).toBe(false);
    const lines = readLog(join(p.home, GLOBAL_LOG));
    expect(lines).toHaveLength(1);
    expect(lines[0].scope).toBe("global");
    expect(lines[0].skill).toBe("mass-alpha");
  });

  it("MASS_SKILLS_NO_AUDIT turns the log off and writes no file at all", async () => {
    const p = makeProject(fx);
    const env = { ...p.env, MASS_SKILLS_NO_AUDIT: "1" };
    const r = await cli({ ...p, env }, ["install", "mass-alpha", "-a", "claude-code"]);
    expect(r.code, r.stderr).toBe(0);
    expect(existsSync(join(p.cwd, PROJECT_LOG))).toBe(false);
    expect(existsSync(join(p.home, GLOBAL_LOG))).toBe(false);
    expect(r.stderr).toBe("");
  });

  it("a failed install is recorded as failed and keeps the exit code the command already had", async () => {
    const unknown = makeProject(fx);
    const u = await cli(unknown, ["install", "mass-nope", "-a", "claude-code"]);
    expect(u.code).toBe(2);
    const unknownLines = projectLog(unknown);
    expect(unknownLines).toHaveLength(1);
    expect(unknownLines[0]).toEqual({
      ts: "2026-09-14T12:00:00.000Z",
      command: "install",
      skill: "mass-nope",
      ref: DEFAULT_REF,
      scope: "project",
      result: "failed",
      error: 'Unknown skill "mass-nope". Try: mass-skills search mass-nope',
    });

    const broken = makeProject(fx);
    fx.overrides.set("skills/mass-alpha/references/guide.md", Buffer.from("tampered\n"));
    try {
      const b = await cli(broken, ["install", "mass-alpha", "-a", "claude-code"]);
      expect(b.code).toBe(1);
      const lines = projectLog(broken);
      expect(lines).toHaveLength(1);
      expect(lines[0].result).toBe("failed");
      expect(lines[0].skill).toBe("mass-alpha");
      expect(lines[0].error).toBe("Integrity check failed for mass-alpha: references/guide.md");
      expect(existsSync(join(broken.cwd, ".claude/skills/mass-alpha"))).toBe(false);
    } finally {
      fx.overrides.clear();
    }
  });

  it("a failed remove is recorded as failed without touching the exit code", async () => {
    const p = makeProject(fx);
    await cli(p, ["install", "mass-alpha", "-a", "claude-code"]);
    const r = await cli(p, ["remove", "mass-beta"]);
    expect(r.code).toBe(2);
    const lines = projectLog(p);
    expect(lines).toHaveLength(2);
    expect(lines[1].command).toBe("remove");
    expect(lines[1].skill).toBe("mass-beta");
    expect(lines[1].result).toBe("failed");
    expect(lines[1].error).toContain("is not in");
  });
});
