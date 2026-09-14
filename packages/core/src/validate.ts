import { existsSync } from "node:fs";
import { join } from "node:path";
import { catalogDir, gitModes, listSkillDirs, readCategories, readDeprecated, todayIso } from "./catalog.js";
import { parseSkill } from "./frontmatter.js";
import { RULES } from "./rules/index.js";
import type { Category, Finding, ParsedSkill } from "./types.js";

export interface ValidateOptions {
  categories?: Category[];
  today?: string;
  gitModes?: Map<string, string>;
  /** Repo root used for finding paths; defaults to the parent of the skill's parent. */
  root?: string;
}

/** Run every rule over one skill directory. */
export function validateSkill(dir: string, opts: ValidateOptions = {}): Finding[] {
  const root = opts.root ?? join(dir, "..", "..");
  const skill: ParsedSkill = parseSkill(dir);
  const ctx = {
    skill,
    categories: opts.categories ?? readCategories(root),
    today: opts.today ?? todayIso(),
    gitModes: opts.gitModes,
    root,
  };
  return RULES.flatMap((rule) => rule(ctx));
}

export interface CatalogResult {
  skills: string[];
  findings: Finding[];
}

/** Walk `<root>/skills/*` only (never `.claude/`, `node_modules/`, `packages/`, `apps/`) and validate every skill. */
export function validateCatalog(root: string, opts: Pick<ValidateOptions, "today"> = {}): CatalogResult {
  const skills = listSkillDirs(root);
  const categories = readCategories(root);
  const modes = gitModes(root);
  const today = opts.today ?? todayIso();
  const findings: Finding[] = [];
  for (const name of skills) {
    findings.push(...validateSkill(join(catalogDir(root), name), { categories, today, gitModes: modes, root }));
  }
  findings.push(...deprecatedConflicts(root, skills));
  return { skills, findings };
}

export function deprecatedConflicts(root: string, skills: string[]): Finding[] {
  const path = "skills/_deprecated.json";
  const out: Finding[] = [];
  const deprecated = readDeprecated(root);
  for (const [old, entry] of Object.entries(deprecated)) {
    if (skills.includes(old) || existsSync(join(catalogDir(root), old))) {
      out.push({ rule: "deprecated/conflict", path, line: 1, message: `"${old}" is deprecated but skills/${old}/ still exists`, severity: "error" });
    }
    for (const target of entry.replacedBy ?? []) {
      if (!skills.includes(target)) {
        out.push({ rule: "deprecated/conflict", path, line: 1, message: `"${old}" is replaced by "${target}", which is not in the catalog`, severity: "error" });
      }
    }
  }
  return out;
}

export function formatFinding(f: Finding): string {
  return `${f.rule} ${f.path}:${f.line} ${f.message}`;
}

export function hasErrors(findings: ReadonlyArray<Finding>): boolean {
  return findings.some((f) => f.severity === "error");
}
