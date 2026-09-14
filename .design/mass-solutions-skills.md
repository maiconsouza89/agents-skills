# Mass Solutions Skills: catálogo público de skills com governança privada

> Plan this with **tlc-plan**.
> Decisions below carry the literal shape - copy them, do not re-derive them.

## Situation

- Project: in active construction. Este diretório (`agents-skills`) é hoje só um workspace consumidor: 3 skills de terceiros instaladas, 4 commits, sem remote.
- Decision: committed by @maiconsouza89, 2026-09-14, nesta sessão de discovery. Recomeçar do zero aqui, sem herdar tooling nem skills do rascunho.
- In flight: `maiconsouza89/mass-agents-skills`, repo público criado hoje (00:55) por uma sessão do Claude sem acompanhamento, com 9 skills `mass-*`, CLI com lockfile e sha256, validador, registry, marketplace do Claude Code, CI verde e site no GitHub Pages. Descartado por estrutura (pacote único, site gerado à mão) e por não ter sido revisado. Serve apenas como referência de padrões. Continua público com a mesma marca e um site no ar; precisa ser arquivado para não concorrer com o novo.
- At stake: reversível. Nada foi publicado sob o nome novo, nenhum usuário externo depende de nada. O custo de errar é retrabalho de dias, não migração.

## Problem

Problema de construção. A Mass Solutions quer divulgar skills próprias para agentes de código com padrão de mercado em qualidade e segurança. Hoje não existe lugar onde uma skill da Mass possa ser publicada, validada, instalada por terceiros e mantida ao longo do tempo. O substituto atual é copiar pastas `.claude/skills/` à mão entre projetos, o que não é divulgável nem verificável.

O que este repositório tem de tornar possível: um desenvolvedor qualquer, em qualquer agente compatível com o formato Agent Skills, encontra uma skill da Mass num site, instala com um comando, recebe atualizações verificadas e sabe quem mantém aquilo. Do lado da Mass: escrever uma skill nova segue um contrato validado em CI, com dono, versão e data de revisão.

O que fica travado sem ele: não há onde publicar as skills que a Mass já escreve para uso interno, e cada uma continua vivendo copiada em projetos. Por que agora e não depois das skills: o usuário decidiu que a infra completa vem primeiro, com 5 skills curtas de exemplo cujo papel é fixar os padrões do repo, não entregar valor de conteúdo.

"Privado" neste pedido significa controle de escrita, não de leitura: branch protegida, CODEOWNERS, revisão obrigatória, contribuição externa por issue antes de PR. O conteúdo das skills é público.

## Evidence

- 0 skills próprias neste repo hoje; 9 no rascunho descartado. A infra nasce sem carga real, por decisão do usuário.
- Não há como medir demanda antes de existir: ninguém instrumentou nada porque nada foi publicado. O usuário estima a audiência como "comunidade, qualquer dev, vários agentes". Medir passa a ser possível com GitHub Insights (clones, visitantes) e stars após o primeiro release.
- Instalador aberto `npx skills add <owner>/<repo>` (vercel-labs/skills) instala de qualquer repo público em 70+ agentes, mas não tem lockfile nem verificação de hash de conteúdo. É o que separa "instalação em um comando" de "instalação verificada", e o que justifica um CLI próprio.
- Descoberta do `npx skills`: varre `skills/`, `.claude/skills/`, `.agents/skills/` até 3 níveis, e lê `.claude-plugin/marketplace.json`. Um layout `packages/catalog/skills/` só é encontrado com `--full-depth`. Isso decide onde as skills ficam no monorepo.
- Repo de referência (tech-leads-club/agent-skills, 6.034 stars): documenta que PRs automatizados afogaram a revisão e migrou para "issue primeiro". Também documenta que o scan de segurança não roda em PR de fork por falta de segredos.

## Journey

Duas jornadas, confirmadas.

**Quem instala.** Encontra o site (EN ou PT), lê a lista, abre a página de uma skill, copia o comando de instalação, instala no agente, usa. Semanas depois roda update. Um dia a skill é descontinuada.

