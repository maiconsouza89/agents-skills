# Mass Solutions Skills - checks

Profile: standard
Plan: `.specs/features/mass-solutions-skills/plan.md`

## Intent

82 checks in 8 slices · 11 one-way doors · 4 open (go-live), of which 0 block the build

Runner: `vitest` 5 na raiz (workspace), invocado como `pnpm vitest run <arquivo> -t "<nome>"`. Testes de repositório em `test/repo/`, testes de pacote em `packages/*/test/` e `apps/site/test/`. Provas de spike são scripts em `tools/spike/` com exit code. O CLI expõe `run(argv, { cwd, env, stdout, stderr })` para os testes chamarem em processo, e lê a base de download de `MASS_SKILLS_BASE_URL` (default `https://raw.githubusercontent.com/maiconsouza89/mass-solutions-skills/`), o que permite servir um clone por HTTP local nos testes.

## Checks

### S1 - Repositório, governança e documentos · ~30 files · ~45 KB · ~11k

**C1** ✅ - `pnpm install --frozen-lockfile` resolve `packages/core`, `packages/cli` e `apps/site` como workspaces e `pnpm-workspace.yaml` os declara (GOV-01, AC 1)
Proof: `pnpm install --frozen-lockfile && pnpm vitest run test/repo/workspace.test.ts -t "workspace declares the three packages"`

**C2** ✅ - `package.json` da raiz expõe `check`, `validate`, `registry`, `build`, `test`, `scan`, `new-skill` e `stale`, e `check` encadeia `validate`, `registry --check` e `test` (GOV-01, AC 2)
Proof: `pnpm vitest run test/repo/workspace.test.ts -t "root scripts"`

**C3** - `pnpm new-skill mass-exemplo` cria `SKILL.md` com frontmatter completo (description na fórmula, `version: "0.1.0"`, `reviewed` = hoje) e `README.md`, e o resultado passa em `validateSkill` (GOV-01, AC 3)
Proof: `pnpm vitest run test/repo/new-skill.test.ts -t "scaffolds a skill that validates"`

**C4** - `pnpm new-skill` com nome fora de `^mass-[a-z0-9]+(-[a-z0-9]+)*$` sai com `2`, imprime a regra e não cria arquivo (GOV-01, AC 4)
Proof: `pnpm vitest run test/repo/new-skill.test.ts -t "rejects an invalid name with exit 2"`

**C5** - `LICENSE` é MIT, `skills/LICENSE` é CC-BY-4.0, e ambos os READMEs declaram a divisão (GOV-02, AC 5)
Proof: `pnpm vitest run test/repo/docs.test.ts -t "licenses"`

**C6** - `README.md` e `README.pt-br.md` têm as seções na ordem: o que é, instalação com três caminhos e aviso de hash, skills, contribuição, segurança, licença (GOV-02, AC 6)
Proof: `pnpm vitest run test/repo/docs.test.ts -t "readme sections in order"`

**C7** - `CONTRIBUTING.md` contém issue-first, o fluxo `new-skill` → `check` → PR, conventional commits e a regra de `metadata.reviewed` (GOV-02, AC 7)
Proof: `pnpm vitest run test/repo/docs.test.ts -t "contributing"`

**C8** - `SECURITY.md` aponta `/security/advisories/new`, veta issue pública, descreve validador + Snyk e a allowlist com `expiresAt` (GOV-02, AC 8)
Proof: `pnpm vitest run test/repo/docs.test.ts -t "security policy"`

**C9** - `.github/CODEOWNERS` contém exatamente as linhas `* @maiconsouza89` e `/skills/ @maiconsouza89` (GOV-03, AC 9)
Proof: `pnpm vitest run test/repo/github.test.ts -t "codeowners"`

**C10** - Os dois issue forms existem, são YAML válido com `name`, `description`, `body`, e trazem os campos listados no AC (GOV-03, AC 10)
Proof: `pnpm vitest run test/repo/github.test.ts -t "issue templates"`

**C11** - `PULL_REQUEST_TEMPLATE.md` tem "Issue vinculada: #" e o checklist com `pnpm check` e `metadata.reviewed` (GOV-03, AC 11)
Proof: `pnpm vitest run test/repo/github.test.ts -t "pull request template"`

**C12** - `dependabot.yml` declara `npm` e `github-actions`, ambos `weekly` (GOV-03, AC 12)
Proof: `pnpm vitest run test/repo/github.test.ts -t "dependabot"`

