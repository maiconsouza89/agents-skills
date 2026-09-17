// Atom 1.0 feed of the catalog (RFC 4287), written by hand like sitemap.xml.ts: @astrojs/rss only
// emits RSS 2.0, and the `feed` package would be a dependency for forty lines of XML.
import { categoryLabel, registry } from "./catalog";
import { absLocalized, t, type Lang } from "./i18n";

export const ATOM_NS = "http://www.w3.org/2005/Atom";

interface Entry {
  name: string;
  /** `YYYY-MM-DD`: `reviewed` for a live skill, `since` for a deprecated one. */
  date: string;
  summary: string;
  content: string;
  category?: { term: string; label: string };
}

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Atom needs RFC 3339; the catalog only records the day. */
export function rfc3339(day: string): string {
  return `${day}T00:00:00Z`;
}

/** One entry per skill and per deprecation, most recently reviewed first; ties broken by name so the output is stable. */
export function feedEntries(lang: Lang): Entry[] {
  const d = t(lang);
  const live: Entry[] = registry.skills.map((s) => ({
    name: s.name,
    date: s.reviewed,
    summary: s.description,
    content: `${d.version} ${s.version} · ${d.category} ${categoryLabel(s.category, lang)}\n\n${s.description}`,
    category: { term: s.category, label: categoryLabel(s.category, lang) },
  }));
  const gone: Entry[] = Object.entries(registry.deprecated).map(([name, dep]) => {
    const notice = `${d.deprecatedSince(dep.since)}. ${d.reason}: ${dep.reason}.`;
    const replaced = dep.replacedBy.length ? ` ${d.replacedBy}: ${dep.replacedBy.join(", ")}.` : "";
    return { name, date: dep.since, summary: notice, content: `${notice}${replaced}` };
  });
  return [...live, ...gone].sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
}

export function buildFeed(lang: Lang): string {
  const d = t(lang);
  const entries = feedEntries(lang);
  const self = absLocalized(lang, "feed.xml");
  const updated = entries.reduce((max, e) => (e.date > max ? e.date : max), entries[0]?.date ?? "1970-01-01");
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<feed xmlns="${ATOM_NS}" xml:lang="${lang === "en" ? "en" : "pt-BR"}">`,
    `  <id>${esc(self)}</id>`,
    `  <title>${esc(d.feedTitle)}</title>`,
    `  <subtitle>${esc(d.feedSubtitle)}</subtitle>`,
    `  <link rel="self" type="application/atom+xml" href="${esc(self)}"/>`,
    `  <link rel="alternate" type="text/html" href="${esc(absLocalized(lang, "catalog/"))}"/>`,
    `  <updated>${rfc3339(updated)}</updated>`,
    `  <author><name>Mass Solutions</name></author>`,
    `  <generator uri="${esc(absLocalized("en", ""))}">${esc(d.siteName)}</generator>`,
  ];
  for (const e of entries) {
    const url = absLocalized(lang, `skills/${e.name}/`);
    lines.push(
      "  <entry>",
      `    <id>${esc(url)}</id>`,
      `    <title>${esc(e.name)}</title>`,
      `    <link rel="alternate" type="text/html" href="${esc(url)}"/>`,
      `    <updated>${rfc3339(e.date)}</updated>`,
    );
    if (e.category) lines.push(`    <category term="${esc(e.category.term)}" label="${esc(e.category.label)}"/>`);
    lines.push(`    <summary>${esc(e.summary)}</summary>`, `    <content type="text">${esc(e.content)}</content>`, "  </entry>");
  }
  lines.push("</feed>");
  return lines.join("\n");
}
