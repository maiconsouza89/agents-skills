// @ts-check
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";

const src = (p) => fileURLToPath(new URL(p, import.meta.url));

// The catalog is read in place. A fixture build sets MASS_CATALOG_ROOT; otherwise it is ../../skills.
process.env.MASS_CATALOG_ROOT ||= src("../../skills");

export default defineConfig({
  site: "https://maiconsouza89.github.io",
  base: "/mass-solutions-skills/",
  i18n: {
    defaultLocale: "en",
    locales: ["en", "pt-br"],
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    resolve: {
      alias: {
        // Read the workspace packages from source: no build step before the site, one parser for everything.
        "@mass-solutions/skills-core": src("../../packages/core/src/index.ts"),
        "@mass-solutions/skills-cli/agents": src("../../packages/cli/src/agents.ts"),
      },
    },
  },
});
