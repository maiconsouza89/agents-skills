# `apps/site` internals

Astro site, English and Portuguese, deployed to GitHub Pages under the base path
`/agents-skills/`. Design system: `DESIGN.md` at the root; the CSS custom properties in
`apps/site/src/styles/global.css` reuse the token names from that file.

## Catalog source

The site reads the catalog from `../../skills`; `MASS_CATALOG_ROOT` points it at another
folder. Run `pnpm registry` before building: the site reads `skills-registry.json`.

## Languages

Chrome (navigation, labels, footer) is translated in `src/lib/i18n.ts`. The body of every skill
stays in English on both routes.

## JavaScript

The only client-side JavaScript is the catalog search and category filter, running over
`search-index.json` inside a `<script is:inline>`. Nothing else ships JS.

## Verification badges and `/security/`

`src/lib/security.ts` feeds the per-skill badges and the `/security/` page from:

- the validator, run during the build;
- `security-status.json` next to the registry, written by `security-scan.yml` and downloaded by
  `pages.yml` (absent in any other build, which the site shows as "not scanned in this build");
- `security-scan-allowlist.yaml`;
- the CLI version (the catalog ref the CLI pins).

Every input tolerates a missing file.

## Tests

`apps/site/test/` builds the real site (`apps/site/test/helpers.ts`) and asserts on the output.
