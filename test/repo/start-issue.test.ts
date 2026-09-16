import { describe, expect, it } from "vitest";
import { branchName, main, ownerAndName, type FetchLike } from "../../tools/start-issue.js";
import { ENOENT, fakeExec, fakeFetch, unusedFetch } from "./lib/gh-fakes.js";

const ISSUE = {
  number: 8,
  title: "cli: pin the default download ref to the release tag",
  state: "open",
  html_url: "https://github.com/acme/skills/issues/8",
  labels: [{ name: "enhancement" }],
  assignees: [] as Array<{ login: string }>,
};

function fake(overrides: Record<string, string | Error> = {}) {
  return fakeExec({
    "git remote get-url origin": "https://github.com/acme/skills.git\n",
    "gh api repos/acme/skills/issues/8": JSON.stringify(ISSUE),
    "gh api user": JSON.stringify({ login: "octocat" }),
    "git status --porcelain": "",
    "git ls-remote --heads origin": "",
    "git branch --list": "",
    "git branch --show-current": "feat/8-session-branch\n",
    ...overrides,
  });
}

async function run(argv: string[], f = fake(), env: NodeJS.ProcessEnv = {}, fetchImpl: FetchLike = unusedFetch) {
  let out = "";
  const code = await main(argv, { write: (s: string) => (out += s) }, f.exec, env, fetchImpl);
  return { code, out, calls: f.calls };
}

const writes = (calls: string[]) => calls.filter((c) => /^git (fetch|switch|push)|^gh api -X POST/.test(c));

