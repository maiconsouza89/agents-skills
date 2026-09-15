import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AGENTS } from "../src/agents.js";
import type { Lockfile } from "../src/types.js";
import { cli, makeCatalog, makeProject, readJson, serveCatalog, type Fixture } from "./helpers.js";

let fx: Fixture;
beforeAll(async () => {
  fx = await serveCatalog(makeCatalog({ "mass-old": { since: "2026-01-01", replacedBy: ["mass-alpha"], reason: "renamed" } }));
});
afterAll(() => fx.close());

function untouched(project: { cwd: string; home: string }) {
  const dirs = readdirSync(project.cwd).filter((e) => e !== ".claude");
  expect(dirs, "project dir").toEqual([]);
  expect(readdirSync(join(project.cwd, ".claude"))).toEqual([]);
  expect(existsSync(join(project.cwd, "mass-skills.lock.json"))).toBe(false);
  expect(readdirSync(project.home)).toEqual([]);
}

describe("install", () => {
  it("installs into every agent path, project and global, and records the lockfile entry", async () => {
    const cases = AGENTS.map((a) => ({ id: a.id, project: a.projectDir, global: a.globalDir }));
    expect(cases).toHaveLength(8);
    for (const c of cases) {
      const p = makeProject(fx, []);
      const r = await cli(p, ["install", "mass-alpha", "-a", c.id]);
      expect(r.code, `${c.id} project: ${r.stderr}`).toBe(0);
      const dest = join(p.cwd, c.project, "mass-alpha");
      expect(readFileSync(join(dest, "SKILL.md"), "utf8")).toBe(readFileSync(join(fx.root, "skills/mass-alpha/SKILL.md"), "utf8"));
      expect(existsSync(join(dest, "references/guide.md"))).toBe(true);
      expect(existsSync(join(dest, "scripts/run.sh"))).toBe(true);
      const lock = readJson<Lockfile>(join(p.cwd, "mass-skills.lock.json"));
      expect(lock.skills["mass-alpha"].agents).toEqual([c.id]);

      const g = await cli(p, ["install", "mass-alpha", "-a", c.id, "--global"]);
      expect(g.code, `${c.id} global: ${g.stderr}`).toBe(0);
      expect(existsSync(join(p.home, c.global, "mass-alpha", "SKILL.md"))).toBe(true);
      expect(existsSync(join(p.home, ".config/mass-skills/lock.json"))).toBe(true);
    }
  });

  it("lockfile entry carries version, contentHash, ref, agents and installedAt from the registry", async () => {
    const p = makeProject(fx);
    await cli(p, ["install", "mass-alpha", "mass-beta", "-a", "claude-code", "cursor"]);
    const lock = readJson<Lockfile>(join(p.cwd, "mass-skills.lock.json"));
    const alpha = fx.registry.skills.find((s) => s.name === "mass-alpha")!;
    expect(lock.skills["mass-alpha"]).toEqual({
      version: "0.1.0",
      contentHash: alpha.contentHash,
      ref: "main",
      agents: ["claude-code", "cursor"],
      installedAt: "2026-09-14T12:00:00.000Z",
    });
    expect(Object.keys(lock.skills)).toEqual(["mass-alpha", "mass-beta"]);
    expect(existsSync(join(p.cwd, ".agents/skills/mass-beta/SKILL.md"))).toBe(true);
  });

  it("integrity failure writes nothing: file sha256 mismatch", async () => {
    const p = makeProject(fx);
    fx.overrides.set("skills/mass-alpha/references/guide.md", Buffer.from("tampered\n"));
    try {
      const r = await cli(p, ["install", "mass-alpha", "-a", "claude-code"]);
      expect(r.code).toBe(1);
      expect(r.stderr).toBe("Integrity check failed for mass-alpha: references/guide.md\n");
      untouched(p);
    } finally {
      fx.overrides.clear();
    }
  });

  it("integrity failure writes nothing: contentHash mismatch with every file sha256 intact", async () => {
    const p = makeProject(fx);
    const original = fx.registry;
    const tampered = structuredClone(original);
    const alpha = tampered.skills.find((s) => s.name === "mass-alpha")!;
    alpha.contentHash = "0".repeat(64);
    fx.registry = tampered;
    try {
      const r = await cli(p, ["install", "mass-alpha", "-a", "claude-code"]);
      expect(r.code).toBe(1);
      expect(r.stderr).toBe("Integrity check failed for mass-alpha: contentHash\n");
      untouched(p);
    } finally {
      fx.registry = original;
    }
  });

  it("partial download leaves nothing behind when the second of three files fails", async () => {
    const p = makeProject(fx);
    // byte-sorted order: SKILL.md, references/guide.md, scripts/run.sh -> fail the second
    fx.overrides.set("skills/mass-alpha/references/guide.md", "fail");
    try {
      const r = await cli(p, ["install", "mass-alpha", "-a", "claude-code"]);
      expect(r.code).toBe(1);
      expect(r.stderr).toMatch(/^Failed to fetch http:\/\/127\.0\.0\.1:\d+\/main\/skills\/mass-alpha\/references\/guide\.md: /);
      expect(fx.hits.get("skills/mass-alpha/SKILL.md")).toBeGreaterThan(0);
      untouched(p);
    } finally {
      fx.overrides.clear();
    }
  });

  it("unsupported agent exits 2 naming the supported list and the npx fallback", async () => {
    const p = makeProject(fx);
    const r = await cli(p, ["install", "mass-alpha", "-a", "vim"]);
    expect(r.code).toBe(2);
    expect(r.stderr).toBe(
      'Unsupported agent "vim". Supported: claude-code, cursor, codex, github-copilot, opencode, windsurf, gemini-cli, cline. For other agents use: npx skills add maiconsouza89/mass-solutions-skills\n',
    );
    untouched(p);
  });

  it("auto detects agents from .claude, .agents and .windsurf folders in the cwd", async () => {
    const p = makeProject(fx, [".claude", ".windsurf"]);
    const r = await cli(p, ["install", "mass-gamma", "-a", "auto"]);
    expect(r.code, r.stderr).toBe(0);
    expect(existsSync(join(p.cwd, ".claude/skills/mass-gamma/SKILL.md"))).toBe(true);
    expect(existsSync(join(p.cwd, ".windsurf/skills/mass-gamma/SKILL.md"))).toBe(true);
    expect(existsSync(join(p.cwd, ".agents"))).toBe(false);
    const lock = readJson<Lockfile>(join(p.cwd, "mass-skills.lock.json"));
    expect(lock.skills["mass-gamma"].agents).toEqual(["claude-code", "windsurf"]);

    const q = makeProject(fx, [".agents"]);
    const s = await cli(q, ["install", "mass-gamma"]);
    expect(s.code, s.stderr).toBe(0);
    expect(readJson<Lockfile>(join(q.cwd, "mass-skills.lock.json")).skills["mass-gamma"].agents).toEqual([
      "cursor",
      "codex",
      "github-copilot",
      "opencode",
      "gemini-cli",
      "cline",
    ]);
  });

  it("auto with nothing detected exits 2 listing the supported ids", async () => {
    const p = makeProject(fx, []);
    const r = await cli(p, ["install", "mass-alpha", "-a", "auto"]);
    expect(r.code).toBe(2);
    expect(r.stderr).toMatch(/^No agent detected in .*Supported: claude-code, cursor, codex, github-copilot, opencode, windsurf, gemini-cli, cline\n$/);
    expect(existsSync(join(p.cwd, "mass-skills.lock.json"))).toBe(false);
  });

  it("deprecated is refused with the replacement and exit 1", async () => {
    const p = makeProject(fx);
    const r = await cli(p, ["install", "mass-old", "-a", "claude-code"]);
    expect(r.code).toBe(1);
    expect(r.stderr).toBe('"mass-old" is deprecated since 2026-01-01: renamed. Use: mass-alpha\n');
    untouched(p);
  });

  it("unknown skill exits 2 suggesting search", async () => {
    const p = makeProject(fx);
    const r = await cli(p, ["install", "mass-nope", "-a", "claude-code"]);
    expect(r.code).toBe(2);
    expect(r.stderr).toBe('Unknown skill "mass-nope". Try: mass-skills search mass-nope\n');
    untouched(p);
  });

  it("unsafe path is refused before anything is written: .., leading slash, bad name", async () => {
    const original = fx.registry;
    const cases: Array<{ label: string; mutate: (r: typeof original) => void; skill: string }> = [
      { label: "..", skill: "mass-alpha", mutate: (r) => (r.skills.find((s) => s.name === "mass-alpha")!.files[0].path = "../escape.md") },
      { label: "leading /", skill: "mass-alpha", mutate: (r) => (r.skills.find((s) => s.name === "mass-alpha")!.files[0].path = "/etc/passwd") },
      { label: "bad name", skill: "Mass-Alpha", mutate: (r) => (r.skills.find((s) => s.name === "mass-alpha")!.name = "Mass-Alpha") },
    ];
    for (const c of cases) {
      const p = makeProject(fx);
      const tampered = structuredClone(original);
      c.mutate(tampered);
      fx.registry = tampered;
      fx.hits.clear();
      try {
        const r = await cli(p, ["install", c.skill, "-a", "claude-code"]);
        expect(r.code, c.label).toBe(1);
        expect(r.stderr, c.label).toMatch(/^Unsafe path: /);
        expect([...fx.hits.keys()].filter((k) => k !== "skills-registry.json"), c.label).toEqual([]);
        untouched(p);
      } finally {
        fx.registry = original;
      }
    }
  });

  it("fetch failure: registry 404 and network error exit 1 with the url and change nothing", async () => {
    const p = makeProject(fx);
    fx.overrides.set("skills-registry.json", 404);
    try {
      const r = await cli(p, ["install", "mass-alpha", "-a", "claude-code"]);
      expect(r.code).toBe(1);
      expect(r.stderr).toMatch(/^Failed to fetch http:\/\/127\.0\.0\.1:\d+\/main\/skills-registry\.json: 404\n$/);
      untouched(p);
    } finally {
      fx.overrides.clear();
    }
    const q = makeProject(fx);
    q.env.MASS_SKILLS_BASE_URL = "http://127.0.0.1:1/";
    const n = await cli(q, ["list"]);
    expect(n.code).toBe(1);
    expect(n.stderr).toMatch(/^Failed to fetch http:\/\/127\.0\.0\.1:1\/main\/skills-registry\.json: .+\n$/);
    expect(n.stderr).not.toMatch(/: \d{3}\n$/);
    untouched(q);
  });
});
