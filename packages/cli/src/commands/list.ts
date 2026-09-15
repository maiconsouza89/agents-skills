import type { Registry, RegistrySkill } from "@mass-solutions/skills-core";
import { loadRegistry, type Session } from "../context.js";
import { EXIT_OK } from "../types.js";

export const DESCRIPTION_COLUMN = 80;

export function formatRow(s: RegistrySkill): string {
  return `${s.name}  ${s.version}  ${s.category}  ${s.description.slice(0, DESCRIPTION_COLUMN)}`;
}

export function sortedSkills(registry: Registry): RegistrySkill[] {
  return [...registry.skills].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

export async function list(s: Session): Promise<number> {
  const registry = await loadRegistry(s);
  for (const skill of sortedSkills(registry)) s.ctx.stdout.write(`${formatRow(skill)}\n`);
  return EXIT_OK;
}

export function matches(skill: RegistrySkill, term: string): boolean {
  const t = term.toLowerCase();
  return skill.name.toLowerCase().includes(t) || skill.description.toLowerCase().includes(t) || skill.tags.some((tag) => tag.toLowerCase().includes(t));
}

export async function search(s: Session, term: string): Promise<number> {
  const registry = await loadRegistry(s);
  const hits = sortedSkills(registry).filter((skill) => matches(skill, term));
  if (hits.length === 0) {
    s.ctx.stdout.write(`No skills match "${term}"\n`);
    return EXIT_OK;
  }
  for (const skill of hits) s.ctx.stdout.write(`${formatRow(skill)}\n`);
  return EXIT_OK;
}