**C13** - `AGENTS.md` traz as regras do catálogo e o bloco `## tlc-spec-lean` com `profile: standard` e `budget: 150k`; `CLAUDE.md` aponta para `AGENTS.md` e mantém a regra de idioma (GOV-03, AC 13)
Proof: `pnpm vitest run test/repo/docs.test.ts -t "agents and claude"`

**C14** ✅ - `.gitignore` cobre `.claude/skills/`, `skills-lock.json`, `node_modules/`, `apps/site/dist/`, `.astro/`, e `git ls-files` não retorna nada sob `.claude/skills/` (GOV-03, AC 14)
Proof: `pnpm vitest run test/repo/gitignore.test.ts -t "tooling skills are untracked"`

### S2 - Core, validador e registry · ~20 files · ~70 KB · ~18k

**C15** ✅ - `validateCatalog(root)` percorre só `skills/*/SKILL.md`, ignora `.claude/`, `node_modules/`, `packages/`, `apps/`, e `pnpm validate` sai com `0` sobre o catálogo (CORE-01, AC 15)
Proof: `pnpm vitest run packages/core/test/validate.test.ts -t "walks only the catalog"` · `pnpm validate`

**C16** ✅ - Um achado é impresso como `<rule-id> <path>:<line> <mensagem>` e o processo sai com `1` (CORE-01, AC 16)
Proof: `pnpm vitest run packages/core/test/validate-bin.test.ts -t "prints one line per finding and exits 1"`

**C17** ✅ - Chave fora das 6 do spec gera `frontmatter/unknown-key` (CORE-01, AC 17)
Proof: `pnpm vitest run packages/core/test/rules.test.ts -t "unknown key"`

**C18** ✅ - `name` diferente da pasta, fora do regex `mass-`, ou acima de 64 chars gera `frontmatter/name` (3 casos) (CORE-01, AC 18)
Proof: `pnpm vitest run packages/core/test/rules.test.ts -t "name rule"`

**C19** ✅ - `description` vazia, acima de 1024 ou fora da fórmula gera `frontmatter/description` (3 casos) (CORE-01, AC 19)
Proof: `pnpm vitest run packages/core/test/rules.test.ts -t "description rule"`

**C20** ✅ - `frontmatter/metadata` cobre os 9 casos: `license` ≠ `CC-BY-4.0`, ausência de `author`/`version`/`category`/`tags`/`reviewed`, `version` não semver, `category` fora de `_categories.json`, `reviewed` futuro, valor não string (CORE-01, AC 20)
Proof: `pnpm vitest run packages/core/test/rules.test.ts -t "metadata rule"`

**C21** ✅ - `compatibility` acima de 500 chars gera `frontmatter/compatibility` (CORE-01, AC 21)
Proof: `pnpm vitest run packages/core/test/rules.test.ts -t "compatibility rule"`

**C22** ✅ - Byte `0x00` nos primeiros 8192 bytes gera `content/binary` (CORE-02, AC 22)
Proof: `pnpm vitest run packages/core/test/rules.test.ts -t "binary rule"`

**C23** ✅ - Cada um dos 4 padrões de segredo gera `security/secret` (CORE-02, AC 23)
Proof: `pnpm vitest run packages/core/test/rules.test.ts -t "secret patterns"`

**C24** ✅ - Cada um dos 5 padrões de shell perigoso gera `security/shell` (CORE-02, AC 24)
Proof: `pnpm vitest run packages/core/test/rules.test.ts -t "shell patterns"`

**C25** ✅ - Cada uma das 5 frases de prompt injection, sem distinção de caixa, gera `security/prompt-injection` (CORE-02, AC 25)
Proof: `pnpm vitest run packages/core/test/rules.test.ts -t "prompt injection phrases"`

**C26** ✅ - Script sem `#!` gera `scripts/shebang`; sem modo `100755` no git gera `scripts/executable` (CORE-02, AC 26)
Proof: `pnpm vitest run packages/core/test/rules.test.ts -t "scripts rule"`

**C27** ✅ - 3001 tokens gera `size/tokens-warn` sem mudar o exit code; 6001 tokens ou 501 linhas gera `size/tokens` (CORE-02, AC 27)
Proof: `pnpm vitest run packages/core/test/rules.test.ts -t "size rule"`

**C28** ✅ - Link relativo para arquivo inexistente gera `links/missing` (CORE-02, AC 28)
Proof: `pnpm vitest run packages/core/test/rules.test.ts -t "missing link"`

