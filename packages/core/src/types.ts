export type Severity = "error" | "warn";

export interface Finding {
  rule: string;
  /** Path relative to the catalog root (e.g. `skills/mass-x/SKILL.md`). */
  path: string;
  line: number;
  message: string;
  severity: Severity;
}

export interface Category {
  id: string;
  en: string;
  "pt-br": string;
}

export interface Deprecation {
  since: string;
  replacedBy: string[];
  reason: string;
}

export interface RegistryFile {
  path: string;
  sha256: string;
  bytes: number;
}

export interface RegistrySkill {
  name: string;
  path: string;
  description: string;
  category: string;
  tags: string[];
  version: string;
  reviewed: string;
  author: string;
  license: string;
  files: RegistryFile[];
  contentHash: string;
  tokens: number;
}

export interface Registry {
  version: 1;
  generatedAt: string;
  repo: string;
  skills: RegistrySkill[];
  deprecated: Record<string, Deprecation>;
}

export interface ParsedSkill {
  /** Folder name. */
  name: string;
  /** Absolute skill directory. */
  dir: string;
  /** Full SKILL.md text. */
  raw: string;
  /** Parsed frontmatter, or null when absent/invalid. */
  frontmatter: Record<string, unknown> | null;
  frontmatterError?: string;
  /** Raw frontmatter text between the fences. */
  frontmatterText: string;
  /** Body after the closing fence. */
  body: string;
  /** Line number (1-based) at which the body starts. */
  bodyStartLine: number;
  /** Every regular file under the skill dir, relative posix paths, byte-sorted. */
  files: string[];
}

export interface RuleContext {
  skill: ParsedSkill;
  categories: Category[];
  /** ISO date `YYYY-MM-DD` used as "today". */
  today: string;
  /** Git index modes for tracked files, keyed by path relative to the repo root; undefined outside git. */
  gitModes?: Map<string, string>;
  /** Repo root, used to compute finding paths and git mode keys. */
  root: string;
}

export type Rule = (ctx: RuleContext) => Finding[];
