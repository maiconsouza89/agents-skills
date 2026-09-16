import { absLocalized } from "../lib/i18n";
import { registry, categories } from "../lib/catalog";

function buildLlms(): string {
  const homeUrl = absLocalized("en", "");
  const catalogUrl = absLocalized("en", "catalog/");

  const lines: string[] = [
    "# Mass Skills",
    "",
    `> Agent Skills catalog for AI coding agents — open source, validated in CI, installed with integrity checks.`,
    "",
    `Documentation: ${homeUrl}`,
    `Catalog: ${catalogUrl}`,
    "",
    "## Skills",
    "",
  ];

  // Group by category for readability
  const usedCategories = categories.filter((c) => registry.skills.some((s) => s.category === c.id));

  for (const cat of usedCategories) {
    const skills = registry.skills.filter((s) => s.category === cat.id).sort((a, b) => a.name.localeCompare(b.name));
    lines.push(`### ${cat.en}`, "");
    for (const skill of skills) {
      const url = absLocalized("en", `skills/${skill.name}/`);
      lines.push(`- [${skill.name}](${url}): ${skill.description}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function GET() {
  return new Response(buildLlms(), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