**C29** ✅ - `evals/` sem `triggers.json` com `should` e `shouldNot` gera `evals/shape` (CORE-02, AC 29)
Proof: `pnpm vitest run packages/core/test/rules.test.ts -t "evals shape"`

**C30** ✅ - `buildRegistry` produz a forma da door 3: `files[]` ordenado por `path`, `sha256` minúsculo, `tags` array, `tokens = ceil(chars/4)`, `deprecated` copiado, `generatedAt` ISO UTC; e `contentHash` bate com o vetor conhecido calculado à mão sobre uma skill fixa (CORE-03, AC 30)
Proof: `pnpm vitest run packages/core/test/registry.test.ts -t "registry shape"` · `pnpm vitest run packages/core/test/registry.test.ts -t "contentHash known answer"`

**C31** ✅ - `registry --check` sai com `1` e lista os campos divergentes quando o commitado difere em algo além de `generatedAt` (CORE-03, AC 31)
Proof: `pnpm vitest run packages/core/test/registry-bin.test.ts -t "check detects drift"`

**C32** ✅ - Nome deprecado que ainda tem pasta, ou `replacedBy` inexistente, gera `deprecated/conflict` (2 casos) (CORE-03, AC 32)
Proof: `pnpm vitest run packages/core/test/rules.test.ts -t "deprecated conflict"`

**C33** ✅ - `packages/core` exporta `parseSkill`, `validateSkill`, `validateCatalog`, `hashFiles`, `buildRegistry` e os tipos, e nem `packages/cli/src` nem `apps/site/src` importam `gray-matter` ou `node:crypto` diretamente (CORE-03, AC 33)
Proof: `pnpm vitest run packages/core/test/exports.test.ts -t "public api"` · `pnpm vitest run packages/core/test/exports.test.ts -t "no duplicate parser"`

### S3 - Cinco skills-exemplo · 12 files · ~20 KB · ~5k

**C34** ✅ - As 5 skills existem em `skills/`, cada `SKILL.md` tem no máximo 80 linhas e `validateCatalog` retorna zero achados (SKL-01, AC 34)
Proof: `pnpm vitest run test/repo/catalog.test.ts -t "five example skills validate"`

**C35** ✅ - `mass-skill-authoring` tem `references/` referenciado pelo `SKILL.md` e `evals/triggers.json` com ≥ 3 `should` e ≥ 3 `shouldNot` (SKL-01, AC 35)
Proof: `pnpm vitest run test/repo/catalog.test.ts -t "skill-authoring exercises references and evals"`

**C36** ✅ - `mass-commit-message/scripts/` tem script com shebang e `100755`; `mass-pr-description/assets/` tem template referenciado (SKL-01, AC 36)
Proof: `pnpm vitest run test/repo/catalog.test.ts -t "commit-message scripts and pr-description assets"`

**C37** ✅ - `mass-code-review` tem `metadata.requires: "git, gh"` e `allowed-tools`; `mass-security-checklist` só tem `SKILL.md` (SKL-01, AC 37)
Proof: `pnpm vitest run test/repo/catalog.test.ts -t "code-review requires and security-checklist minimal"`

**C38** ✅ - `skills/_categories.json` cobre toda categoria usada e `skills/_deprecated.json` é `{}` (SKL-01, AC 38)
Proof: `pnpm vitest run test/repo/catalog.test.ts -t "categories and deprecated files"`

### S4 - Compatibilidade de descoberta · 5 files · ~5 KB · ~2k

**C39** - `marketplace.json` e `plugin.json` têm a forma da door 5 (`name: "mass-solutions"`, plugin `mass-solutions-skills`, `source: "./"`, `skills: ["./skills/"]`) (DISC-01, AC 39)
Proof: `pnpm vitest run test/repo/marketplace.test.ts -t "marketplace shape"`

**C40** - `npx skills add ./ --list` na raiz lista exatamente as 5 skills `mass-*` (DISC-01, AC 40)
Proof: `bash tools/spike/npx-skills-list.sh`

**C41** - `claude plugin validate .` sai com `0` (DISC-01, AC 41)
Proof: `bash tools/spike/claude-plugin-validate.sh`

**C42** - `claude plugin marketplace add ./` + `claude plugin install mass-solutions-skills@mass-solutions` deixam as 5 pastas no diretório instalado; o script remove o plugin e o marketplace ao final (DISC-01, AC 42)
Proof: `bash tools/spike/claude-plugin-install.sh`

