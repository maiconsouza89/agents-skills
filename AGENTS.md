# AGENTS.md

Regras para agentes de código que trabalham neste repositório. `CLAUDE.md` aponta para cá.

## O repositório

Monorepo pnpm: `skills/` (catálogo, uma pasta por skill), `packages/core` (`@mass-solutions/skills-core`: parse, validação, hash, registry), `packages/cli` (`mass-skills`), `apps/site` (Astro, EN e PT), `tools/` (scripts do repo), `.claude-plugin/` (marketplace do Claude Code). `skills-registry.json` é gerado e commitado.

## Regras do catálogo

- Posição: `skills/<name>/SKILL.md` na raiz. Nada além de skills, `_categories.json`, `_deprecated.json` e `LICENSE` entra em `skills/`.
- Frontmatter: só `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`. `name` = pasta, `^mass-[a-z0-9]+(-[a-z0-9]+)*$`, até 64 caracteres. `license: CC-BY-4.0`. `metadata` com `author`, `version` (semver), `category` (id de `_categories.json`), `tags` (string separada por vírgula), `reviewed` (`YYYY-MM-DD`); todo valor é string.
- Description: `[What it does]. Use when "a", "b" or "c". Do NOT use for X (use mass-y).` até 1024 caracteres.
- Skills em inglês; `SKILL.md` curto, material longo em `references/`; scripts com `#!` e bit executável.
- Deprecar = remover a pasta e registrar em `_deprecated.json` (`since`, `replacedBy`, `reason`).
- Antes de commitar: `pnpm check` (validador, `registry --check`, testes). Após mudar qualquer arquivo de skill: `pnpm registry`.
- Commits em Conventional Commits.

## Idioma

Documentos e respostas ao usuário em pt-BR. Código, skills, mensagens do CLI e chrome de código em inglês. Identificadores nunca são traduzidos.

## tlc-spec-lean

profile: standard
budget: 150k

## Dependências

Versões escolhidas em 2026-09-14 consultando `npm view` e a documentação oficial (Context7). Atualize esta tabela ao trocar uma versão.

| Pacote | Versão | Por quê |
| --- | --- | --- |
| Node | 24 (`.nvmrc`), `engines >=22.12` | Astro 6+ exige 22.12; 24 é a LTS ativa instalada na máquina do mantenedor |
| pnpm | 11.23.0 (`packageManager`) | workspaces sem orquestrador; `allowBuilds` em `pnpm-workspace.yaml` libera só o `esbuild`; `minimumReleaseAgeExclude` foi gravado pelo próprio pnpm ao instalar o Changesets (política de idade mínima de release) |
| typescript | ^5.9.3 | linha 5.x estável; a 7.x (porta nativa) fica para quando o toolchain a acompanhar |
| tsx | ^4.23.13 | roda os bins e tools em TypeScript sem passo de build |
| vitest | ^5.0.0 | runner único para raiz, pacotes e site; seletor `-t` nas provas |
| yaml | ^2.9.1 | parser de frontmatter; o schema padrão mantém datas como string, que é o que o contrato exige |
| @types/node | ^24.13.4 | acompanha o Node 24 |
| astro | ^7.3.2 | site estático com i18n por rota nativo e `glob()` lendo o catálogo em `../../skills`; compilador Rust do v7 é estrito com tags não fechadas; exige Node >=22.12 |
| jsdom | ^30.0.1 (dev, site) | executa o script de busca da home nos testes sem navegador |
| @changesets/cli | ^3.0.3 (dev, raiz) | versiona `packages/core` e `packages/cli`; `apps/site` fica fora (`ignore` no config) |
| commander | ^15.0.0 | parser de comandos do `mass-skills`; `exitOverride` + `configureOutput` permitem rodar o CLI em processo nos testes, sem `process.exit`; exige Node >=22.12, igual ao repo |

## CLI `mass-skills`

- `packages/cli/bin/mass-skills.js` importa `dist/`, gerado por `pnpm build` (o core builda antes, por ordem topológica do pnpm). Em desenvolvimento: `pnpm --filter @mass-solutions/skills-cli exec tsx src/bin.ts <args>`.
- `run(argv, { cwd, env, stdout, stderr })` em `packages/cli/src/run.ts` é a única entrada; nunca chama `process.exit`, devolve o exit code (`0` sucesso, `1` falha de execução, `2` uso).
- `MASS_SKILLS_BASE_URL` troca a base de download (default `https://raw.githubusercontent.com/maiconsouza89/agents-skills/`); os testes sobem um `node:http` local servindo um catálogo de fixture e apontam essa variável para ele.
- `install` baixa e verifica tudo num diretório temporário antes de escrever no agente ou no lockfile; `update` só sobrescreve edição local com `--force`; `remove` só apaga nos agentes registrados no lockfile.

## Site `apps/site`

- `pnpm --filter site build` (ou `pnpm build` na raiz) gera `apps/site/dist/` com `base: /agents-skills/`, rotas `/` (EN) e `/pt-br/`.
- O catálogo é lido em `../../skills` via `glob()`; `MASS_CATALOG_ROOT` aponta para outro catálogo (os testes constroem um fixture com skill deprecada). `skills-registry.json` é lido do diretório pai do catálogo, então rode `pnpm registry` antes de construir o site.
- Chrome traduzido EN/PT em `src/lib/i18n.ts`; corpo das skills em inglês nas duas rotas. Tokens visuais em `src/styles/global.css`, com os mesmos nomes de token do `DESIGN.md` (`--color-surface-1`, `--radius-lg`, ...); a nota de adaptação no topo do `DESIGN.md` diz o que foi substituído. Fontes (Inter, JetBrains Mono) vêm da Fonts API do Astro com `fontProviders.npm()`, lidas do `node_modules`, sem rede no build.
- Único JavaScript do site: a busca e o filtro da home sobre `search-index.json` (`<script is:inline>`). As demais páginas não têm `<script>`.
- Os testes constroem o site de verdade (`apps/site/test/helpers.ts`), removendo `BASE_URL` do ambiente que o vitest exporta e serializando builds concorrentes com um lock.

## CI e release

- `ci.yml` (PR e `main`): `pnpm check`, `pnpm build`, `npx -y @anthropic-ai/claude-code@latest plugin validate .`; sem secrets, roda em fork.
- `pages.yml` (`main`): `withastro/action` em `apps/site` + `actions/deploy-pages`; o Node vem do `.nvmrc`.
- `security-scan.yml` (`main` e PRs): `tools/allowlist.ts` roda sempre e falha com entrada vencida; `uvx snyk-agent-scan@latest skills --ci` só em push e PR do próprio repo (precisa de `SNYK_TOKEN`).
- `stale-skills.yml` (segunda 09:00 UTC e manual): `pnpm --silent stale --days 90` alimenta a issue `Stale skills` (label `stale-skill`), fechada quando a lista fica vazia.
- `release.yml` (tag `v*`): `pnpm check`, `pnpm build`, `gh release create --generate-notes`. Versões dos pacotes via Changesets (`pnpm changeset`); o site não é versionado.
