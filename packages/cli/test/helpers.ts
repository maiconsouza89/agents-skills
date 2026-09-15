import { createServer, type Server } from "node:http";
import { mkdirSync, mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildRegistry, type Registry } from "@mass-solutions/skills-core";
import { makeRoot, makeSkill, validFrontmatter } from "../../core/test/helpers.js";
import { run } from "../src/run.js";
import type { RunContext } from "../src/types.js";

export { makeRoot, makeSkill, validFrontmatter };

export const NOW = new Date("2026-09-14T12:00:00.000Z");

/** A catalog root with three skills covering the shapes the CLI has to handle. */
export function makeCatalog(deprecated: Record<string, unknown> = {}): string {
  const root = makeRoot(deprecated);
  makeSkill(root, "mass-alpha", {
    body: "# Alpha\n\nSee [ref](references/guide.md).\n",
    files: { "references/guide.md": "guide\n", "scripts/run.sh": "#!/bin/sh\necho hi\n" },
    executable: ["scripts/run.sh"],
  });
  makeSkill(root, "mass-beta", {
    frontmatter: validFrontmatter("mass-beta", { category: "quality", tags: '"review, quality"' }).replace(
      "Does one thing.",
      "Reviews code for defects.",
    ),
    body: "# Beta\n",
  });
  makeSkill(root, "mass-gamma", { body: "# Gamma\n", files: { "assets/t.md": "template\n" } });
  return root;
}

export type Override = Buffer | "fail" | 404;

export interface Fixture {
  root: string;
  registry: Registry;
  baseUrl: string;
  /** Per-URL-path overrides (path after `/<ref>/`), e.g. `skills/mass-alpha/SKILL.md`. */
  overrides: Map<string, Override>;
  /** Count of requests per path. */
  hits: Map<string, number>;
  close(): Promise<void>;
}

/** Serve `<root>` over HTTP the way raw.githubusercontent.com would: `/<ref>/skills-registry.json` and `/<ref>/<path>`. */
export async function serveCatalog(root: string, ref = "main"): Promise<Fixture> {
  const registry = buildRegistry(root, { now: NOW });
  const overrides = new Map<string, Override>();
  const hits = new Map<string, number>();
  const fixture: Partial<Fixture> = { root, registry, overrides, hits };
  const server: Server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const prefix = `/${ref}/`;
    if (!url.pathname.startsWith(prefix)) {
      res.writeHead(404).end();
      return;
    }
    const rel = decodeURIComponent(url.pathname.slice(prefix.length));
    hits.set(rel, (hits.get(rel) ?? 0) + 1);
    const ov = overrides.get(rel);
    if (ov === 404) {
      res.writeHead(404).end("not found");
      return;
    }
    if (ov === "fail") {
      req.socket.destroy();
      return;
    }
    if (ov instanceof Buffer) {
      res.writeHead(200).end(ov);
      return;
    }
    if (rel === "skills-registry.json") {
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(fixture.registry));
      return;
    }
    const file = join(root, rel);
    if (!existsSync(file)) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200).end(readFileSync(file));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;
  fixture.baseUrl = `http://127.0.0.1:${port}/`;
  fixture.close = () => new Promise<void>((r) => server.close(() => r()));
  return fixture as Fixture;
}

export interface Project {
  cwd: string;
  home: string;
  env: NodeJS.ProcessEnv;
}

/** A temp project dir and a temp home, with the env the CLI reads. */
export function makeProject(fixture: Fixture, markers: string[] = [".claude"]): Project {
  const cwd = mkdtempSync(join(tmpdir(), "mass-cli-proj-"));
  const home = mkdtempSync(join(tmpdir(), "mass-cli-home-"));
  for (const m of markers) mkdirSync(join(cwd, m), { recursive: true });
  return { cwd, home, env: { HOME: home, MASS_SKILLS_BASE_URL: fixture.baseUrl } };
}

export interface Result {
  code: number;
  stdout: string;
  stderr: string;
}

export async function cli(project: Project, argv: string[], fetchImpl?: typeof fetch): Promise<Result> {
  let stdout = "";
  let stderr = "";
  const ctx: RunContext = {
    cwd: project.cwd,
    env: project.env,
    stdout: { write: (s: string) => (stdout += s) },
    stderr: { write: (s: string) => (stderr += s) },
  };
  const code = await run(argv, ctx, { fetchImpl, now: NOW });
  return { code, stdout, stderr };
}

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}
