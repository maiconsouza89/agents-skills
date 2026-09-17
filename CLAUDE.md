# CLAUDE.md

Repositório `agents-skills` (maiconsouza89/agents-skills): catálogo público de Agent Skills da Mass Solutions, com validador, registry, CLI `mass-skills` e site bilíngue. Fonte única de regras para agentes de código; `AGENTS.md` aponta para cá.

## Estrutura

Monorepo pnpm:

- `skills/` — catálogo, uma pasta por skill
- `packages/core` — `@mass-solutions/skills-core`: parse, validação, hash, registry
- `packages/cli` — `mass-skills`
- `apps/site` — Astro, EN e PT
- `tools/` — scripts do repo
- `.claude-plugin/` — marketplace do Claude Code
- `skills-registry.json` — gerado e commitado

## Idioma

- Documentos e respostas ao usuário: português (pt-BR).
- Raciocínio interno do modelo: inglês.
- Código, skills, mensagens do CLI e comentários: inglês.
- Identificadores nunca são traduzidos.

## Comandos

```sh
pnpm check                      # validador + registry --check + testes; obrigatório antes de commitar
pnpm registry                   # regenera skills-registry.json; obrigatório após mudar qualquer arquivo de skill
pnpm build                      # core → cli → site (apps/site/dist/, base /agents-skills/)
pnpm new-skill                  # scaffold de skill
pnpm stale --days 90            # skills sem revisão
pnpm start-issue <N>            # cria/reaproveita branch e atribui a issue (move o board para In Progress)
pnpm changeset                  # registra bump de versão dos pacotes
pnpm exec tsx packages/cli/src/bin.ts <args>   # CLI em desenvolvimento, sempre a partir da raiz (lockfile e agentes são os do cwd)
```

## Regras do catálogo

- Posição: `skills/<name>/SKILL.md`. Em `skills/` só entram skills, `_categories.json`, `_deprecated.json` e `LICENSE`.
- Frontmatter: só `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`. `name` = pasta, `^mass-[a-z0-9]+(-[a-z0-9]+)*$`, até 64 caracteres. `license: CC-BY-4.0`. `metadata` com `author`, `version` (semver), `category` (id de `_categories.json`), `tags` (string separada por vírgula), `reviewed` (`YYYY-MM-DD`); todo valor é string.
- Description: `[What it does]. Use when "a", "b" or "c". Do NOT use for X (use mass-y).` até 1024 caracteres.
- Skills em inglês; `SKILL.md` curto, material longo em `references/`; scripts com `#!` e bit executável.
- Deprecar = remover a pasta e registrar em `_deprecated.json` (`since`, `replacedBy`, `reason`).
- Commits em Conventional Commits.

## Orientações ao modelo

- Antes de instalar ou integrar dependências, funcionalidades ou tecnologias: consultar a documentação oficial via Context7 (`mcp__context7__query-docs`); usar web search se faltar informação recente.
- Design do site segue [@DESIGN.md](./DESIGN.md); tokens em `apps/site/src/styles/global.css` com os mesmos nomes.
- Nunca publicar no npm à mão: a publicação é feita só por `release.yml`.

## Dogfooding

- O repositório usa as próprias skills: as 8 `mass-*` do catálogo estão instaladas pelo `mass-skills` em `.claude/skills/` (Claude Code) e `.agents/skills/` (Cursor, Codex, Copilot, OpenCode, Gemini CLI, Cline), rastreadas em `mass-skills.lock.json`. As três coisas são commitadas;
- Nunca instale nada nessas pastas com `npx skills add` nem à mão. Use o pacote publicado, a partir da raiz: `npx @mass-solutions/skills-cli install <skill>` para adicionar ou reinstalar, `npx @mass-solutions/skills-cli update` depois de um release, `npx @mass-solutions/skills-cli doctor` para conferir. Skill ainda fora da última tag: acrescente `--ref main`.
- `test/repo/dogfood.test.ts` (em `pnpm check`) exige que o lockfile cubra exatamente as skills de `skills/`, que cada uma exista nas duas pastas com o `contentHash` do lockfile e que não haja pasta fora do lockfile. Uma skill nova no catálogo só passa no check depois de instalada aqui.
- Skills pessoais (fora do catálogo) vão para `~/.claude/skills`, não para o projeto.

## CLI `mass-skills`

- `run(argv, { cwd, env, stdout, stderr })` em `packages/cli/src/run.ts` é a única entrada; nunca chama `process.exit`, devolve o exit code (`0` sucesso, `1` falha, `2` uso).
- `MASS_SKILLS_BASE_URL` troca a base de download; `MASS_SKILLS_NO_AUDIT=1` desliga o log `mass-skills.audit.jsonl` (`packages/cli/src/audit.ts`).
- `install` baixa e verifica em diretório temporário antes de escrever; `update` só sobrescreve edição local com `--force`; `remove` só apaga nos agentes do lockfile.
- O CLI baixa o catálogo em `v${version}` (`DEFAULT_REF` em `packages/cli/src/download.ts`); a tag de release precisa ser exatamente `v<versão do CLI>`.

## Site `apps/site`

