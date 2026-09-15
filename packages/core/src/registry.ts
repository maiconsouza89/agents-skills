import { join } from "node:path";
import { catalogDir, listSkillDirs, readDeprecated } from "./catalog.js";
import { CATALOG_DIR, estimateTokens, REPO } from "./constants.js";
import { parseSkill } from "./frontmatter.js";
import { hashFiles } from "./hash.js";
import type { Registry, RegistrySkill } from "./types.js";

export interface BuildRegistryOptions {
  now?: Date;
  repo?: string;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function splitTags(tags: unknown): string[] {
  return str(tags)
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/** Build the registry for `<root>/skills`. Does not validate; run `validateCatalog` first. */
export function buildRegistry(root: string, opts: BuildRegistryOptions = {}): Registry {
  const skills: RegistrySkill[] = listSkillDirs(root).map((name) => {
    const dir = join(catalogDir(root), name);
    const skill = parseSkill(dir);
    const fm = skill.frontmatter ?? {};
    const meta = (fm.metadata && typeof fm.metadata === "object" ? fm.metadata : {}) as Record<string, unknown>;
    const { files, contentHash } = hashFiles(dir);
    return {
      name,
      path: `${CATALOG_DIR}/${name}`,
      description: str(fm.description),
      category: str(meta.category),
      tags: splitTags(meta.tags),
      version: str(meta.version),
      reviewed: str(meta.reviewed),
      author: str(meta.author),
      license: str(fm.license),
      files,
      contentHash,
      tokens: estimateTokens(skill.raw),
    };
  });
  return {
    version: 1,
    generatedAt: (opts.now ?? new Date()).toISOString(),
    repo: opts.repo ?? REPO,
    skills,
    deprecated: readDeprecated(root),
  };
}

/** Dotted paths that differ between two registries, ignoring `generatedAt`. */
export function diffRegistry(committed: unknown, generated: unknown): string[] {
  const out: string[] = [];
  const walk = (a: unknown, b: unknown, path: string) => {
    if (path === "generatedAt") return;
    if (Array.isArray(a) || Array.isArray(b)) {
      if (!Array.isArray(a) || !Array.isArray(b)) return void out.push(path);
      const n = Math.max(a.length, b.length);
      for (let i = 0; i < n; i++) walk(a[i], b[i], `${path}[${i}]`);
      return;
    }
    if (a && b && typeof a === "object" && typeof b === "object") {
      const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
      for (const k of keys) walk((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], path ? `${path}.${k}` : k);
      return;
    }
    if (a !== b) out.push(path);
  };
  walk(committed, generated, "");
  return out;
}

export function serializeRegistry(registry: Registry): string {
  return `${JSON.stringify(registry, null, 2)}\n`;
}
