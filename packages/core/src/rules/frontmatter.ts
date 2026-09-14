import { relative } from "node:path";
import {
  ALLOWED_KEYS,
  COMPATIBILITY_MAX,
  DATE_RE,
  DESCRIPTION_MAX,
  DESCRIPTION_RE,
  NAME_MAX,
  NAME_RE,
  REQUIRED_LICENSE,
  REQUIRED_METADATA,
  SEMVER_RE,
} from "../constants.js";
import { keyLine } from "../frontmatter.js";
import type { Finding, Rule, RuleContext } from "../types.js";

function skillPath(ctx: RuleContext): string {
  return relative(ctx.root, `${ctx.skill.dir}/SKILL.md`).split("\\").join("/");
}

function finding(ctx: RuleContext, rule: string, line: number, message: string): Finding {
  return { rule, path: skillPath(ctx), line, message, severity: "error" };
}

export const frontmatterParse: Rule = (ctx) => {
  if (ctx.skill.frontmatter) return [];
  return [finding(ctx, "frontmatter/parse", 1, ctx.skill.frontmatterError ?? "invalid frontmatter")];
};

export const unknownKey: Rule = (ctx) => {
  const fm = ctx.skill.frontmatter;
  if (!fm) return [];
  return Object.keys(fm)
    .filter((k) => !(ALLOWED_KEYS as ReadonlyArray<string>).includes(k))
    .map((k) => finding(ctx, "frontmatter/unknown-key", keyLine(ctx.skill, k), `key "${k}" is not one of ${ALLOWED_KEYS.join(", ")}`));
};

export const nameRule: Rule = (ctx) => {
  const fm = ctx.skill.frontmatter;
  if (!fm) return [];
  const line = keyLine(ctx.skill, "name");
  const name = fm.name;
  if (typeof name !== "string" || name.length === 0) return [finding(ctx, "frontmatter/name", line, "name is required")];
  const out: Finding[] = [];
  if (name !== ctx.skill.name) out.push(finding(ctx, "frontmatter/name", line, `name "${name}" must equal the folder name "${ctx.skill.name}"`));
  if (!NAME_RE.test(name)) out.push(finding(ctx, "frontmatter/name", line, `name "${name}" must match ${NAME_RE}`));
  if (name.length > NAME_MAX) out.push(finding(ctx, "frontmatter/name", line, `name has ${name.length} characters, max ${NAME_MAX}`));
  return out;
};

export const descriptionRule: Rule = (ctx) => {
  const fm = ctx.skill.frontmatter;
  if (!fm) return [];
  const line = keyLine(ctx.skill, "description");
  const d = fm.description;
  if (typeof d !== "string" || d.trim().length === 0) return [finding(ctx, "frontmatter/description", line, "description is required and must be non-empty")];
  const out: Finding[] = [];
  if (d.length > DESCRIPTION_MAX) out.push(finding(ctx, "frontmatter/description", line, `description has ${d.length} characters, max ${DESCRIPTION_MAX}`));
  if (!DESCRIPTION_RE.test(d.trim())) {
    out.push(finding(ctx, "frontmatter/description", line, 'description must follow "[What it does]. Use when \\"a\\", \\"b\\" or \\"c\\". Do NOT use for X (use mass-y)."'));
  }
  return out;
};

export const metadataRule: Rule = (ctx) => {
  const fm = ctx.skill.frontmatter;
  if (!fm) return [];
  const out: Finding[] = [];
  const rule = "frontmatter/metadata";
  if (fm.license !== REQUIRED_LICENSE) {
    out.push(finding(ctx, rule, keyLine(ctx.skill, "license"), `license must be "${REQUIRED_LICENSE}"`));
  }
  const md = fm.metadata;
  const mdLine = keyLine(ctx.skill, "metadata");
  if (md === null || typeof md !== "object" || Array.isArray(md)) {
    return [...out, finding(ctx, rule, mdLine, "metadata is required and must be a mapping")];
  }
  const meta = md as Record<string, unknown>;
  for (const key of REQUIRED_METADATA) {
    if (!(key in meta)) out.push(finding(ctx, rule, mdLine, `metadata.${key} is required`));
  }
  for (const [key, value] of Object.entries(meta)) {
    if (typeof value !== "string") {
      out.push(finding(ctx, rule, keyLine(ctx.skill, "metadata", key), `metadata.${key} must be a string (got ${Array.isArray(value) ? "array" : typeof value})`));
    }
  }
  const version = meta.version;
  if (typeof version === "string" && !SEMVER_RE.test(version)) {
    out.push(finding(ctx, rule, keyLine(ctx.skill, "metadata", "version"), `metadata.version "${version}" must be semver x.y.z`));
  }
  const category = meta.category;
  if (typeof category === "string" && !ctx.categories.some((c) => c.id === category)) {
    out.push(finding(ctx, rule, keyLine(ctx.skill, "metadata", "category"), `metadata.category "${category}" is not in skills/_categories.json`));
  }
  const reviewed = meta.reviewed;
  if (typeof reviewed === "string") {
    const rLine = keyLine(ctx.skill, "metadata", "reviewed");
    if (!DATE_RE.test(reviewed) || Number.isNaN(Date.parse(reviewed))) {
      out.push(finding(ctx, rule, rLine, `metadata.reviewed "${reviewed}" must be a date YYYY-MM-DD`));
    } else if (reviewed > ctx.today) {
      out.push(finding(ctx, rule, rLine, `metadata.reviewed "${reviewed}" is in the future (today is ${ctx.today})`));
    }
  }
  const tags = meta.tags;
  if (typeof tags === "string" && tags.trim().length === 0) {
    out.push(finding(ctx, rule, keyLine(ctx.skill, "metadata", "tags"), "metadata.tags must not be empty"));
  }
  return out;
};

export const compatibilityRule: Rule = (ctx) => {
  const fm = ctx.skill.frontmatter;
  if (!fm || !("compatibility" in fm)) return [];
  const c = fm.compatibility;
  const line = keyLine(ctx.skill, "compatibility");
  if (typeof c !== "string" || c.length === 0) return [finding(ctx, "frontmatter/compatibility", line, "compatibility must be a non-empty string when present")];
  if (c.length > COMPATIBILITY_MAX) return [finding(ctx, "frontmatter/compatibility", line, `compatibility has ${c.length} characters, max ${COMPATIBILITY_MAX}`)];
  return [];
};