- Catálogo com 5 skills: a página inicial precisa parecer um catálogo, não um placeholder. Sem estado "vazio" a tratar no v1.
- Agente não suportado pelo CLI: erro nomeando a lista suportada e apontando `npx skills add` como alternativa.
- Hash divergente no download: recusa e não escreve nada no diretório do agente.
- Usuário editou a skill localmente e roda `update`: o CLI detecta pelo hash do lockfile, avisa e pula; sobrescreve só com `--force`. Nada do usuário é perdido por acidente.
- Skill descontinuada ou renomeada: `install` do nome antigo recusa e aponta a substituta; `update` e `doctor` avisam quem já tem; nada é removido sozinho.
- Instalação sem o CLI (`npx skills add` ou marketplace do Claude Code): funciona sem token e sem falar com a Mass; perde verificação de hash, e o site diz isso.

**Quem mantém.** Abre issue de proposta, faz scaffold, escreve, roda `check`, abre PR, CI valida, owner revisa, merge, release, site republica.

- Contribuidor externo: issue primeiro; PR só com aval explícito. PR sem issue vinculada é fechado com redirecionamento, não rejeição.
- PR de fork: CI roda validação e testes sem segredos; o scan Snyk roda só em push para `main` e PRs do próprio repo.
- Skill reprovada no validador: CI falha com a regra e o arquivo nomeados.
- Skill sem revisão há 90 dias: issue semanal automática lista as vencidas.
- Relato de vulnerabilidade: security advisory privado, nunca issue pública.

## Verdict

build - already committed, see Situation. Confirmed by @maiconsouza89, 2026-09-14.

O trabalho do problema contradisse o pedido em um ponto, apresentado e mantido pelo usuário: um CLI próprio quando `npx skills` já instala de qualquer repo público. Mantido porque o instalador aberto não verifica integridade, e "segurança" é metade do pedido.

Cheaper paths considered:
- Publicar só `skills/` + README num repo público e deixar `npx skills` instalar: elimina CLI e site; descartado porque sem site não há divulgação e sem hash não há a garantia prometida.
- Contribuir as skills ao catálogo do tech-leads-club: ganha distribuição pronta; descartado porque a marca e a governança seriam deles.
- Evoluir o rascunho `mass-agents-skills`, que já cobre ~80% do escopo: descartado pelo usuário por estrutura e por não ter sido revisado.

## Success

- Worked if: um desenvolvedor de fora da Mass Solutions instala uma skill a partir do site sem contato com o mantenedor, em até 30 dias após a tag `v0.1.0`.
- Early signal: em 14 dias, GitHub Insights mostra clones e visitantes que não são o próprio mantenedor. Se só houver instalações suas, a divulgação falhou, não a infra.
- Review: 30 dias após `v0.1.0` - @maiconsouza89.
- Proxy estrutural, verificável no merge: 5 skills passam no validador em CI; `npx skills add maiconsouza89/mass-solutions-skills --list` e `/plugin marketplace add maiconsouza89/mass-solutions-skills` listam as 5; `mass-skills install` recusa um arquivo com hash alterado; site publicado em `/` e `/pt-br/`.

## Boundary

In: estrutura do repositório, contrato de frontmatter, validador, registry gerado, CI, governança (CODEOWNERS, branch protegida, SECURITY, CONTRIBUTING, templates de issue e PR, Dependabot), site bilíngue EN/PT, marketplace do Claude Code, CLI com lockfile e hash, scan Snyk Agent Scan, 5 skills-exemplo curtas, arquivamento do rascunho.
Out: servidor MCP e publicação em npm - só fazem sentido com skills e demanda existentes. Skills de conteúdo real além das 5 de exemplo - vêm depois da infra, por decisão do usuário. Domínio próprio - GitHub Pages basta no v1.

## Prior art

