import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { main, type FetchLike } from "../../tools/triage-issue.js";
import { ENOENT, fakeExec, fakeFetch, unusedFetch } from "./lib/gh-fakes.js";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const ISSUE = (labels: string[], extra: Record<string, unknown> = {}) => JSON.stringify({ number: 8, labels: labels.map((name) => ({ name })), ...extra });

function fake(labels: string[] = ["bug", "priority:p1", "complexity:high"], overrides: Record<string, string | Error> = {}) {
  return fakeExec({
    "git remote get-url origin": "https://github.com/acme/skills.git\n",
    "gh api repos/acme/skills/issues/8": ISSUE(labels),
    "gh api -X PUT repos/acme/skills/issues/8/labels": "[]",
    ...overrides,
  });
}

async function run(argv: string[], f = fake(), env: NodeJS.ProcessEnv = {}, fetchImpl: FetchLike = unusedFetch) {
  let out = "";
  const code = await main(argv, { write: (s: string) => (out += s) }, f.exec, env, fetchImpl);
  return { code, out, calls: f.calls };
}

const puts = (calls: string[]) => calls.filter((c) => c.startsWith("gh api -X PUT"));
const sent = (calls: string[]) =>
  (puts(calls)[0] ?? "")
    .split(" -f ")
    .slice(1)
    .map((p) => p.replace("labels[]=", ""));

