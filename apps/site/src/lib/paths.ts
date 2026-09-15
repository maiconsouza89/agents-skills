import { dirname, resolve } from "node:path";

// `astro.config.mjs` sets MASS_CATALOG_ROOT to `../../skills` unless a fixture build overrides it;
// the bundled site code cannot rely on `import.meta.url`, which points into `dist/.prerender/`.
const catalogRoot = process.env.MASS_CATALOG_ROOT;
if (!catalogRoot) throw new Error("MASS_CATALOG_ROOT is not set; run astro through astro.config.mjs");

/** Absolute catalog directory. */
export const CATALOG_ROOT = resolve(catalogRoot);

/** The repo root the catalog lives in - where `skills-registry.json` sits. */
export const REPO_ROOT = dirname(CATALOG_ROOT);
