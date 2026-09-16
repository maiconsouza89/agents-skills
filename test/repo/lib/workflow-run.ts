// Runs the `run` steps of a single-job GitHub Actions workflow locally, the way the runner does:
// in order, with `bash --noprofile --norc -eo pipefail`, GITHUB_ENV carried between steps and the
// event payload at GITHUB_EVENT_PATH. `gh` is replaced by a fake that records every call (args,
// method, GH_TOKEN) and answers from a Project #5 fixture, so a test can assert what the workflow
// would send to GitHub without a runner or a network.
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const ROOT = fileURLToPath(new URL("../../..", import.meta.url));

export const FIELDS: Record<string, string[]> = {
  Priority: ["P0", "P1", "P2", "Backlog"],
  Area: ["CLI", "Core", "Site", "CI", "Catalog"],
  Complexity: ["Low", "Medium", "High"],
};
export const fieldId = (field: string) => `F_${field.toUpperCase()}`;
export const optionId = (field: string, option: string) => `O_${field.toUpperCase()}_${option.toUpperCase()}`;
export const PROJECT_ID = "PVT_5";
export const ITEM_ID = "PVTI_8";
export const ISSUE_NODE_ID = "I_node8";

export interface Failure {
  match: string;
  exit?: number;
  stdout?: string;
  stderr?: string;
}

export interface GhCall {
  args: string[];
  method: string;
  token: string;
  text: string;
}

export interface RunOptions {
  label?: string;
  labels?: string[];
  failures?: Failure[];
  otherResponse?: string;
  // Values for expressions the workflow uses beyond the built-in table (step outputs, inputs).
  expressions?: Record<string, string>;
  // Skip `uses:` steps instead of refusing them, for a workflow whose action step is exercised
  // elsewhere and whose `run` steps are what the test is about.
  skipActions?: boolean;
}

interface Step {
  run?: string;
  uses?: string;
  if?: string;
  env?: Record<string, string>;
}

const FAKE_GH = `#!/usr/bin/env node
const fs = require("node:fs");
const { spawnSync } = require("node:child_process");
const args = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(process.env.FAKE_GH_CONFIG, "utf8"));
const flag = (...names) => {
  const i = args.findIndex((a) => names.includes(a));
  return i >= 0 ? args[i + 1] : undefined;
};
const method = (flag("-X", "--method") || "GET").toUpperCase();
const text = args.join(" ");
fs.appendFileSync(process.env.FAKE_GH_LOG, JSON.stringify({ args, method, token: process.env.GH_TOKEN || "" }) + "\\n");
let stdout = "";
let stderr = "";
let code = 0;
const failure = cfg.failures.find((f) => text.includes(f.match));
if (failure) {
  stdout = failure.stdout || "";
  stderr = failure.stderr || "gh: request failed";
  code = failure.exit === undefined ? 1 : failure.exit;
} else if (args.includes("graphql")) {
  if (text.includes("addProjectV2ItemById")) {
    stdout = JSON.stringify({ data: { addProjectV2ItemById: { item: { id: cfg.itemId } } } });
  } else if (text.includes("updateProjectV2ItemFieldValue")) {
    stdout = JSON.stringify({ data: { updateProjectV2ItemFieldValue: { projectV2Item: { id: cfg.itemId } } } });
  } else if (text.includes("fields(first")) {
    stdout = JSON.stringify({ data: { user: { projectV2: { id: cfg.projectId, fields: { nodes: Object.values(cfg.fields) } } } } });
  } else {
    const m = text.match(/field=(\\w+)/) || text.match(/field\\(name:\\s*\\\\?"(\\w+)/);
    const field = m && cfg.fields[m[1]] ? cfg.fields[m[1]] : null;
    stdout = JSON.stringify({ data: { user: { projectV2: { id: cfg.projectId, field } } } });
  }
} else if (method === "DELETE") {
  stdout = "[]";
} else {
  stdout = cfg.otherResponse || "{}";
}
if (code === 0) {
  const jq = flag("--jq", "-q");
  if (jq) stdout = spawnSync("jq", ["-r", jq], { input: stdout, encoding: "utf8" }).stdout;
  if (args.includes("--silent")) stdout = "";
}
fs.writeSync(1, stdout);
fs.writeSync(2, stderr);
process.exit(code);
`;

function parseEnvFile(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const heredoc = lines[i].match(/^([A-Za-z_][A-Za-z0-9_]*)<<(.+)$/);
    if (heredoc) {
      const body: string[] = [];
      for (i++; i < lines.length && lines[i] !== heredoc[2]; i++) body.push(lines[i]);
      out[heredoc[1]] = body.join("\n");
      continue;
    }
    const eq = lines[i].indexOf("=");
    if (eq > 0) out[lines[i].slice(0, eq)] = lines[i].slice(eq + 1);
  }
  return out;
}

