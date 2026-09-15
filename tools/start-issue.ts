#!/usr/bin/env node
// Start work on an issue: a branch linked to it, the issue assigned to you and its project item set to "In Progress".
// Usage: pnpm start-issue <number> [--project 5] [--owner <login>] [--base main]
import { execFileSync } from "node:child_process";

export type Exec = (cmd: string, args: string[]) => string;

export interface Issue {
  number: number;
  title: string;
  labels: string[];
}

interface Field {
  id: string;
  name: string;
  options?: Array<{ id: string; name: string }>;
}

const USAGE = "Usage: pnpm start-issue <number> [--project 5] [--owner <login>] [--base main]\n";
const TYPE_BY_LABEL: Record<string, string> = { bug: "fix", documentation: "docs" };
const SLUG_MAX = 40;

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

export function main(argv: string[], out: { write(s: string): unknown } = process.stdout, exec: Exec = defaultExec): number {
  const number = Number(positional(argv));
  if (!Number.isInteger(number) || number <= 0) {
    out.write(USAGE);
    return 2;
  }
  const project = flag(argv, "--project") ?? "5";
  const base = flag(argv, "--base") ?? "main";
  try {
    const repo = JSON.parse(exec("gh", ["repo", "view", "--json", "owner,name"])) as { owner: { login: string }; name: string };
    const owner = flag(argv, "--owner") ?? repo.owner.login;
    const view = JSON.parse(exec("gh", ["issue", "view", String(number), "--json", "number,title,state,url,labels"])) as {
      title: string;
      state: string;
      url: string;
      labels: Array<{ name: string }>;
    };
    if (view.state !== "OPEN") {
      out.write(`Issue #${number} is ${view.state.toLowerCase()}; nothing to start.\n`);
      return 1;
    }
    if (exec("git", ["status", "--porcelain"]).trim()) {
      out.write("The working tree has uncommitted changes; commit or stash them first.\n");
      return 1;
    }

    // Resolve the project and its Status option before creating anything, so a wrong project fails early.
    const { fields } = JSON.parse(exec("gh", ["project", "field-list", project, "--owner", owner, "--format", "json"])) as { fields: Field[] };
    const status = fields.find((f) => f.name === "Status");
    const inProgress = status?.options?.find((o) => o.name === "In Progress");
    if (!status || !inProgress) {
      out.write(`Project ${project} of ${owner} has no Status option "In Progress".\n`);
      return 1;
    }
    const projectId = (JSON.parse(exec("gh", ["project", "view", project, "--owner", owner, "--format", "json"])) as { id: string }).id;

    const linked = exec("gh", ["issue", "develop", "--list", String(number)])
      .split("\n")
      .map((line) => line.split("\t")[0].trim())
      .filter(Boolean);
    let branch: string;
    if (linked.length > 0) {
      branch = linked[0];
      exec("git", ["fetch", "origin", branch]);
      exec("git", ["switch", branch]);
      out.write(`Switched to the linked branch ${branch}\n`);
    } else {
      branch = branchName({ number, title: view.title, labels: view.labels.map((l) => l.name) });
      exec("gh", ["issue", "develop", String(number), "--base", base, "--checkout", "--name", branch]);
      out.write(`Created and checked out ${branch}\n`);
    }

    exec("gh", ["issue", "edit", String(number), "--add-assignee", "@me"]);

    const items = JSON.parse(
      exec("gh", [
        "api",
        "graphql",
        "-f",
        "query=query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){issue(number:$number){projectItems(first:20){nodes{id project{number}}}}}}",
        "-f",
        `owner=${repo.owner.login}`,
        "-f",
        `name=${repo.name}`,
        "-F",
        `number=${number}`,
      ]),
    ) as { data: { repository: { issue: { projectItems: { nodes: Array<{ id: string; project: { number: number } }> } } } } };
    let itemId = items.data.repository.issue.projectItems.nodes.find((n) => n.project.number === Number(project))?.id;
    if (!itemId) {
      itemId = (JSON.parse(exec("gh", ["project", "item-add", project, "--owner", owner, "--url", view.url, "--format", "json"])) as { id: string }).id;
    }
    exec("gh", ["project", "item-edit", "--id", itemId, "--project-id", projectId, "--field-id", status.id, "--single-select-option-id", inProgress.id]);

    out.write(`#${number} ${view.title}: assigned to you and In Progress in project ${project}\n`);
    return 0;
  } catch (e) {
    const err = e as { stderr?: string; message?: string };
    out.write(`start-issue failed: ${err.stderr?.trim() || err.message}\n`);
    return 1;
  }
}

if (process.argv[1]?.endsWith("start-issue.ts") || process.argv[1]?.endsWith("start-issue.js")) {
  process.exit(main(process.argv.slice(2)));
}