- tech-leads-club/agent-skills - levamos: hash de conteúdo por skill, lockfile atômico, sanitização de nome e path, allowlist de falsos positivos com data de expiração, `metadata.author` e revisão obrigatória, fórmula de description "[o que faz] + Use when + Do NOT use for".
- Falha reportada por eles: PRs automatizados em volume consumiram a revisão; resposta foi issue-first. Adotado como política desde o primeiro dia.
- Pesado demais deles: Nx, Ink (TUI com React), MCP server, publicação em npm do catálogo em CDN. Condição que não compartilhamos: dezenas de skills, múltiplos mantenedores e usuários que já dependem do pacote npm. Ficam fora.
- Formato Agent Skills (agentskills.io): chaves de frontmatter permitidas são `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`; `name` igual à pasta, kebab-case, até 64 caracteres; `description` até 1024; corpo abaixo de 500 linhas com material longo em `references/`. O validador aplica isso literalmente. A biblioteca `skills-ref` deles é Python e declarada "não para produção", então não entra na CI.
- Marketplace do Claude Code: `.claude-plugin/marketplace.json` com `name`, `owner.name`, `plugins[].name` e `plugins[].source`; skills carregadas de `skills/` por padrão ou por `skills: ["./path/"]`; `claude plugin validate .` existe.
- Snyk Agent Scan: `uvx snyk-agent-scan@latest <dir> --ci`, exige `SNYK_TOKEN`, escaneia diretórios de `SKILL.md`. Roda onde há segredos.

## Shape

A aposta: monorepo com o catálogo de skills na raiz, onde toda ferramenta de descoberta o encontra, e o tooling em pacotes separados. O site é Astro estático bilíngue lendo os `SKILL.md` direto do catálogo. O CLI é um pacote pequeno cuja única razão de existir é verificar integridade e manter um lockfile; instalação sem ele continua funcionando via `npx skills` e marketplace do Claude Code. Mudar a posição do catálogo depois custa reescrever todo path de descoberta, registry e site, então essa é a decisão a acertar agora; o resto é reversível.

### Adds