- Catálogo lido de `../../skills`; `MASS_CATALOG_ROOT` aponta para outro. Rode `pnpm registry` antes de construir.
- Chrome traduzido em `src/lib/i18n.ts`; corpo das skills em inglês nas duas rotas.
- Único JavaScript: busca e filtro do catálogo sobre `search-index.json` (`<script is:inline>`).
- Badges de verificação e `/security/` vêm de `src/lib/security.ts`: validador rodado no build, `security-status.json` ao lado do registry (ausente fora do `pages.yml`), `security-scan-allowlist.yaml` e a versão do CLI. Tudo tolera ausência de arquivo.
- Os testes constroem o site de verdade (`apps/site/test/helpers.ts`).

## CI e release

- `ci.yml` (PR e `main`): `pnpm check`, `pnpm build`, `plugin validate`. Sem secrets.
- `pages.yml` (`workflow_run` de `security-scan` em `main`, ou `workflow_dispatch`): baixa o artefato `security-status` do run que o disparou para a raiz do repo e faz o deploy do site no GitHub Pages a partir do commit escaneado. Sem artefato, o site sai com "not scanned in this build".
- `security-scan.yml`: `tools/allowlist.ts` sempre; Snyk Agent-Scan nas skills alteradas (`tools/changed-skills.ts`) em PR e no catálogo inteiro em `main`. Erro `X007` (limite diário do Snyk) não bloqueia. Fora de PR, grava `security-status.json` (`tools/security-status.ts`: `passed`, `failed` ou `skipped` com `reason`) mesmo quando o scan falha, e sobe como artefato para o site.
- `stale-skills.yml` (segunda 09:00 UTC): alimenta a issue `Stale skills`.
- `release.yml` (tag `v*`): `pnpm check`, `pnpm build`, publica os pacotes no npm via trusted publishing (OIDC, `--provenance`) e cria o GitHub Release. Aborta se a tag não bater com `packages/cli/package.json` ou se algum tarball contiver `workspace:`. Rerun da mesma tag é seguro.
- Fluxo de release: `pnpm changeset version`, `pnpm check`, `pnpm build`, PR com o bump mergeado em `main`, depois `git tag v<versão> && git push origin v<versão>`. Depois da tag, `npx @mass-solutions/skills-cli update` e commit de `mass-skills.lock.json` com as pastas instaladas, para o dogfooding acompanhar o catálogo.

## Fluxo com o GitHub Project

- Roadmap: [Project #5](https://github.com/users/maiconsouza89/projects/5), campos `Priority` (P0/P1/P2/Backlog), `Area` (CLI/Core/Site/CI/Catalog) e `Complexity` (Low/Medium/High). Trabalho grande vira sub-issues com *blocked by*.
- Escrita no Project é feita por workflows com `PROJECT_TOKEN` (sessões web não alcançam a API de Projects).
- **Ao começar uma issue, rode `pnpm start-issue <N>` antes de qualquer outra coisa.** Se esqueceu, rode assim que perceber.
- **Para implementar uma issue, use a skill `/mass-issue-implement`.** Ela vem no checkout (`.claude/skills/mass-issue-implement`); siga o `SKILL.md`. Não implemente a issue sem a skill. Se a pasta faltar, reinstale com `npx @mass-solutions/skills-cli install mass-issue-implement` (ver Dogfooding), nunca com `npx skills add`.
- **Sessão do Claude Code web** (`CLAUDE_CODE_REMOTE=true`): a sessão já nasce numa branch própria e o push só é permitido nela. Não crie nem troque de branch; `pnpm start-issue` detecta a sessão, mantém a branch atual e só atribui a issue. Dependências são instaladas pelo hook `SessionStart` em `.claude/settings.json`; as skills já estão no checkout.
- **No Claude Code web a skill `/mass-issue-implement` é obrigatória.** O ambiente é efêmero: o chat se perde quando a sessão acaba e só o que está na issue e no PR sobrevive. É ela que grava plano, decisões e entrega como comentários na issue.
- **Triagem:** `triage.yml` roda quando uma issue é aberta. O `claude-code-action` classifica só com `Read` (a issue, as rubricas de `mass-issue-priority` e `mass-issue-complexity`, a regra de Area abaixo) e devolve JSON via `--json-schema`; um step valida os valores, grava os três campos e comenta `Triage: ...`. Para triar de novo: "Re-run workflow" na aba Actions ou `workflow_dispatch` (`gh workflow run triage.yml -f issue=<N>`). Ajuste manual nos dropdowns do board.
- **Regra de Area** (prefixo do título): `cli:` → CLI; `core:` e `mcp:` → Core; `site:` → Site; `ci:` e `release:` → CI; `catalog:` e `skill:` → Catalog. Com `tools:`, `docs:` ou sem prefixo, decida pelos caminhos citados no corpo, contando `tools/` e `.github/` como CI.
- Sem `gh`, os scripts de `tools/` caem para `fetch` com `GH_TOKEN`/`GITHUB_TOKEN`; sem nenhum, use o GitHub MCP.
- PR com `Closes #N` (o template já traz). Merge por squash.
