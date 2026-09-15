import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export const CATEGORIES = [
  { id: "workflow", en: "Git workflow", "pt-br": "Fluxo Git" },
  { id: "quality", en: "Code quality", "pt-br": "Qualidade de código" },
];

export const TODAY = "2026-09-14";

export interface SkillSpec {
  /** Raw frontmatter YAML (between the fences). Defaults to a valid one for `name`. */
  frontmatter?: string;
  body?: string;
  /** Extra files, relative to the skill dir. */
  files?: Record<string, string | Buffer>;
  /** Files to chmod +x. */
  executable?: string[];
  /** Skip SKILL.md entirely. */
  noSkillMd?: boolean;
}

export function validFrontmatter(name: string, overrides: Record<string, string> = {}): string {
  const meta: Record<string, string> = {
    author: "mass-solutions",
    version: '"0.1.0"',
    category: "workflow",
    tags: '"git, commits"',
    reviewed: `"${TODAY}"`,
    ...pick(overrides, ["author", "version", "category", "tags", "reviewed"]),
  };
  const top: Record<string, string> = {
    name,
    description: `Does one thing. Use when "a", "b" or "c". Do NOT use for X (use mass-y).`,
    license: "CC-BY-4.0",
    ...omit(overrides, ["author", "version", "category", "tags", "reviewed"]),
  };
  const lines = Object.entries(top).map(([k, v]) => `${k}: ${v}`);
  lines.push("metadata:");
  for (const [k, v] of Object.entries(meta)) lines.push(`  ${k}: ${v}`);
  return lines.join("\n");
}

function pick(o: Record<string, string>, keys: string[]) {
  return Object.fromEntries(Object.entries(o).filter(([k]) => keys.includes(k)));
}
function omit(o: Record<string, string>, keys: string[]) {
  return Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));
}

/** A temp repo root with `skills/_categories.json` and `skills/_deprecated.json`. */
export function makeRoot(deprecated: Record<string, unknown> = {}): string {
  const root = mkdtempSync(join(tmpdir(), "mass-core-"));
  mkdirSync(join(root, "skills"), { recursive: true });
  writeFileSync(join(root, "skills", "_categories.json"), JSON.stringify(CATEGORIES));
  writeFileSync(join(root, "skills", "_deprecated.json"), JSON.stringify(deprecated));
  return root;
}

export function makeSkill(root: string, name: string, spec: SkillSpec = {}): string {
  const dir = join(root, "skills", name);
  mkdirSync(dir, { recursive: true });
  if (!spec.noSkillMd) {
    const fm = spec.frontmatter ?? validFrontmatter(name);
    writeFileSync(join(dir, "SKILL.md"), `---\n${fm}\n---\n${spec.body ?? "# Body\n\nInstructions.\n"}`);
  }
  for (const [rel, content] of Object.entries(spec.files ?? {})) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), content);
  }
  for (const rel of spec.executable ?? []) chmodSync(join(dir, rel), 0o755);
  return dir;
}