### S5 - CLI `mass-skills` · ~25 files · ~80 KB · ~20k

**C43** - `list` baixa o registry do ref e imprime `<name>  <version>  <category>  <description≤80>` por skill, ordenado por `name`, exit `0` (CLI-01, AC 43)
Proof: `pnpm vitest run packages/cli/test/list.test.ts -t "lists skills in name order"`

**C44** - `search <termo>` filtra por `name`/`description`/`tags` sem caixa; sem resultado imprime `No skills match "<termo>"` e sai com `0` (CLI-01, AC 44)
Proof: `pnpm vitest run packages/cli/test/list.test.ts -t "search matches case-insensitively"` · `pnpm vitest run packages/cli/test/list.test.ts -t "search with no match"`

**C45** - `install` grava os arquivos em `<agent path>/<name>/` para cada um dos 8 agentes (projeto e, com `--global`, o path global) e registra a entrada no lockfile (CLI-02, AC 45)
Proof: `pnpm vitest run packages/cli/test/install.test.ts -t "installs into every agent path"`

**C46** - `sha256` de arquivo ou `contentHash` divergente: imprime `Integrity check failed for <name>: <path>`, exit `1`, nenhum arquivo no agente e lockfile intacto (2 casos) (CLI-02, AC 46)
Proof: `pnpm vitest run packages/cli/test/install.test.ts -t "integrity failure writes nothing"`

**C47** - Falha de rede no 2º de 3 arquivos deixa o diretório do agente e o lockfile como estavam (CLI-02, AC 47)
Proof: `pnpm vitest run packages/cli/test/install.test.ts -t "partial download leaves nothing behind"`

**C48** - Agente desconhecido: mensagem `Unsupported agent "<id>". Supported: ... npx skills add maiconsouza89/mass-solutions-skills`, exit `2` (CLI-02, AC 48)
Proof: `pnpm vitest run packages/cli/test/install.test.ts -t "unsupported agent exits 2"`

**C49** - `-a auto` escolhe pelas pastas `.claude/`, `.agents/`, `.windsurf/` presentes; sem nenhuma sai com `2` listando os ids (CLI-02, AC 49)
Proof: `pnpm vitest run packages/cli/test/install.test.ts -t "auto detects agents"` · `pnpm vitest run packages/cli/test/install.test.ts -t "auto with nothing detected exits 2"`

**C50** - Nome deprecado: `"<old>" is deprecated since <since>: <reason>. Use: <replacedBy>` e exit `1`; nome ausente: exit `2` sugerindo `mass-skills search` (CLI-02, AC 50)
Proof: `pnpm vitest run packages/cli/test/install.test.ts -t "deprecated is refused"` · `pnpm vitest run packages/cli/test/install.test.ts -t "unknown skill exits 2"`

**C51** - `path` com `..`, começando com `/`, ou `name` fora do regex: `Unsafe path`, exit `1`, nada gravado (3 casos) (CLI-02, AC 51)
Proof: `pnpm vitest run packages/cli/test/install.test.ts -t "unsafe path is refused"`

**C52** - O lockfile tem a forma da door 4, é gravado via `.tmp` + rename (nenhum `.tmp` sobra) e `mass-skills.lock.json` nunca lê nem escreve `skills-lock.json` (CLI-02, AC 52)
Proof: `pnpm vitest run packages/cli/test/lockfile.test.ts -t "lockfile shape and atomic write"`

**C53** - `update`: hash local ≠ gravado → `locally modified, skipped (use --force)` sem tocar; igual e registry maior → reinstala e atualiza o lockfile; igual e igual → `up to date` (3 casos) (CLI-03, AC 53)
Proof: `pnpm vitest run packages/cli/test/update.test.ts -t "update three outcomes"`

**C54** - `update --force` sobrescreve a skill modificada e grava `installedAt` novo (CLI-03, AC 54)
Proof: `pnpm vitest run packages/cli/test/update.test.ts -t "force overwrites local edits"`

**C55** - `update --check` imprime o estado de cada skill e não escreve nada (CLI-03, AC 55)
Proof: `pnpm vitest run packages/cli/test/update.test.ts -t "check writes nothing"`

**C56** - `doctor` reporta `ok`, `missing`, `modified`, `deprecated` (4 estados) e sai com `1` se algum ≠ `ok` (CLI-03, AC 56)
Proof: `pnpm vitest run packages/cli/test/doctor.test.ts -t "doctor reports every state"`

