import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

export const SITE_ROOT = fileURLToPath(new URL("..", import.meta.url));
export const REPO_ROOT = join(SITE_ROOT, "..", "..");
export const DIST = join(SITE_ROOT, "dist");
export const BASE = "/mass-solutions-skills/";

/** Run `astro build` for the site; `outDir` and `env` allow a fixture build next to the real one. */
export function buildSite(outDir = DIST, env: Record<string, string> = {}): void {
  // Test files run in parallel; two `astro build`s at once clobber each other, so builds take a lock.
  const lock = join(SITE_ROOT, ".astro-build.lock");
  const deadline = Date.now() + 180_000;
  for (;;) {
    try {
      mkdirSync(lock);
      break;
    } catch {
      if (Date.now() > deadline) throw new Error("timed out waiting for the astro build lock");
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
    }
  }
  try {
    runBuild(outDir, env);
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
}

function runBuild(outDir: string, env: Record<string, string>): void {
  // vitest exports BASE_URL=/ into process.env, which would override Astro's `base`; the build must not inherit it.
  const { BASE_URL: _ignored, ...inherited } = process.env;
  execFileSync("pnpm", ["exec", "astro", "build", "--outDir", outDir], {
    cwd: SITE_ROOT,
    env: { ...inherited, ASTRO_TELEMETRY_DISABLED: "1", ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export function walk(dir: string, base = dir): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p, base));
    else out.push(relative(base, p).split("\\").join("/"));
  }
  return out.sort();
}

export function html(dist: string, path: string): string {
  const file = join(dist, path);
  if (!existsSync(file)) throw new Error(`missing ${path} in ${dist}`);
  return readFileSync(file, "utf8");
}

export function dom(dist: string, path: string): Document {
  return new JSDOM(html(dist, path)).window.document;
}

export function text(el: Element | null | undefined): string {
  return (el?.textContent ?? "").replace(/\s+/g, " ").trim();
}
