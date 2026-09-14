import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { makeRoot, makeSkill } from "./helpers.js";

const BIN = fileURLToPath(new URL("../src/bin/registry.ts", import.meta.url));
const REPO_ROOT = fileURLToPath(new URL("../../..", import.meta.url));

function run(args: string[]) {
  return spawnSync("pnpm", ["exec", "tsx", BIN, ...args], { cwd: REPO_ROOT, encoding: "utf8" });
}

describe("registry bin", () => {
  it("--check detects drift and lists the divergent fields", () => {
    const root = makeRoot();
    const dir = makeSkill(root, "mass-a");
    expect(run(["--root", root]).status).toBe(0);
    expect(existsSync(join(root, "skills-registry.json"))).toBe(true);
    expect(run(["--check", "--root", root]).status).toBe(0);

    appendFileSync(join(dir, "SKILL.md"), "\nchanged\n");
    const res = run(["--check", "--root", root]);
    expect(res.status).toBe(1);
    expect(res.stdout).toContain("skills[0].files[0].sha256");
    expect(res.stdout).toContain("skills[0].contentHash");
    expect(res.stdout).not.toContain("generatedAt");
  });

  it("--check ignores generatedAt", () => {
    const root = makeRoot();
    makeSkill(root, "mass-a");
    run(["--root", root]);
    const file = join(root, "skills-registry.json");
    const reg = JSON.parse(readFileSync(file, "utf8"));
    reg.generatedAt = "2000-01-01T00:00:00.000Z";
    writeFileSync(file, JSON.stringify(reg));
    expect(run(["--check", "--root", root]).status).toBe(0);
  });
});
