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

export const collections = { skills };