export function runWorkflow(name: string, opts: RunOptions) {
  const wf = parse(readFileSync(join(ROOT, ".github/workflows", name), "utf8"));
  const jobs = Object.values(wf.jobs) as Array<{ env?: Record<string, string>; steps: Step[] }>;
  if (jobs.length !== 1) throw new Error(`${name}: runWorkflow supports a single job, found ${jobs.length}`);
  const job = jobs[0];

  // A closed table: an expression the workflow uses that is not listed here fails the test
  // instead of silently resolving to an empty string.
  const expressions: Record<string, string> = {
    "secrets.PROJECT_TOKEN": "project-token",
    "github.token": "github-token",
    "secrets.GITHUB_TOKEN": "github-token",
    "github.event.issue.number": "8",
    "github.event.issue.number || inputs.issue": "8",
    "github.event.issue.node_id": ISSUE_NODE_ID,
    "github.event.label.name": opts.label ?? "",
    "github.repository": "acme/skills",
    "github.repository_owner": "acme",
    ...opts.expressions,
  };
  const resolve = (env: Record<string, string> = {}) =>
    Object.fromEntries(
      Object.entries(env).map(([k, v]) => [
        k,
        String(v).replace(/\$\{\{\s*(.+?)\s*\}\}/g, (_, expr: string) => {
          if (!(expr in expressions)) throw new Error(`${name}: unresolved expression \${{ ${expr} }} in env ${k}`);
          return expressions[expr];
        }),
      ]),
    );

  const dir = mkdtempSync(join(tmpdir(), "workflow-run-"));
  try {
    const bin = join(dir, "bin");
    const work = join(dir, "work");
    mkdirSync(bin);
    mkdirSync(work);
    writeFileSync(join(bin, "gh"), FAKE_GH);
    chmodSync(join(bin, "gh"), 0o755);

    const fields = Object.fromEntries(
      Object.entries(FIELDS).map(([f, options]) => [f, { id: fieldId(f), name: f, options: options.map((o) => ({ id: optionId(f, o), name: o })) }]),
    );
    const config = join(dir, "gh-config.json");
    writeFileSync(
      config,
      JSON.stringify({ fields, projectId: PROJECT_ID, itemId: ITEM_ID, failures: opts.failures ?? [], otherResponse: opts.otherResponse }),
    );
    const log = join(dir, "gh-calls.jsonl");
    writeFileSync(log, "");
    const event = join(dir, "event.json");
    writeFileSync(
      event,
      JSON.stringify({
        action: opts.label ? "labeled" : "opened",
        label: opts.label ? { name: opts.label } : undefined,
        issue: { number: 8, node_id: ISSUE_NODE_ID, labels: (opts.labels ?? (opts.label ? [opts.label] : [])).map((l) => ({ name: l })) },
        repository: { full_name: "acme/skills", owner: { login: "acme" } },
      }),
    );
    const envFile = join(dir, "github-env");

    const { GH_TOKEN: _gh, GITHUB_TOKEN: _github, ...inherited } = process.env;
    let carried: Record<string, string> = {};
    let output = "";
    let code = 0;
    for (const step of job.steps) {
      if (step.uses) {
        if (opts.skipActions) continue;
        throw new Error(`${name}: runWorkflow cannot run action steps (${step.uses})`);
      }
      if (step.if) throw new Error(`${name}: runWorkflow cannot evaluate step conditions (${step.if})`);
      if (!step.run) continue;
      writeFileSync(envFile, "");
      const r = spawnSync("bash", ["--noprofile", "--norc", "-eo", "pipefail", "-c", step.run], {
        cwd: work,
        encoding: "utf8",
        env: {
          ...inherited,
          PATH: `${bin}:${process.env.PATH}`,
          GITHUB_EVENT_PATH: event,
          GITHUB_ENV: envFile,
          GITHUB_REPOSITORY: "acme/skills",
          GITHUB_REPOSITORY_OWNER: "acme",
          FAKE_GH_CONFIG: config,
          FAKE_GH_LOG: log,
          ...resolve(wf.env),
          ...resolve(job.env),
          ...carried,
          ...resolve(step.env),
        },
      });
      output += r.stdout + r.stderr;
      carried = { ...carried, ...parseEnvFile(readFileSync(envFile, "utf8")) };
      if (r.status !== 0) {
        code = r.status ?? 1;
        break;
      }
    }

    const calls: GhCall[] = readFileSync(log, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const c = JSON.parse(line) as Omit<GhCall, "text">;
        return { ...c, text: c.args.join(" ") };
      });
    return { code, output, calls };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