describe("triage-issue", () => {
  it("writes the requested families and keeps the rest", async () => {
    const r = await run(["8", "--area", "cli", "--complexity", "medium"]);
    expect(r.code, r.out).toBe(0);
    expect(r.calls[0]).toBe("git remote get-url origin");
    expect(r.calls[1]).toBe("gh api repos/acme/skills/issues/8");
    expect(puts(r.calls)).toHaveLength(1);
    expect(sent(r.calls)).toEqual(["bug", "priority:p1", "area:cli", "complexity:medium"]);
  });

  it("writes every contract value as its label", async () => {
    const cases: Array<[string, string, string]> = [
      ["--priority", "p0", "priority:p0"],
      ["--priority", "p1", "priority:p1"],
      ["--priority", "p2", "priority:p2"],
      ["--priority", "backlog", "priority:backlog"],
      ["--area", "cli", "area:cli"],
      ["--area", "core", "area:core"],
      ["--area", "site", "area:site"],
      ["--area", "ci", "area:ci"],
      ["--area", "catalog", "area:catalog"],
      ["--complexity", "low", "complexity:low"],
      ["--complexity", "medium", "complexity:medium"],
      ["--complexity", "high", "complexity:high"],
    ];
    expect(cases).toHaveLength(12);
    for (const [flag, value, label] of cases) {
      const r = await run(["8", flag, value], fake(["bug"]));
      expect(r.code, `${flag} ${value}: ${r.out}`).toBe(0);
      expect(sent(r.calls)).toEqual(["bug", label]);
    }
  });

  it("lowercases the flag values", async () => {
    const r = await run(["8", "--area", "CLI", "--complexity", "MEDIUM"], fake(["bug"]));
    expect(r.code, r.out).toBe(0);
    expect(sent(r.calls)).toEqual(["bug", "area:cli", "complexity:medium"]);
  });

  it("prints what it set and exits 0", async () => {
    const r = await run(["8", "--area", "cli", "--complexity", "medium"], fake(["bug"]));
    expect(r.code).toBe(0);
    expect(r.out.startsWith("#8: set area:cli, complexity:medium")).toBe(true);
    expect(r.out).toContain("project-fields.yml");
  });

  it("names the label it replaced", async () => {
    const r = await run(["8", "--complexity", "medium"]);
    expect(r.code).toBe(0);
    expect(r.out.trimEnd().endsWith("(replaced complexity:high)")).toBe(true);
    expect(sent(r.calls)).toEqual(["bug", "priority:p1", "complexity:medium"]);
  });

  it("falls back to REST over fetch when gh is missing", async () => {
    const f = fake(["bug"], {
      "gh api repos/acme/skills/issues/8": ENOENT(),
      "gh api -X PUT repos/acme/skills/issues/8/labels": ENOENT(),
    });
    const { fn, calls: fetchCalls } = fakeFetch({
      "GET https://api.github.com/repos/acme/skills/issues/8": { status: 200, body: { number: 8, labels: [{ name: "bug" }] } },
      "PUT https://api.github.com/repos/acme/skills/issues/8/labels": { status: 200, body: [] },
    });
    const r = await run(["8", "--area", "cli"], f, { GH_TOKEN: "proxy-injected" }, fn);
    expect(r.code, r.out).toBe(0);
    expect(fetchCalls).toEqual([
      "GET https://api.github.com/repos/acme/skills/issues/8",
      "PUT https://api.github.com/repos/acme/skills/issues/8/labels",
    ]);
  });

  it("makes the same repository-scoped calls in a cloud session", async () => {
    const local = await run(["8", "--area", "cli", "--complexity", "medium"]);
    const cloud = await run(["8", "--area", "cli", "--complexity", "medium"], fake(), { CLAUDE_CODE_REMOTE: "true" });
    expect(cloud.code).toBe(0);
    expect(cloud.calls).toEqual(local.calls);
    for (const call of cloud.calls.filter((c) => c.startsWith("gh api"))) {
      expect(call, call).toMatch(/gh api (-X PUT )?repos\/acme\/skills\//);
    }
  });

  it("refuses a call with no family flag", async () => {
    const r = await run(["8"]);
    expect(r.code).toBe(2);
    expect(r.out.startsWith("Usage: pnpm triage-issue")).toBe(true);
    expect(r.calls).toEqual([]);
  });

  it("refuses an issue number that is not a positive integer", async () => {
    for (const argv of [["--area", "cli"], ["abc", "--area", "cli"], ["0", "--area", "cli"], ["-3", "--area", "cli"]]) {
      const r = await run(argv);
      expect(r.code, argv.join(" ")).toBe(2);
      expect(r.out.startsWith("Usage: pnpm triage-issue")).toBe(true);
      expect(r.calls).toEqual([]);
    }
  });

  it("refuses a value outside its set", async () => {
    for (const argv of [
      ["8", "--priority", "urgent"],
      ["8", "--area", "docs"],
      ["8", "--complexity", "huge"],
    ]) {
      const r = await run(argv);
      expect(r.code, argv.join(" ")).toBe(2);
      expect(r.out.startsWith("Usage: pnpm triage-issue")).toBe(true);
      expect(r.calls).toEqual([]);
    }
  });

  it("refuses an unknown flag or a flag with no value", async () => {
    for (const argv of [
      ["8", "--urgent", "low"],
      ["8", "--area"],
      ["8", "--area", "cli", "9"],
    ]) {
      const r = await run(argv);
      expect(r.code, argv.join(" ")).toBe(2);
      expect(r.out.startsWith("Usage: pnpm triage-issue")).toBe(true);
      expect(r.calls).toEqual([]);
    }
  });

  it("refuses a pull request", async () => {
    const f = fake(["bug"], { "gh api repos/acme/skills/issues/8": ISSUE(["bug"], { pull_request: { url: "https://api.github.com/repos/acme/skills/pulls/8" } }) });
    const r = await run(["8", "--area", "cli"], f);
    expect(r.code).toBe(1);
    expect(r.out).toContain("#8 is a pull request, not an issue");
    expect(puts(r.calls)).toEqual([]);
  });

  it("reports a failed call and writes at most once", async () => {
    const readFailed = await run(["8", "--area", "cli"], fake(["bug"], { "gh api repos/acme/skills/issues/8": Object.assign(new Error("x"), { stderr: "gh: Not Found (HTTP 404)" }) }));
    expect(readFailed.code).toBe(1);
    expect(readFailed.out).toBe("triage-issue failed: gh: Not Found (HTTP 404)\n");
    expect(puts(readFailed.calls)).toEqual([]);

    const writeFailed = await run(
      ["8", "--area", "cli"],
      fake(["bug"], { "gh api -X PUT repos/acme/skills/issues/8/labels": Object.assign(new Error("x"), { stderr: "gh: Validation Failed (HTTP 422)" }) }),
    );
    expect(writeFailed.code).toBe(1);
    expect(writeFailed.out).toBe("triage-issue failed: gh: Validation Failed (HTTP 422)\n");
    expect(puts(writeFailed.calls)).toHaveLength(1);
  });

  it("leaves no trace of set-complexity", () => {
    for (const p of ["tools/set-complexity.ts", "test/repo/set-complexity.test.ts", ".github/workflows/set-complexity.yml"]) {
      expect(existsSync(join(ROOT, p)), p).toBe(false);
    }
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    expect(pkg.scripts["set-complexity"]).toBeUndefined();
    expect(pkg.scripts["triage-issue"]).toBe("tsx tools/triage-issue.ts");
    // This file names the removed paths to assert they are gone, so it excludes itself.
    const hits = spawnSync(
      "git",
      ["grep", "-n", "set-complexity", "--", ".", ":(exclude).changeset/*", ":(exclude)*CHANGELOG.md", ":(exclude)test/repo/triage-issue.test.ts"],
      { cwd: ROOT, encoding: "utf8" },
    );
    expect(hits.stdout.trim()).toBe("");
  });
});