- `skills/<name>/SKILL.md` na raiz do repo: catálogo, sem `package.json`, uma pasta por skill com `references/`, `scripts/`, `assets/`, `evals/` opcionais.
- `skills/_categories.json` e `skills/_deprecated.json`.
- `skills-registry.json` na raiz: gerado, commitado, com sha256 por arquivo e por skill, categorias, tokens estimados.
- `.claude-plugin/marketplace.json` e `.claude-plugin/plugin.json` na raiz.
- `packages/core` (`@mass-solutions/skills-core`): parse de frontmatter, regras de validação, hash, tipos do registry, geração do registry.
- `packages/cli` (`@mass-solutions/skills-cli`, bin `mass-skills`): `list`, `search`, `install`, `update`, `remove`, `doctor`, `validate`, `registry`.
- `apps/site`: Astro, i18n `en` (sem prefixo) e `pt-br` (com prefixo), content collection via `glob` com base `../../skills`, páginas catálogo, skill, instalação, agentes.
- `pnpm-workspace.yaml`, `package.json` raiz com scripts `check`, `validate`, `registry`, `build`, `test`, `scan`, `new-skill`.
- `.github/workflows/ci.yml`, `pages.yml`, `security-scan.yml`, `stale-skills.yml`, `release.yml`.
- `.github/CODEOWNERS`, `ISSUE_TEMPLATE/skill-proposal.yml`, `ISSUE_TEMPLATE/skill-bug.yml`, `PULL_REQUEST_TEMPLATE.md`, `dependabot.yml`.
- `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `LICENSE` (MIT), `skills/LICENSE` (CC-BY-4.0), `AGENTS.md`.
- `security-scan-allowlist.yaml` na raiz.
- 5 skills-exemplo `mass-*`, cada uma exercitando um recurso estrutural distinto (ver Open).

### Changes

- `CLAUDE.md` deste diretório → passa a descrever o repo novo; mantém a regra de idioma (docs e respostas em pt-BR, código e skills em inglês).
- `.claude/skills/{grill-me,tlc-discover,tlc-spec-lean}` e `skills-lock.json` → continuam como tooling de desenvolvimento do próprio repo, fora do catálogo, ignorados pelo validador.
- `maiconsouza89/mass-agents-skills` → arquivado no GitHub após o `v0.1.0` do novo, com README apontando o sucessor. Ação manual do usuário.

### Leaves

- Servidor MCP, publicação em npm, domínio próprio (Boundary Out).

A alternativa mais pesada é o catálogo como pacote próprio em `packages/catalog/skills/` publicado em npm ou CDN, como faz o tech-leads-club; ela vence se um dia o CLI precisar instalar sem GitHub ou se o catálogo tiver ciclo de release separado do tooling, e hoje não há nenhum dos dois.

Também no campo, por perspectiva: dois repos (catálogo e tooling) - dobra governança para um mantenedor só; Next.js com export estático - i18n em export exige rotas manuais e o site é um catálogo de leitura; Ink para o CLI - TUI só compensa com navegação interativa, e o v1 é linha de comando.

## Roadmap

| Block | Delivers | Clarity |
|---|---|---|
| Bootstrap e governança | Repo `mass-solutions-skills` criado, monorepo pnpm, licenças, CODEOWNERS, branch `main` protegida, templates, Dependabot, SECURITY e CONTRIBUTING com issue-first | clear |
| Core, validador e registry | `packages/core` com contrato de frontmatter, regras de segurança estática, hash sha256, `skills-registry.json` gerado e checado em CI | clear |
| Cinco skills-exemplo | `skills/mass-*` curtas cobrindo `references/`, `scripts/`, `assets/`, `requires` e `evals/`, todas passando no validador | open |
| Compatibilidade de descoberta | Prova de que `npx skills add --list` e `/plugin marketplace add` enxergam as 5 skills no layout escolhido | spike |
| CLI | `mass-skills` com lockfile, verificação de hash, `update` que respeita edição local, `doctor`, recusa de deprecadas | clear |
| Site bilíngue | Astro em GitHub Pages, `/` e `/pt-br/`, catálogo, página por skill, guia de instalação | design |
| Scan de segurança | Snyk Agent Scan em `main` e PRs internos, allowlist com expiração, documentado para forks | clear |
| Arquivar rascunho | `mass-agents-skills` arquivado com aviso de sucessor | clear |

## Decisions

| Decision | Choice | Why this | Alternative, and what would make it win | Reversibility |
|---|---|---|---|---|
| Repositório | `maiconsouza89/mass-solutions-skills`, público | Conteúdo público por decisão; conta pessoal porque a org `mass-solutions` não foi confirmada como sua | Org `mass-solutions`, se você for owner dela; muda URL do site e namespace npm | costly |
| Posição do catálogo | `skills/<name>/SKILL.md` na raiz do repo | Único layout que `npx skills`, marketplace do Claude Code e humanos encontram sem flags | `packages/catalog/skills/` se o catálogo for publicado em npm/CDN com release próprio | costly |
| Estrutura | pnpm workspaces: `packages/core`, `packages/cli`, `apps/site`; sem Nx | Três pacotes não justificam orquestrador; pnpm resolve workspace e cache | Nx se o número de pacotes passar de ~6 ou o CI ultrapassar 5 min | reversible |
| Frontmatter | Só chaves do spec: `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`. `metadata` obrigatório: `author`, `version`, `category`, `tags`, `reviewed`. `license: CC-BY-4.0` | Compatível com todos os agentes; chaves só do Claude Code são rejeitadas | Permitir chaves extras por agente, se um agente exigir algo fora do spec | reversible |
| Nome da skill | Prefixo `mass-`, igual à pasta, kebab-case | Evita colisão em `.claude/skills/` com outros catálogos | Sem prefixo, se o namespace vier do plugin em todos os agentes | costly |
| Description | `[What it does]. Use when "a", "b" or "c". Do NOT use for X (use mass-y).` até 1024 chars, validado por regex | Fórmula do tech-leads-club; dispara melhor e evita sobreposição | Livre, se as evals de trigger mostrarem que a fórmula não ajuda | reversible |
| Validador | Regras: spec de frontmatter; sem binários; padrões de segredo; shell com `curl \| sh`, `base64 -d \| sh`, `eval $(...)`, envio de env por rede; frase de prompt injection; scripts com shebang e bit executável; `SKILL.md` acima de 3000 tokens avisa, acima de 6000 falha | Cobre as quatro ameaças do relatório Snyk sem depender de serviço externo | `skills-ref` da agentskills.io, se deixar de ser "demo only" | reversible |
| Registry | `skills-registry.json` na raiz: `{version, generatedAt, repo, skills[{name, path, category, tags, version, reviewed, author, files[{path, sha256, bytes}], contentHash, tokens}]}`; CI falha se desatualizado | Fonte de verdade para CLI e site; hash por arquivo permite verificar download parcial | Registry por categoria em vários arquivos, se passar de ~200 skills | reversible |
| Marketplace Claude Code | `.claude-plugin/marketplace.json` com `name: "mass-solutions"`, um plugin `mass-solutions-skills` com `source: "./"` e `skills: ["./skills/"]` | Um comando instala o catálogo inteiro; `claude plugin validate .` em CI | Um plugin por categoria, se usuários quiserem instalar subconjuntos | reversible |
| CLI | `mass-skills` com `commander`, saída texto, sem TUI; comandos `list`, `search`, `install <skills...> -a <agents...> [--global] [--force]`, `update [--check]`, `remove`, `doctor`; baixa `skills-registry.json` e arquivos de `raw.githubusercontent.com` no ref pinado (`--ref`, padrão `main`) | O valor do CLI é verificação e lockfile; TUI não acrescenta isso | Ink, se navegação interativa virar pedido recorrente | reversible |
| Lockfile | `mass-skills.lock.json` no projeto (ou `~/.config/mass-skills/lock.json` com `--global`): `{version, skills:{[name]:{version, contentHash, ref, agents[], installedAt}}}`; escrita atômica via `.tmp` + rename | Detecta edição local e permite `doctor` | Um lockfile por agente, se agentes divergirem de conteúdo | reversible |
| Edição local no update | Hash divergente → avisa e pula; `--force` sobrescreve e registra | Decisão do usuário; nada é perdido por acidente | Prompt interativo, se o CLI ganhar TUI | reversible |
| Deprecadas | `skills/_deprecated.json`: `{[oldName]:{since, replacedBy[], reason}}`; `install` recusa e aponta; `update`/`doctor` avisam; nunca remove | Decisão do usuário | Instalar a substituta automaticamente, nunca sem consentimento | reversible |
| Agentes no v1 | `claude-code`, `cursor`, `codex`, `copilot`, `opencode`, `windsurf`, `gemini-cli`, `cline`; `-a auto` detecta pela presença das pastas | Cobre os alvos do `npx skills` mais usados; adapter é só path de destino | Menos agentes, se manter os paths custar | reversible |
| Site | Astro estático, `i18n: {defaultLocale: "en", locales: ["en","pt-br"], routing: {prefixDefaultLocale: false}}`, `site: "https://maiconsouza89.github.io"`, `base: "/mass-solutions-skills/"`, deploy com `withastro/action` + `actions/deploy-pages` | Decisão do usuário; i18n por rota nativo, zero JS salvo busca | Next.js export estático, se o site ganhar partes dinâmicas | reversible |
| Idioma | Skills em inglês; site e README em EN e PT; chrome do site traduzido, corpo da skill em inglês nas duas rotas | Decisão do usuário; skills em inglês disparam melhor | `metadata.description-pt-br` para traduzir a descrição no site PT, se houver demanda brasileira | reversible |
| Licença | `LICENSE` MIT na raiz para o código; `skills/LICENSE` CC-BY-4.0 e `license: CC-BY-4.0` em cada frontmatter | Decisão do usuário | MIT em tudo, se atribuição atrapalhar o reuso | reversible |
| Contribuição | Issue-first; PR de fora só após aval em issue; membros abrem PR direto; conventional commits | Lição documentada do repo de referência | PRs abertos, se o volume de contribuição real ficar baixo e a revisão sobrar | reversible |
| Branch `main` | Protegida: PR obrigatório, checks `ci` obrigatórios, sem force-push; CODEOWNERS `* @maiconsouza89`, `/skills/ @maiconsouza89`; aprovação obrigatória desligada enquanto houver um mantenedor só | Um mantenedor não pode aprovar o próprio PR; checks substituem | Aprovação obrigatória ao entrar o segundo mantenedor | reversible |
| Scan externo | Snyk Agent Scan via `uvx snyk-agent-scan@latest skills --ci` em push para `main` e PRs do mesmo repo; cache por `contentHash`; `security-scan-allowlist.yaml` com `expiresAt` obrigatório | Segundo par de olhos além do validador; forks não têm segredo | Merge queue com check obrigatório, se PRs de fork virarem rotina | reversible |
| Revisão periódica | Workflow semanal abre ou atualiza issue "Stale skills" listando `metadata.reviewed` > 90 dias | Garante que skill sem dono ativo apareça | 180 dias, se o catálogo ficar estável | reversible |
| Versionamento | Skills: semver em `metadata.version` (patch texto, minor passo/reference, major escopo de trigger). Pacotes: Changesets, tag `v*` gera GitHub Release | Monorepo pnpm; skill e pacote têm ciclos diferentes | release-please, se Changesets pesar para um mantenedor | reversible |

## Needs a spike

1. O layout escolhido é encontrado pelos dois instaladores externos? - Rodar `npx skills add maiconsouza89/mass-solutions-skills --list` e `/plugin marketplace add` + `/plugin install` com as 5 skills. Se algum não listar as 5, ajustar `marketplace.json` (`skills` path) ou mover o catálogo; se ambos listarem, o bloco fecha. - Para quando os dois comandos listam as 5 skills, ou após 2 horas, quando vira decisão de mover o catálogo.

## Needs design

1. Site: página inicial (catálogo com 5 skills, busca, filtro por categoria, troca de idioma), página de skill (descrição, "use when" e "do not use", corpo renderizado, arquivos instalados, painel de instalação com três caminhos e o aviso de que só o CLI verifica hash, link do fonte), página de instalação e agentes. Estados: busca sem resultado, skill deprecada (banner com substituta), skill sem `references/`. Sem design do rascunho: o `DESIGN.md` de lá (Linear-like) foi descartado com o resto.

## Open

1. Quais são as 5 skills-exemplo - padrão: `mass-skill-authoring` (references/, meta), `mass-commit-message` (scripts/ com shebang), `mass-pr-description` (assets/ template), `mass-code-review` (`metadata.requires` + `allowed-tools`), `mass-security-checklist` (mínima, sem pastas). Cada uma abaixo de 80 linhas.
2. Node - padrão: 22 LTS em `.nvmrc` e `engines`.
3. Nome do lockfile e diretório global - padrão: `mass-skills.lock.json` e `~/.config/mass-skills/`.
4. Estimativa de tokens - padrão: `chars / 4`, sem tokenizer.
5. Busca no site - padrão: índice JSON gerado no build e busca no cliente, sem serviço externo.
6. `AGENTS.md` e `CLAUDE.md` do repo novo - padrão: um só `AGENTS.md` com as regras do catálogo, `CLAUDE.md` apontando para ele e mantendo a regra de idioma.

## Sources

- https://github.com/tech-leads-club/agent-skills - `SECURITY.md`, `CONTRIBUTING.md`, `packages/skills-catalog/project.json` - padrões de segurança, issue-first, fórmula de description, escopo do que não copiamos.
- https://github.com/maiconsouza89/mass-agents-skills - rascunho de hoje; `README.md`, `SECURITY.md`, `CONTRIBUTING.md`, `package.json`, `site/render.ts`, `.github/workflows/ci.yml` - o que já foi tentado e por que foi descartado.
- https://agentskills.io/specification - contrato de frontmatter e limites que o validador aplica.
- https://github.com/vercel-labs/skills - README - regras de descoberta (`skills/`, 3 níveis, `marketplace.json`, `--full-depth`), ausência de lockfile e hash.
- https://code.claude.com/docs/en/plugin-marketplaces - estrutura de `marketplace.json`, `skills` path, `claude plugin validate`.
- https://github.com/snyk/agent-scan - `uvx snyk-agent-scan@latest`, `SNYK_TOKEN`, `--ci`.
- Astro docs via Context7 (`/withastro/docs`) - `i18n.routing.prefixDefaultLocale`, `glob()` loader com `base`, deploy em GitHub Pages com `withastro/action`.
- Respostas de @maiconsouza89 nesta sessão, 2026-09-14 - recomeçar do zero; privado = escrita; comunidade e vários agentes; infra completa + 5 skills curtas; issue-first; escopo com CLI e Snyk; EN/PT no site, skills em inglês; MIT + CC-BY-4.0; `mass-solutions-skills` na conta pessoal; monorepo; Astro; update não sobrescreve; deprecada recusa e aponta.