**C57** - `remove` apaga só nos agentes registrados para a skill e remove a entrada do lockfile, exit `0` (CLI-03, AC 57)
Proof: `pnpm vitest run packages/cli/test/remove.test.ts -t "removes only registered agents"`

**C58** - Registry ou arquivo `404`, ou erro de rede: `Failed to fetch <url>: <status ou erro>`, exit `1`, nada alterado (2 casos) (CLI-02, AC 58)
Proof: `pnpm vitest run packages/cli/test/install.test.ts -t "fetch failure"`

**C59** - Tabela de exit codes: `0` sucesso, `1` execução, `2` uso; erros vão para `stderr` e não para `stdout` (CLI-01, AC 59)
Proof: `pnpm vitest run packages/cli/test/exit-codes.test.ts -t "exit code contract"`

**C60** - `mass-skills validate` e `mass-skills registry --check` devolvem os mesmos exit codes que os scripts da raiz sobre o mesmo fixture (CLI-01, AC 60)
Proof: `pnpm vitest run packages/cli/test/mirrors.test.ts -t "validate and registry mirror root scripts"`

**C82** - Sem `MASS_SKILLS_BASE_URL`, a base de download é `https://raw.githubusercontent.com/maiconsouza89/mass-solutions-skills/<ref>/` com `ref` default `main` (CLI-02, AC 45, door 9)
Proof: `pnpm vitest run packages/cli/test/download.test.ts -t "default base url"`

### S6 - Site bilíngue · ~25 files · ~90 KB · ~22k

**C61** - `pnpm build` gera `/`, `/skills/<name>/` ×5, `/install/`, `/agents/`, `/search-index.json`, `/404.html` e os equivalentes sob `/pt-br/`, e todo link interno começa com `/mass-solutions-skills/` (SITE-01, AC 61)
Proof: `pnpm vitest run apps/site/test/build.test.ts -t "generates every route"`

**C62** - `content.config.ts` usa `glob()` com `base` no catálogo (`../../skills` ou `MASS_CATALOG_ROOT`) e não existe cópia de `SKILL.md` sob `apps/site/` (SITE-01, AC 62)
Proof: `pnpm vitest run apps/site/test/build.test.ts -t "reads the catalog in place"`

**C63** - A home lista as 5 skills agrupadas por categoria com rótulo do idioma, ordenadas por `name`, com `name`, `description`, `version`, campo de busca, filtro por categoria e link para a mesma página no outro idioma (SITE-01, AC 63)
Proof: `pnpm vitest run apps/site/test/build.test.ts -t "home lists grouped and ordered"`

**C64** - Busca sem resultado mostra `No skills match "<termo>"` / `Nenhuma skill corresponde a "<termo>"` sem esconder o campo (jsdom sobre o HTML gerado) (SITE-01, AC 64)
Proof: `pnpm vitest run apps/site/test/search.test.ts -t "no match message"`

**C65** - A página da skill mostra os 3 pedaços da description, corpo em inglês nas duas rotas, `metadata`, `files[]` com `bytes`, `contentHash`, link do fonte e o painel com os 3 comandos e o aviso de hash (SITE-02, AC 65)
Proof: `pnpm vitest run apps/site/test/build.test.ts -t "skill page content"`

**C66** - Skill sem `references/`, `scripts/`, `assets/` omite a seção de arquivos adicionais e lista só `SKILL.md` (SITE-02, AC 66)
Proof: `pnpm vitest run apps/site/test/build.test.ts -t "minimal skill omits extra files"`

**C67** - Nome em `deprecated` gera `/skills/<old>/` com `Deprecated since <since>`, `replacedBy` e sem painel de instalação (build sobre fixture com `MASS_CATALOG_ROOT`) (SITE-02, AC 67)
Proof: `pnpm vitest run apps/site/test/deprecated.test.ts -t "deprecated page"`

**C68** - `/install/` apresenta os 3 caminhos em ordem com o que cada um verifica; `/agents/` lista os 8 agentes com id, path de projeto e global (SITE-02, AC 68)
Proof: `pnpm vitest run apps/site/test/build.test.ts -t "install and agents pages"`

**C69** - `/404.html` existe e liga para `/` e `/pt-br/` (SITE-01, AC 69)
Proof: `pnpm vitest run apps/site/test/build.test.ts -t "404 page"`

