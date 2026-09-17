// @ts-check
import { fileURLToPath } from "node:url";
import { defineConfig, fontProviders } from "astro/config";

const src = (p) => fileURLToPath(new URL(p, import.meta.url));

// The catalog is read in place. A fixture build sets MASS_CATALOG_ROOT; otherwise it is ../../skills.
process.env.MASS_CATALOG_ROOT ||= src("../../skills");

export default defineConfig({
  site: "https://maiconsouza89.github.io",
  base: "/agents-skills/",
  // Self-hosted: the variable woff2 files ship in @fontsource-variable/*, so the build never fetches fonts.
  // The latin subset (U+0000-00FF and punctuation) covers every accent used by the pt-br chrome.
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Inter",
      cssVariable: "--font-sans",
      fallbacks: ["SF Pro Display", "-apple-system", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
      options: {
        variants: [{ src: ["./node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2"], weight: "100 900", style: "normal" }],
      },
    },
    {
      provider: fontProviders.local(),
      name: "JetBrains Mono",
      cssVariable: "--font-mono",
      fallbacks: ["ui-monospace", "SF Mono", "Menlo", "monospace"],
      options: {
        variants: [{ src: ["./node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2"], weight: "100 800", style: "normal" }],
      },
    },
  ],
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
        // The CLI pins the catalog at `v<its version>` (DEFAULT_REF in packages/cli/src/download.ts, which
        // reads the manifest through import.meta.url and cannot be bundled); the site reads the manifest itself.
        "@mass-solutions/skills-cli/package.json": src("../../packages/cli/package.json"),
        // Repo tooling the /security page and the skill badges share with CI: one reader per file.
        "@mass-solutions/tools/allowlist": src("../../tools/allowlist.ts"),
        "@mass-solutions/tools/security-status": src("../../tools/security-status.ts"),
      },
    },
  },
});