describe("start-issue", () => {
  it("names the branch from the labels and the title, cutting the slug at a word", () => {
    expect(branchName({ number: 8, title: ISSUE.title, labels: ["enhancement"] })).toBe("feat/8-pin-the-default-download-ref-to-the");
    expect(branchName({ number: 15, title: "cli: `mass-skills --version` fails with unknown option", labels: ["bug"] })).toBe(
      "fix/15-mass-skills-version-fails-with-unknown",
    );
    expect(branchName({ number: 9, title: "A skill fails to install", labels: ["skill-bug"] })).toBe("fix/9-a-skill-fails-to-install");
    expect(branchName({ number: 3, title: "Update the README", labels: ["documentation"] })).toBe("docs/3-update-the-readme");
  });

  it("reads owner and name from https and ssh origin remotes", () => {
    expect(ownerAndName("https://github.com/acme/skills.git\n")).toEqual({ owner: "acme", name: "skills" });
    expect(ownerAndName("git@github.com:acme/skills.git")).toEqual({ owner: "acme", name: "skills" });
    expect(ownerAndName("https://github.com/acme/skills")).toEqual({ owner: "acme", name: "skills" });
  });

  it("creates and pushes a new branch, then assigns the issue", async () => {
    const r = await run(["8"]);
    expect(r.code).toBe(0);
    expect(writes(r.calls)).toEqual([
      "git fetch origin main",
      "git switch -c feat/8-pin-the-default-download-ref-to-the origin/main",
      "git push -u origin feat/8-pin-the-default-download-ref-to-the",
      "gh api -X POST repos/acme/skills/issues/8/assignees -f assignees[]=octocat",
    ]);
    expect(r.out).toContain("assigned to octocat");
    expect(r.out).toContain("project-board workflow moves it to In Progress");
  });

  it("switches to an already linked branch instead of creating another", async () => {
    const r = await run(["8"], fake({ "git ls-remote --heads origin": "abc123\trefs/heads/feat/8-custom\n" }));
    expect(r.code).toBe(0);
    expect(writes(r.calls)).toEqual([
      "git fetch origin feat/8-custom",
      "git switch feat/8-custom",
      "gh api -X POST repos/acme/skills/issues/8/assignees -f assignees[]=octocat",
    ]);
  });

  it("switches to a branch that exists only locally without fetching it from the remote", async () => {
    const r = await run(["8"], fake({ "git branch --list": "* feat/8-local-only\n" }));
    expect(r.code).toBe(0);
    expect(writes(r.calls)).toEqual([
      "git switch feat/8-local-only",
      "gh api -X POST repos/acme/skills/issues/8/assignees -f assignees[]=octocat",
    ]);
    expect(r.out).toContain("assigned to octocat");
  });

  it("honours --base when creating a new branch", async () => {
    const r = await run(["8", "--base", "develop"]);
    expect(r.code).toBe(0);
    expect(writes(r.calls)[0]).toBe("git fetch origin develop");
    expect(writes(r.calls)[1]).toBe("git switch -c feat/8-pin-the-default-download-ref-to-the origin/develop");
  });

  it("honours --assignee instead of resolving the current gh user", async () => {
    const r = await run(["8", "--assignee", "someone-else"]);
    expect(r.code).toBe(0);
    expect(r.calls.some((c) => c === "gh api user")).toBe(false);
    expect(writes(r.calls).at(-1)).toBe("gh api -X POST repos/acme/skills/issues/8/assignees -f assignees[]=someone-else");
  });

  it("does not re-assign an issue already assigned to the target user", async () => {
    const r = await run(["8"], fake({ "gh api repos/acme/skills/issues/8": JSON.stringify({ ...ISSUE, assignees: [{ login: "octocat" }] }) }));
    expect(r.code).toBe(0);
    expect(r.out).toContain("already assigned to octocat");
    expect(writes(r.calls).some((c) => c.startsWith("gh api -X POST"))).toBe(false);
  });

  it("stays on the session's branch and only assigns in a Claude Code web (cloud) session", async () => {
    const r = await run(["8"], fake(), { CLAUDE_CODE_REMOTE: "true" });
    expect(r.code).toBe(0);
    expect(r.calls.some((c) => c.startsWith("git ls-remote") || c.startsWith("git fetch") || c.startsWith("git switch") || c.startsWith("git push"))).toBe(
      false,
    );
    expect(r.out).toContain("staying on feat/8-session-branch");
    expect(writes(r.calls)).toEqual(["gh api -X POST repos/acme/skills/issues/8/assignees -f assignees[]=octocat"]);
  });

  it("falls back to a direct REST call over fetch when gh itself is missing (ENOENT), using GH_TOKEN", async () => {
    const f = fake({
      "gh api repos/acme/skills/issues/8": ENOENT(),
      "gh api -X POST repos/acme/skills/issues/8/assignees": ENOENT(),
    });
    const { fn, calls: fetchCalls } = fakeFetch({
      "GET https://api.github.com/repos/acme/skills/issues/8": { status: 200, body: ISSUE },
      "POST https://api.github.com/repos/acme/skills/issues/8/assignees": { status: 201, body: { id: 1 } },
    });
    const r = await run(["8", "--assignee", "octocat"], f, { GH_TOKEN: "proxy-injected" }, fn);
    expect(r.code).toBe(0);
    expect(fetchCalls).toEqual([
      "GET https://api.github.com/repos/acme/skills/issues/8",
      "POST https://api.github.com/repos/acme/skills/issues/8/assignees",
    ]);
    expect(r.out).toContain("assigned to octocat");
  });

  it("fails with a clear message pointing at the GitHub MCP tool when gh is missing and no token is available", async () => {
    const f = fake({ "gh api repos/acme/skills/issues/8": ENOENT() });
    const r = await run(["8"], f, {});
    expect(r.code).toBe(1);
    expect(r.out).toContain("gh CLI not found");
    expect(r.out).toContain("GitHub MCP tool");
  });

  it("fails with a clear message when gh is missing and the REST fallback itself fails", async () => {
    const f = fake({ "gh api repos/acme/skills/issues/8": ENOENT() });
    const { fn } = fakeFetch({
      "GET https://api.github.com/repos/acme/skills/issues/8": { status: 401, body: { message: "Bad credentials" } },
    });
    const r = await run(["8"], f, { GH_TOKEN: "bad-token" }, fn);
    expect(r.code).toBe(1);
    expect(r.out).toContain("401");
    expect(r.out).toContain("GitHub MCP tool");
  });

  it("refuses without writing anything", async () => {
    const cases = [
      fake({ "gh api repos/acme/skills/issues/8": JSON.stringify({ ...ISSUE, state: "closed" }) }),
      fake({ "gh api repos/acme/skills/issues/8": JSON.stringify({ ...ISSUE, pull_request: {} }) }),
      fake({ "git status --porcelain": " M README.md\n" }),
      fake({ "gh api user": Object.assign(new Error("exit 1"), { stderr: "not logged in\n" }) }),
      fake({ "gh api repos/acme/skills/issues/8": Object.assign(new Error("exit 1"), { stderr: "no issue found\n" }) }),
    ];
    const outputs = ["is closed", "is a pull request", "uncommitted changes", "not logged in", "start-issue failed: no issue found"];
    for (const [i, f] of cases.entries()) {
      const r = await run(["8"], f);
      expect(r.code, outputs[i]).toBe(1);
      expect(r.out).toContain(outputs[i]);
      expect(writes(r.calls)).toEqual([]);
    }
  });

  it("prints usage and exits 2 without an issue number", async () => {
    const r = await run(["--base", "main"]);
    expect(r.code).toBe(2);
    expect(r.out).toMatch(/^Usage: pnpm start-issue <number>/);
    expect(r.calls).toEqual([]);
  });
});
