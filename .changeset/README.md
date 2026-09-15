# Changesets

`pnpm changeset` registra uma mudança em `@mass-solutions/skills-core` ou `@mass-solutions/skills-cli`;
`pnpm changeset version` aplica os bumps e gera os CHANGELOGs. As skills do catálogo não passam por
aqui: elas têm `metadata.version` próprio no frontmatter. Uma tag `v*` dispara `release.yml`.
