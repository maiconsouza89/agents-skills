import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REGISTRY_FILE, REPO, readCategories, type Category, type Registry, type RegistrySkill } from "@mass-solutions/skills-core";
import { REPO_ROOT } from "./paths";

export const registry: Registry = JSON.parse(readFileSync(join(REPO_ROOT, REGISTRY_FILE), "utf8"));
export const categories: Category[] = readCategories(REPO_ROOT);
export const GITHUB_URL = `https://github.com/${REPO}`;

export function registrySkill(name: string): RegistrySkill | undefined {
  return registry.skills.find((s) => s.name === name);
}

export function sourceUrl(name: string, file?: string): string {
  return file ? `${GITHUB_URL}/blob/main/skills/${name}/${file}` : `${GITHUB_URL}/tree/main/skills/${name}`;
}

/** The three parts of the description formula: what it does, "Use when", "Do NOT use for". */
export function splitDescription(description: string): { what: string; when: string; not: string } {
  const m = /^(.*?)\.\s+Use when (.+?)\.\s+Do NOT use for (.+)\.$/s.exec(description.trim());
  if (!m) return { what: description, when: "", not: "" };
  return { what: `${m[1]}.`, when: m[2], not: m[3] };
}

/** Skills grouped by category in `_categories.json` order, each group sorted by name; empty groups dropped. */
export function groupedByCategory(): Array<{ category: Category; skills: RegistrySkill[] }> {
  const byName = [...registry.skills].sort((a, b) => a.name.localeCompare(b.name));
  return categories
    .map((category) => ({ category, skills: byName.filter((s) => s.category === category.id) }))
    .filter((g) => g.skills.length > 0);
}

export function categoryLabel(id: string, lang: "en" | "pt-br"): string {
  return categories.find((c) => c.id === id)?.[lang] ?? id;
}

/** Files other than SKILL.md, grouped by their top-level folder (references/, scripts/, assets/, ...). */
export function extraFiles(skill: RegistrySkill): Array<{ folder: string; files: RegistrySkill["files"] }> {
  const groups = new Map<string, RegistrySkill["files"]>();
  for (const f of skill.files) {
    if (f.path === "SKILL.md") continue;
    const folder = f.path.includes("/") ? f.path.split("/")[0] : ".";
    groups.set(folder, [...(groups.get(folder) ?? []), f]);
  }
  return [...groups.entries()].map(([folder, files]) => ({ folder, files }));
}

export const searchIndex = registry.skills.map((s) => ({
  name: s.name,
  description: s.description,
  category: s.category,
  tags: s.tags,
  version: s.version,
}));

/** A piece of a rendered description: plain text, or a reference that links to `skill`'s page. */
export type DescriptionSegment = { text: string; skill?: string };

const SKILL_REF = /mass-[a-z0-9]+(?:-[a-z0-9]+)*/g;

/**
 * Split `text` into segments, marking every `mass-*` token that names a skill in `known`.
 * Adjacent punctuation stays in the surrounding plain-text segments, so "(use mass-y)."
 * yields "(use ", a reference to mass-y, and ").". A `mass-*` token that is not in the
 * catalog (unknown or deprecated) stays plain text.
 */
export function splitSkillRefs(text: string, known: Iterable<string> = registry.skills.map((s) => s.name)): DescriptionSegment[] {
  const names = new Set(known);
  const segments: DescriptionSegment[] = [];
  let cut = 0;
  for (const m of text.matchAll(SKILL_REF)) {
    if (!names.has(m[0])) continue;
    if (m.index > cut) segments.push({ text: text.slice(cut, m.index) });
    segments.push({ text: m[0], skill: m[0] });
    cut = m.index + m[0].length;
  }
  if (cut < text.length) segments.push({ text: text.slice(cut) });
  return segments;
}
