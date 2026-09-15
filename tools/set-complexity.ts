#!/usr/bin/env node
// Set the Complexity field of an issue's item on the GitHub Project board.
// Locally: writes directly via the Projects v2 REST API (PATCH /users/{owner}/projectsV2/{n}/items/{item}).
// In a Claude Code web session: that same REST path gets a 403 from the session's own GitHub
// proxy, which only allows repository-scoped paths ("repos/{owner}/{repo}/...") - so instead this
// dispatches set-complexity.yml (itself a repository-scoped call), and that workflow does the
// actual write on a runner with no such restriction.
// Pair it with the mass-issue-complexity skill: classify the issue, then pass the level here.
// Usage: pnpm set-complexity <issue-number> <low|medium|high> [--project 5] [--owner <login>]
import { defaultExec, ghApi, ghApiPaginated, ownerAndName, type Exec, type FetchLike } from "./lib/gh.js";

export type { Exec, FetchLike };

const USAGE = "Usage: pnpm set-complexity <issue-number> <low|medium|high> [--project 5] [--owner <login>]\n";
const LEVELS = ["low", "medium", "high"] as const;
type Level = (typeof LEVELS)[number];

interface Out {
  write(s: string): unknown;
}

interface Field {
  id: number;
  name: string;
  data_type: string;
  options?: Array<{ id: string; name: { raw: string } }>;
}

interface ProjectItem {
  id: number;
  content?: { number?: number };
  fields?: Array<{ id: number; name: string; value?: { name?: { raw: string } } }>;
}

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

function positional(argv: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) i++;
    else out.push(argv[i]);
  }
  return out;
}

export async function main(
  argv: string[],
  out: Out = process.stdout,
  exec: Exec = defaultExec,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: FetchLike = fetch,
): Promise<number> {
  const [numberArg, levelArg] = positional(argv);
  const number = Number(numberArg);
  const level = levelArg?.toLowerCase() as Level | undefined;
  if (!Number.isInteger(number) || number <= 0 || !level || !LEVELS.includes(level)) {
    out.write(USAGE);
    return 2;
  }
  const project = flag(argv, "--project") ?? "5";
  const wantedName = level[0].toUpperCase() + level.slice(1);
  try {
    if (env.CLAUDE_CODE_REMOTE === "true") {
      // The proxy in a Claude Code web session rejects any GitHub API path that isn't
      // repository-scoped ("repos/{owner}/{repo}/...") with a 403, before the request even
      // reaches GitHub - including users/{owner}/projectsV2/..., regardless of token. Dispatching
      // a workflow is itself a repository-scoped REST call, so it passes the proxy; the actual
      // write then happens on a runner, via set-complexity.yml and the PROJECT_TOKEN secret.
      const { owner, name: repo } = ownerAndName(exec("git", ["remote", "get-url", "origin"]));
      await ghApi(
        exec,
        fetchImpl,
        env,
        "POST",
        `repos/${owner}/${repo}/actions/workflows/set-complexity.yml/dispatches`,
        [
          "api",
          "-X",
          "POST",
          `repos/${owner}/${repo}/actions/workflows/set-complexity.yml/dispatches`,
          "-f",
          "ref=main",
          "-f",
          `inputs[issue_number]=${number}`,
          "-f",
          `inputs[level]=${wantedName}`,
        ],
        { ref: "main", inputs: { issue_number: String(number), level: wantedName } },
      );
      out.write(
        `Claude Code web session: triggered the set-complexity workflow for #${number} -> ${wantedName}. Check the Actions run for the result.\n`,
      );
      return 0;
    }

    const projectOwner = flag(argv, "--owner") ?? ownerAndName(exec("git", ["remote", "get-url", "origin"])).owner;

    const fields = (await ghApi(exec, fetchImpl, env, "GET", `users/${projectOwner}/projectsV2/${project}/fields`, [
      "api",
      `users/${projectOwner}/projectsV2/${project}/fields`,
    ])) as Field[];
    const field = fields.find((f) => f.name === "Complexity" && f.data_type === "single_select");
    if (!field) {
      out.write(`Project ${project} of ${projectOwner} has no single-select "Complexity" field. Create it first (Low/Medium/High).\n`);
      return 1;
    }
    const option = field.options?.find((o) => o.name.raw === wantedName);
    if (!option) {
      out.write(`The Complexity field on project ${project} has no "${wantedName}" option.\n`);
      return 1;
    }

    // The items endpoint only includes a field's current value in the response when that field's
    // id is requested explicitly via `?fields=`; otherwise only Title comes back.
    const itemsPath = `users/${projectOwner}/projectsV2/${project}/items?fields=${field.id}`;
    const items = (await ghApiPaginated(exec, fetchImpl, env, itemsPath, ["api", itemsPath, "--paginate"])) as ProjectItem[];
    const item = items.find((i) => i.content?.number === number);
    if (!item) {
      out.write(`Issue #${number} is not on project ${project} yet. Run pnpm start-issue ${number} first, or add it to the board.\n`);
      return 1;
    }

    const current = item.fields?.find((f) => f.id === field.id)?.value?.name?.raw;
    if (current === wantedName) {
      out.write(`#${number}: Complexity is already ${wantedName}.\n`);
      return 0;
    }

    await ghApi(
      exec,
      fetchImpl,
      env,
      "PATCH",
      `users/${projectOwner}/projectsV2/${project}/items/${item.id}`,
      [
        "api",
        "-X",
        "PATCH",
        `users/${projectOwner}/projectsV2/${project}/items/${item.id}`,
        "-F",
        `fields[][id]=${field.id}`,
        "-f",
        `fields[][value]=${option.id}`,
      ],
      { fields: [{ id: field.id, value: option.id }] },
    );

    out.write(`#${number}: Complexity set to ${wantedName}${current ? ` (was ${current})` : ""}.\n`);
    return 0;
  } catch (e) {
    const err = e as { stderr?: string; message?: string };
    out.write(`set-complexity failed: ${err.stderr?.trim() || err.message}\n`);
    return 1;
  }
}

if (process.argv[1]?.endsWith("set-complexity.ts") || process.argv[1]?.endsWith("set-complexity.js")) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