**C70** - O CSS gerado usa fonte monoespaçada em `body`, `#fdfcfc` de fundo, `#201d1d` de tinta, `border-radius: 4px` só em seletores interativos, nenhum `box-shadow` nem `gradient`; a home usa `[+]`/`[-]` como marcadores (SITE-01, AC 70)
Proof: `pnpm vitest run apps/site/test/build.test.ts -t "design tokens"`

**C71** - Nenhuma página além da home contém `<script`; a home contém um único `<script` (SITE-01, AC 71)
Proof: `pnpm vitest run apps/site/test/build.test.ts -t "zero client js outside home"`

### S7 - CI, Pages e scan de segurança · 8 files · ~15 KB · ~4k

**C72** - `ci.yml` dispara em `pull_request` e `push` em `main`, usa `node-version-file: .nvmrc` e cache `pnpm`, roda `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm build` e `npx -y @anthropic-ai/claude-code@latest plugin validate .`, e não referencia `secrets.` (CI-01, AC 72)
Proof: `pnpm vitest run test/repo/workflows.test.ts -t "ci workflow"`

**C73** - `pages.yml` dispara em `push` em `main`, tem `pages: write` e `id-token: write`, usa `withastro/action` com `path: apps/site` e `package-manager: pnpm@11`, e `actions/deploy-pages` (CI-01, AC 73)
Proof: `pnpm vitest run test/repo/workflows.test.ts -t "pages workflow"`

**C74** - `security-scan.yml` dispara em `push` em `main` e `pull_request`, condiciona o passo Snyk a `push || head.repo.full_name == github.repository`, roda `uvx snyk-agent-scan@latest skills --ci` com `SNYK_TOKEN` e as `--ignore-risks` da allowlist (CI-02, AC 74)
Proof: `pnpm vitest run test/repo/workflows.test.ts -t "security scan workflow"`

**C75** - `pnpm exec tsx tools/allowlist.ts` sai com `1` e `Allowlist entry expired: <risk> <skill> <expiresAt>` para entrada vencida, e imprime `--ignore-risks a,b` para entradas vigentes; o passo roda sem condição no workflow (CI-02, AC 75)
Proof: `pnpm vitest run test/repo/allowlist.test.ts -t "expired entry fails"` · `pnpm vitest run test/repo/allowlist.test.ts -t "valid entries become ignore flags"`

**C76** - `stale-skills.yml` tem `cron: "0 9 * * 1"` e `workflow_dispatch`, e cria ou atualiza a issue `Stale skills` com label `stale-skill` a partir da saída de `pnpm stale` (CI-03, AC 76)
Proof: `pnpm vitest run test/repo/workflows.test.ts -t "stale skills workflow"`

**C77** - Com saída vazia de `pnpm stale`, o workflow não cria issue e tem um passo que fecha a issue `Stale skills` aberta (CI-03, AC 77)
Proof: `pnpm vitest run test/repo/workflows.test.ts -t "stale workflow closes when nothing is stale"`

**C78** - `pnpm stale --days 90` imprime `<name> - reviewed <date> (<n> days)` por skill vencida e nada quando não há; exit `0` nos dois casos (CI-03, AC 78)
Proof: `pnpm vitest run test/repo/stale.test.ts -t "lists stale skills"` · `pnpm vitest run test/repo/stale.test.ts -t "prints nothing when none"`

### S8 - Release · 3 files · ~3 KB · ~1k

**C79** - `.changeset/config.json` tem `baseBranch: "main"` e ignora `site`; os dois pacotes têm `name` `@mass-solutions/skills-core` e `@mass-solutions/skills-cli` (REL-01, AC 79)
Proof: `pnpm vitest run test/repo/release.test.ts -t "changesets config"`

**C80** - `release.yml` dispara em tags `v*`, roda `pnpm check`, `pnpm build` e `gh release create ${{ github.ref_name }} --generate-notes` (REL-01, AC 80)
Proof: `pnpm vitest run test/repo/workflows.test.ts -t "release workflow"`

