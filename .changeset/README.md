# Changesets

`pnpm changeset` registra uma mudança em `@mass-solutions/skills-core` ou `@mass-solutions/skills-cli`;
`pnpm changeset version` aplica os bumps e gera os CHANGELOGs. As skills do catálogo não passam por
aqui: elas têm `metadata.version` próprio no frontmatter.

A publicação no npm não é manual: a tag `v<versão do CLI>` dispara `release.yml`, que publica os
pacotes com trusted publishing (OIDC) e provenance via `pnpm -r publish`. Veja "CI e release" no
`CLAUDE.md`.
