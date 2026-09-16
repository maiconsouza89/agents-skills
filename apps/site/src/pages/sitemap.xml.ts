import { LANGS, absLocalized, type Lang } from "../lib/i18n";
import { registry, categories } from "../lib/catalog";
import { AGENT_IDS } from "@mass-solutions/skills-cli/agents";

/** Static pages (path without locale prefix). */
const STATIC_PATHS = ["", "catalog/", "install/", "agents/", "about/"];

function urlEntry(loc: string): string {
  return `  <url><loc>${loc}</loc></url>`;
}

function buildUrls(): string[] {
  const urls: string[] = [];

  // Static pages
  for (const lang of LANGS) {
    for (const path of STATIC_PATHS) {
      urls.push(urlEntry(absLocalized(lang as Lang, path)));
    }
  }

  // Skill pages
  for (const lang of LANGS) {
    for (const skill of registry.skills) {
      urls.push(urlEntry(absLocalized(lang as Lang, `skills/${skill.name}/`)));
    }
  }

  // Category pages (non-empty categories only)
  const usedCategories = categories.filter((c) => registry.skills.some((s) => s.category === c.id));
  for (const lang of LANGS) {
    for (const cat of usedCategories) {
      urls.push(urlEntry(absLocalized(lang as Lang, `catalog/${cat.id}/`)));
    }
  }

  // Agent pages
  for (const lang of LANGS) {
    for (const id of AGENT_IDS) {
      urls.push(urlEntry(absLocalized(lang as Lang, `agents/${id}/`)));
    }
  }

  return urls;
}

export function GET() {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...buildUrls(),
    "</urlset>",
  ].join("\n");
  return new Response(xml, { headers: { "content-type": "application/xml" } });
}