**C81** ✅ - O registry commitado tem `version: 1` e `repo: "maiconsouza89/mass-solutions-skills"` (REL-01, AC 81)
Proof: `pnpm vitest run packages/core/test/registry.test.ts -t "committed registry version and repo"`

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| validator rule ids (16) | `frontmatter/unknown-key` C17 · `frontmatter/name` C18 · `frontmatter/description` C19 · `frontmatter/metadata` C20 · `frontmatter/compatibility` C21 · `content/binary` C22 · `security/secret` C23 · `security/shell` C24 · `security/prompt-injection` C25 · `scripts/shebang` C26 · `scripts/executable` C26 · `size/tokens-warn` C27 · `size/tokens` C27 · `links/missing` C28 · `evals/shape` C29 · `deprecated/conflict` C32 | - |
| secret patterns (4) | C23, table-driven over all 4 | - |
| shell patterns (5) | C24, table-driven over all 5 | - |
| prompt-injection phrases (5) | C25, table-driven over all 5 | - |
| metadata cases (9) | C20, table-driven over all 9 | - |
| name cases (3) | differs from folder C18 · bad regex C18 · over 64 C18 | - |
| description cases (3) | empty C19 · over 1024 C19 · off formula C19 | - |
| size thresholds (3) | 3001 tokens warn C27 · 6001 tokens fail C27 · 501 lines fail C27 | - |
| CLI commands (8) | `list` C43 · `search` C44 · `install` C45 · `update` C53 · `remove` C57 · `doctor` C56 · `validate` C60 · `registry` C60 | - |
| agent adapters (8) | `claude-code` C45 · `cursor` C45 · `codex` C45 · `github-copilot` C45 · `opencode` C45 · `windsurf` C45 · `gemini-cli` C45 · `cline` C45 | - |
| install refusals (5) | integrity C46 · unsupported agent C48 · deprecated C50 · unknown skill C50 · unsafe path C51 | - |
| unsafe path cases (3) | `..` C51 · leading `/` C51 · bad name C51 | - |
| update outcomes (4) | `locally modified` C53 · `update available` C53 · `up to date` C53 · `--force` C54 | - |
| doctor states (4) | `ok` C56 · `missing` C56 · `modified` C56 · `deprecated` C56 | - |
| CLI exit codes (3) | `0` C59 · `1` C59 · `2` C59 | - |
| `GET raw/.../skills-registry.json` statuses (2) | 200 C43 · 404 C58 | - |
| `GET raw/.../skills/<name>/<path>` statuses (2) | 200 C45 · 404 C58 | - |
| `mass-skills list`/`search` exits (3) | 0 C43 · 1 C58 · 2 C59 | - |
| `mass-skills install` exits (3) | 0 C45 · 1 C46 · 2 C48 | - |
| `mass-skills update`/`doctor` exits (3) | 0 C55 · 1 C56 · 2 C59 | - |
| site routes under `/mass-solutions-skills/` (8) | `/` C63 · `/pt-br/` C61 · `/skills/<name>/` C65 · `/pt-br/skills/<name>/` C61 · `/install/` C68 · `/agents/` C68 · `/search-index.json` C61 · `/404.html` C69 | - |
| site route statuses (2) | 200 C61 · 404 C69 | - |
| `.claude-plugin/marketplace.json` readers (3) | Claude Code validate C41 · Claude Code install C42 · `npx skills` C40 | - |
| workflows (5) | `ci.yml` C72 · `pages.yml` C73 · `security-scan.yml` C74 · `stale-skills.yml` C76 · `release.yml` C80 | - |
| root scripts executed (8) | `check` C2 · `validate` C15 · `registry` C30 · `build` C61 · `test` C2 · `scan` C74 · `new-skill` C3 · `stale` C78 | - |
| example skills (5) | `mass-skill-authoring` C35 · `mass-commit-message` C36 · `mass-pr-description` C36 · `mass-code-review` C37 · `mass-security-checklist` C37 | - |
| one-way doors (11) | 1 catalog position C15 · 2 frontmatter C17 · 3 registry C30 · 4 lockfile C52 · 5 marketplace C39 · 6 deprecated/categories C32 · 7 monorepo C1 · 8 licenses C5 · 9 public names C82 · 10 agents table C45 · 11 exit codes C59 | - |
| entities (8) | `Skill` C30 · `SkillFile` C30 · `Registry` C30 · `Deprecation` C32 · `Lockfile` C52 · `LockEntry` C52 · `Agent` C45 · `Category` C20 | - |
| startup config: download base (2 assemblies) | bin default C82 · test harness via `MASS_SKILLS_BASE_URL` C43 | - |
| startup config: catalog root for the site (2 assemblies) | default `../../skills` C62 · fixture via `MASS_CATALOG_ROOT` C67 | - |

- Claims naming a status code, route or response shape: C43, C45, C58, C61, C69 - each has a proof that crosses the boundary (HTTP local ou build real)
- `scan` (root script) is proven present and wired (C2, C74); it is not executed anywhere because it needs `SNYK_TOKEN` - the allowlist half is executed in C75
- No other check claims more than the cases its proof exercises

