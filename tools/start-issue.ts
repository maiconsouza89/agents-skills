#!/usr/bin/env node
// Start work on an issue: a branch for it and the issue assigned to you.
// A GitHub Actions workflow (project-board.yml) adds the issue to the project board and moves it
// to "In Progress" when it sees the assignment, because that workflow needs GraphQL to talk to
// Projects v2 and the Claude Code cloud sandbox blocks GraphQL except a pinned set of PR
// operations - this script only uses REST and plain git so it works the same way everywhere.
// Usage: pnpm start-issue <number> [--base main] [--assignee <login>]
import { execFileSync } from "node:child_process";

export type Exec = (cmd: string, args: string[]) => string;
export type FetchLike = typeof fetch;

export interface Issue {
  number: number;
  title: string;
  labels: string[];
}

interface Out {
  write(s: string): unknown;
}

const USAGE = "Usage: pnpm start-issue <number> [--base main] [--assignee <login>]\n";
const TYPE_BY_LABEL: Record<string, string> = { bug: "fix", "skill-bug": "fix", documentation: "docs" };
const SLUG_MAX = 40;
const MCP_HINT = "If this is a Claude Code web session, ask Claude to read/assign the issue through the GitHub MCP tool instead.";

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

function positional(argv: string[]): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) i++;
    else return argv[i];
  }
  return undefined;
}

const defaultExec: Exec = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

