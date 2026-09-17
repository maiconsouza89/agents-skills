import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { CATALOG_ROOT } from "./lib/paths";

// One entry per `skills/<name>/SKILL.md`, read in place from the catalog; the id is the folder name.
const skills = defineCollection({
  loader: glob({
    pattern: "*/SKILL.md",
    base: CATALOG_ROOT,
    generateId: ({ entry }) => entry.split("/")[0],
  }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    license: z.string(),
    compatibility: z.string().optional(),
    "allowed-tools": z.string().optional(),
    metadata: z.record(z.string(), z.string()),
  }),
});

// Every other Markdown file a skill ships (references/, assets/, ...), rendered on the skill page.
// `evals/` is excluded like in the registry (`SHIPPED_EXCLUDES`): the CLI never installs it. The id is
// the path relative to the catalog, so `skills/<name>/references/x.md` is found by `<name>/references/x.md`.
const skillFiles = defineCollection({
  loader: glob({
    pattern: ["*/**/*.md", "!*/SKILL.md", "!*/evals/**"],
    base: CATALOG_ROOT,
    generateId: ({ entry }) => entry,
  }),
  schema: z.object({}).passthrough(),
});

export const collections = { skills, skillFiles };
