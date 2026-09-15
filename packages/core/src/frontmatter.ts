import { readFileSync, existsSync } from "node:fs";
import { basename, join } from "node:path";
import { parse as parseYaml } from "yaml";
import { listFiles } from "./files.js";
import type { ParsedSkill } from "./types.js";

const FENCE = "---";

/** Read `<dir>/SKILL.md` and split its frontmatter from its body. */
export function parseSkill(dir: string): ParsedSkill {
  const file = join(dir, "SKILL.md");
  const raw = existsSync(file) ? readFileSync(file, "utf8") : "";
  const files = listFiles(dir);
  const base: ParsedSkill = {
    name: basename(dir),
    dir,
    raw,
    frontmatter: null,
    frontmatterText: "",
    body: raw,
    bodyStartLine: 1,
    files,
  };
  const lines = raw.split("\n");
  if (lines[0]?.trim() !== FENCE) return { ...base, frontmatterError: "missing frontmatter" };
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === FENCE);
  if (end < 0) return { ...base, frontmatterError: "unterminated frontmatter" };
  const frontmatterText = lines.slice(1, end).join("\n");
  const body = lines.slice(end + 1).join("\n");
  let parsed: unknown;
  try {
    parsed = parseYaml(frontmatterText);
  } catch (err) {
    return { ...base, frontmatterText, body, bodyStartLine: end + 2, frontmatterError: `invalid YAML: ${(err as Error).message}` };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ...base, frontmatterText, body, bodyStartLine: end + 2, frontmatterError: "frontmatter is not a mapping" };
  }
  return { ...base, frontmatter: parsed as Record<string, unknown>, frontmatterText, body, bodyStartLine: end + 2 };
}

/** 1-based line of a top-level frontmatter key in SKILL.md, or 1 when not found. */
export function keyLine(skill: ParsedSkill, key: string, nested?: string): number {
  const lines = skill.frontmatterText.split("\n");
  if (nested) {
    const parentIdx = lines.findIndex((l) => new RegExp(`^${escape(key)}\\s*:`).test(l));
    if (parentIdx >= 0) {
      const childIdx = lines.findIndex((l, i) => i > parentIdx && new RegExp(`^\\s+${escape(nested)}\\s*:`).test(l));
      if (childIdx >= 0) return childIdx + 2;
    }
  }
  const idx = lines.findIndex((l) => new RegExp(`^${escape(key)}\\s*:`).test(l));
  return idx >= 0 ? idx + 2 : 1;
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