## Test policy

O repositório nasce nesta feature e não tem guideline de testes, então estas linhas são a régua do build. Não há analogia no repo; a régua vem da forma do código planejado.

| Code | Required proofs | Coverage expectation |
| --- | --- | --- |
| Decides, reached across a boundary | one at the boundary **and** one at its own layer | the contract at the boundary; one asserted case per row of the decision table at its own layer |
| Decides, not reached across a boundary | one at its own layer | one asserted case per row of the decision table |
| Entry point that decides nothing | one at the boundary | accepted input, each rejected input, each error path |
| Instrumentation, pass-throughs | none of its own | covered by its consumer's proof |

Evidence:

- `packages/core/src/rules/*.ts`: 16 rule ids, ~30 branch points -> decides, not across a boundary -> C17-C29, C32 at its own layer
- `packages/core/src/registry.ts`: ordering, hashing, `deprecated` merge, 4 branch points -> decides -> C30, C31
- `packages/cli/src/commands/install.ts`: agent resolution (8 + auto), integrity, deprecated, unsafe path, temp-then-move; ~12 branch points -> decides, reached across a boundary (HTTP + fs) -> C45-C51 at the boundary (HTTP local) and `agents.ts` table at its own layer (C45 table-driven)
- `packages/cli/src/commands/update.ts`: 3-way outcome + `--force` + `--check` -> decides -> C53-C55
- `packages/cli/src/commands/doctor.ts`: 4 states -> decides -> C56
- `packages/cli/src/download.ts`: forwards `fetch`, maps status to error -> instrumentation, covered by C58
- `apps/site/src/**`: templates that map registry + collection to HTML, decisions only in grouping/ordering and deprecated branch -> entry points proven at the boundary (built output) -> C61-C71
- `tools/*.ts` (`new-skill`, `stale`, `allowlist`): each 2-3 branch points -> decides -> C3, C4, C75, C78

Cost: 9 proofs at their own layer across 6 files, beyond the boundary proofs. Sem estas linhas, a tabela de agentes e as 16 regras seriam provadas só pelo caminho que o `install` e o `pnpm validate` atravessam. Estas linhas não foram gravadas em `AGENTS.md`; o build roda sob elas.

## Swept

- validation: C17-C29, C51 (input do registry no CLI), C10 (issue forms)
- failure modes: C46, C47, C58 (nada gravado em falha), C31 (drift do registry)
- idempotency: C53 (`up to date` não escreve), C55, C77 (issue atualizada, não duplicada)
- authorization: n/a - leitura pública em todo lado; controle de escrita é branch protection + CODEOWNERS (C9), configurados fora do repo (open question 2)
- concurrency: C52 - escrita atômica do lockfile por `.tmp` + rename; duas execuções simultâneas do CLI no mesmo projeto: último vence, sem lock no v1 (limitação declarada, não há requisito)
- data lifecycle: C50, C67 (deprecada nunca é removida do usuário), C57 (remoção só explícita), C76-C78 (revisão a 90 dias)
- dependency failure: C58 (raw GitHub `404`/rede), C75 (allowlist roda sem Snyk), C74 (Snyk só onde há token)
- state transitions: C53, C54, C56 (instalada -> modificada / ausente / deprecada / atualizada)
- observability: C16 (uma linha por achado com regra e `path:line`), C59 (erros em `stderr`); métricas de instalação: n/a - GitHub Insights, fora do repo

## Handoff

Intended split, with the arithmetic, written before any code:

- Estimativa de leitura (tudo novo, `wc -c` previsto): S1 45 KB + S2 70 KB + S3 20 KB + S4 5 KB + S5 80 KB + S6 90 KB + S7 15 KB + S8 3 KB ≈ 330 KB ≈ 83k tokens, abaixo do budget de 150k -> pelo critério de leitura, um builder.
- Três batches mesmo assim, em fronteiras onde a surface muda: **B1 = S1-S4** (repo, core, catálogo, descoberta), **B2 = S5** (CLI), **B3 = S6-S8** (site, CI, release). Razão: a saída de ferramentas de cada batch (`astro build`, servidor HTTP nos testes do CLI, `npx skills`) enche o contexto de um builder muito antes do que a leitura dos arquivos; o corte em fronteira de surface é o que faz o diff de B1 ser lido por B2 sem narrativa.
- Cada batch só passa para o próximo em verde. O Verifier roda ao final de B3 sobre `<feature base>..HEAD` com os 82 checks.
