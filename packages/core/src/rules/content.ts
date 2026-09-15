import { existsSync, openSync, readSync, closeSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { BINARY_PROBE_BYTES, INJECTION_PHRASES, SECRET_PATTERNS, SHELL_PATTERNS } from "../constants.js";
import type { Finding, Rule, RuleContext } from "../types.js";

function relPath(ctx: RuleContext, file: string): string {
  return relative(ctx.root, join(ctx.skill.dir, file)).split("\\").join("/");
}

function isBinary(abs: string): boolean {
  const fd = openSync(abs, "r");
  try {
    const buf = Buffer.alloc(BINARY_PROBE_BYTES);
    const n = readSync(fd, buf, 0, BINARY_PROBE_BYTES, 0);
    return buf.subarray(0, n).includes(0);
  } finally {
    closeSync(fd);
  }
}

export function binaryFiles(ctx: RuleContext): Set<string> {
  return new Set(ctx.skill.files.filter((f) => isBinary(join(ctx.skill.dir, f))));
}

export const binaryRule: Rule = (ctx) => {
  return [...binaryFiles(ctx)].map((f) => ({
    rule: "content/binary",
    path: relPath(ctx, f),
    line: 1,
    message: "binary file (NUL byte in the first 8192 bytes); skills ship text only",
    severity: "error" as const,
  }));
};

function scanLines(ctx: RuleContext, rule: string, test: (line: string) => string | null, message: (hit: string) => string): Finding[] {
  const binaries = binaryFiles(ctx);
  const out: Finding[] = [];
  for (const file of ctx.skill.files) {
    if (binaries.has(file)) continue;
    const lines = readFileSync(join(ctx.skill.dir, file), "utf8").split("\n");
    lines.forEach((line, i) => {
      const hit = test(line);
      if (hit) out.push({ rule, path: relPath(ctx, file), line: i + 1, message: message(hit), severity: "error" });
    });
  }
  return out;
}

export const secretRule: Rule = (ctx) =>
  scanLines(ctx, "security/secret", (l) => SECRET_PATTERNS.find((p) => p.re.test(l))?.id ?? null, (id) => `looks like a secret (${id})`);

export const shellRule: Rule = (ctx) =>
  scanLines(ctx, "security/shell", (l) => SHELL_PATTERNS.find((p) => p.re.test(l))?.id ?? null, (id) => `dangerous shell pattern (${id})`);

export const promptInjectionRule: Rule = (ctx) =>
  scanLines(
    ctx,
    "security/prompt-injection",
    (l) => {
      const low = l.toLowerCase();
      return INJECTION_PHRASES.find((p) => low.includes(p)) ?? null;
    },
    (phrase) => `prompt-injection phrase "${phrase}"`,
  );

export const scriptsRule: Rule = (ctx) => {
  const out: Finding[] = [];
  for (const file of ctx.skill.files) {
    if (!file.startsWith("scripts/")) continue;
    const abs = join(ctx.skill.dir, file);
    const head = Buffer.alloc(2);
    const fd = openSync(abs, "r");
    try {
      readSync(fd, head, 0, 2, 0);
    } finally {
      closeSync(fd);
    }
    if (head.toString("latin1") !== "#!") {
      out.push({ rule: "scripts/shebang", path: relPath(ctx, file), line: 1, message: "scripts must start with a #! line", severity: "error" });
    }
    const gitKey = relPath(ctx, file);
    const gitMode = ctx.gitModes?.get(gitKey);
    const executable = gitMode ? gitMode === "100755" : (statSync(abs).mode & 0o111) !== 0;
    if (!executable) {
      out.push({
        rule: "scripts/executable",
        path: relPath(ctx, file),
        line: 1,
        message: gitMode ? `git mode is ${gitMode}, expected 100755 (chmod +x and git add)` : "file is not executable (chmod +x)",
        severity: "error",
      });
    }
  }
  return out;
};

export const linksRule: Rule = (ctx) => {
  const out: Finding[] = [];
  const re = /\[[^\]]*\]\(([^)\s]+)\)/g;
  const lines = ctx.skill.raw.split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(re)) {
      const target = m[1];
      if (/^(https?:|mailto:|#|\/)/.test(target)) continue;
      const clean = target.replace(/[#?].*$/, "");
      if (!clean) continue;
      if (!existsSync(join(ctx.skill.dir, clean))) {
        out.push({ rule: "links/missing", path: relPath(ctx, "SKILL.md"), line: i + 1, message: `link target "${clean}" does not exist in the skill`, severity: "error" });
      }
    }
  });
  return out;
};

export const evalsRule: Rule = (ctx) => {
  const evalsDir = join(ctx.skill.dir, "evals");
  if (!existsSync(evalsDir)) return [];
  const file = join(evalsDir, "triggers.json");
  const path = relPath(ctx, "evals/triggers.json");
  const bad = (message: string): Finding => ({ rule: "evals/shape", path, line: 1, message, severity: "error" });
  if (!existsSync(file)) return [bad("evals/ requires triggers.json")];
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    return [bad(`triggers.json is not valid JSON: ${(err as Error).message}`)];
  }
  const obj = parsed as Record<string, unknown> | null;
  if (!obj || typeof obj !== "object") return [bad("triggers.json must be an object")];
  const out: Finding[] = [];
  for (const key of ["should", "shouldNot"]) {
    if (!Array.isArray(obj[key])) out.push(bad(`triggers.json must contain the array "${key}"`));
  }
  return out;
};