// `<type>/<number>-<slug>`: the type comes from the labels, the slug from the title without its `area:` prefix, cut at a word.
export function branchName(issue: Issue): string {
  const type = issue.labels.map((l) => TYPE_BY_LABEL[l]).find(Boolean) ?? "feat";
  const words = issue.title.replace(/^[a-z0-9-]+:\s*/i, "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  let slug = "";
  for (const w of words) {
    const next = slug ? `${slug}-${w}` : w;
    if (next.length > SLUG_MAX) break;
    slug = next;
  }
  return `${type}/${issue.number}-${slug || words[0]?.slice(0, SLUG_MAX) || "issue"}`;
}

// Reads the repo's `owner/name` from the origin remote instead of `gh repo view`, which is GraphQL
// and fails behind the Claude Code cloud sandbox's GitHub proxy.
export function ownerAndName(remoteUrl: string): { owner: string; name: string } {
  const m = remoteUrl.trim().match(/github\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/);
  if (!m) throw new Error(`origin remote is not a github.com URL: ${remoteUrl.trim()}`);
  return { owner: m[1], name: m[2] };
}

// Calls the GitHub REST API for one endpoint. Prefers the `gh` CLI (already authenticated, and
// the only path exercised locally); if `gh` itself is missing (ENOENT - seen in some Claude Code
// web sessions even though it's documented as pre-installed there), falls back to a direct HTTPS
// call authenticated with GH_TOKEN/GITHUB_TOKEN, which the session's GitHub proxy populates.
async function ghApi(
  exec: Exec,
  fetchImpl: FetchLike,
  env: NodeJS.ProcessEnv,
  method: "GET" | "POST",
  path: string,
  ghArgs: string[],
  jsonBody?: unknown,
): Promise<any> {
  try {
    const out = exec("gh", ghArgs);
    return out.trim() ? JSON.parse(out) : undefined;
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") throw e;
    const token = env.GH_TOKEN || env.GITHUB_TOKEN;
    if (!token) throw new Error(`gh CLI not found and no GH_TOKEN/GITHUB_TOKEN in the environment. ${MCP_HINT}`);
    const res = await fetchImpl(`https://api.github.com/${path}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        ...(jsonBody ? { "content-type": "application/json" } : {}),
      },
      body: jsonBody ? JSON.stringify(jsonBody) : undefined,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`gh CLI not found; the GitHub REST API fallback also failed (${res.status} ${text.slice(0, 200)}). ${MCP_HINT}`);
    return text.trim() ? JSON.parse(text) : undefined;
  }
}

export async function main(
  argv: string[],
  out: Out = process.stdout,
  exec: Exec = defaultExec,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: FetchLike = fetch,
): Promise<number> {
  const number = Number(positional(argv));
  if (!Number.isInteger(number) || number <= 0) {
    out.write(USAGE);
    return 2;
  }
  const base = flag(argv, "--base") ?? "main";
  const cloud = env.CLAUDE_CODE_REMOTE === "true";
  try {
    const { owner, name: repo } = ownerAndName(exec("git", ["remote", "get-url", "origin"]));

    const view = (await ghApi(exec, fetchImpl, env, "GET", `repos/${owner}/${repo}/issues/${number}`, [
      "api",
      `repos/${owner}/${repo}/issues/${number}`,
    ])) as {
      title: string;
      state: string;
      html_url: string;
      labels: Array<{ name: string }>;
      assignees: Array<{ login: string }>;
      pull_request?: unknown;
    };
    if (view.pull_request) {
      out.write(`#${number} is a pull request, not an issue.\n`);
      return 1;
    }
    if (view.state !== "open") {
      out.write(`Issue #${number} is ${view.state}; nothing to start.\n`);
      return 1;
    }

    let assignee = flag(argv, "--assignee");
    if (!assignee) {
      try {
        const me = (await ghApi(exec, fetchImpl, env, "GET", "user", ["api", "user"])) as { login: string };
        assignee = me.login;
      } catch (e) {
        const err = e as { stderr?: string; message?: string };
        out.write(
          `Could not resolve the current GitHub user (${err.stderr?.trim() || err.message}); pass --assignee <login>.\n`,
        );
        return 1;
      }
    }

    if (exec("git", ["status", "--porcelain"]).trim()) {
      out.write("The working tree has uncommitted changes; commit or stash them first.\n");
      return 1;
    }

    let branch: string | undefined;
    if (cloud) {
      branch = exec("git", ["branch", "--show-current"]).trim();
      out.write(`Claude Code web session: staying on ${branch}; push is limited to the session's branch.\n`);
    } else {
      const wanted = branchName({ number, title: view.title, labels: view.labels.map((l) => l.name) });
      const remoteMatch = exec("git", ["ls-remote", "--heads", "origin"])
        .split("\n")
        .map((l) => l.split("\t")[1]?.replace(/^refs\/heads\//, ""))
        .find((b) => b && new RegExp(`^(feat|fix|docs)/${number}-`).test(b));
      const localMatch = exec("git", ["branch", "--list", `*/${number}-*`])
        .split("\n")
        .map((l) => l.replace(/^\*?\s+/, "").trim())
        .find((b) => new RegExp(`^(feat|fix|docs)/${number}-`).test(b));
      branch = remoteMatch ?? localMatch;
      if (branch) {
        exec("git", ["fetch", "origin", branch]);
        exec("git", ["switch", branch]);
        out.write(`Switched to the linked branch ${branch}\n`);
      } else {
        branch = wanted;
        exec("git", ["fetch", "origin", base]);
        exec("git", ["switch", "-c", branch, `origin/${base}`]);
        exec("git", ["push", "-u", "origin", branch]);
        out.write(`Created and pushed ${branch}\n`);
      }
    }

    if (view.assignees.some((a) => a.login === assignee)) {
      out.write(`#${number} ${view.title}: already assigned to ${assignee}; the board keeps its current Status.\n`);
      return 0;
    }
    await ghApi(
      exec,
      fetchImpl,
      env,
      "POST",
      `repos/${owner}/${repo}/issues/${number}/assignees`,
      ["api", "-X", "POST", `repos/${owner}/${repo}/issues/${number}/assignees`, "-f", `assignees[]=${assignee}`],
      { assignees: [assignee] },
    );

    out.write(`#${number} ${view.title}: assigned to ${assignee}; the project-board workflow moves it to In Progress.\n`);
    return 0;
  } catch (e) {
    const err = e as { stderr?: string; message?: string };
    out.write(`start-issue failed: ${err.stderr?.trim() || err.message}\n`);
    return 1;
  }
}

if (process.argv[1]?.endsWith("start-issue.ts") || process.argv[1]?.endsWith("start-issue.js")) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
