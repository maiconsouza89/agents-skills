<h1 align="center">Mass Solutions Skills</h1>

<p align="center">
  <strong>Um catálogo pequeno e verificado de Agent Skills para agentes de código</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mass-solutions/skills-cli"><img src="https://img.shields.io/npm/v/@mass-solutions/skills-cli?style=flat-square&color=5e6ad2&label=mass-skills" alt="versão no npm" /></a>
  <a href="https://www.npmjs.com/package/@mass-solutions/skills-cli"><img src="https://img.shields.io/npm/dm/@mass-solutions/skills-cli?style=flat-square&color=5e6ad2" alt="downloads mensais" /></a>
  <a href="https://github.com/maiconsouza89/agents-skills/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/maiconsouza89/agents-skills/ci.yml?branch=main&style=flat-square&label=ci" alt="status da CI" /></a>
  <a href="https://github.com/maiconsouza89/agents-skills/actions/workflows/security-scan.yml"><img src="https://img.shields.io/github/actions/workflow/status/maiconsouza89/agents-skills/security-scan.yml?branch=main&style=flat-square&label=security%20scan" alt="status do scan de segurança" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/maiconsouza89/agents-skills?style=flat-square" alt="licença" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D22.12-brightgreen?style=flat-square&logo=node.js" alt="versão do node" />
  <img src="https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square&logo=typescript" alt="typescript" />
  <img src="https://img.shields.io/badge/skills-CC--BY--4.0-lightgrey?style=flat-square" alt="licença das skills" />
  <a href="https://github.com/maiconsouza89/agents-skills/commits/main"><img src="https://img.shields.io/github/last-commit/maiconsouza89/agents-skills?style=flat-square" alt="último commit" /></a>
</p>

<p align="center">
  Toda skill aqui tem autor declarado, versão semver e data de revisão. É validada em CI,
  verificada contra segredos, shell perigoso e prompt injection, e instalada com <b>conferência de hash por arquivo</b>
  e <b>lockfile</b>. Pequeno de propósito: nada entra no catálogo sem issue, revisão e validador.
</p>

<p align="center">
  <a href="https://maiconsouza89.github.io/agents-skills/pt-br/"><strong>Navegar pelo catálogo</strong></a>
  &nbsp;·&nbsp;
  <a href="README.md">English</a>
</p>

## Sumário

- [O que são skills?](#o-que-são-skills)
- [Segurança e confiança](#segurança-e-confiança)
- [Agentes suportados](#agentes-suportados)
- [Skills do catálogo](#skills-do-catálogo)
- [Início rápido](#início-rápido)
- [Referência do CLI](#referência-do-cli)
- [Como funciona](#como-funciona)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Contribuir](#contribuir)
- [Relatar uma vulnerabilidade](#relatar-uma-vulnerabilidade)
- [Licença e atribuição](#licença-e-atribuição)

## O que são skills?

Skills são instruções empacotadas que ampliam o que um agente de código sabe fazer. Pense nelas como plugins do seu assistente: um `SKILL.md` ensina ao agente um fluxo, um contrato ou um checklist, e o agente só o carrega quando a tarefa bate com a descrição da skill.

Este catálogo segue a especificação aberta [Agent Skills](https://agentskills.io), então a mesma pasta funciona no Claude Code, Cursor, Codex, Copilot e em qualquer outro agente que leia `SKILL.md`.

```
skills/
  mass-<name>/
    SKILL.md          ← frontmatter (nome, descrição, versão, data de revisão) + instruções curtas
    references/       ← material longo que o agente lê sob demanda
    evals/            ← testes de disparo usados pelos mantenedores
```

Todo nome de skill começa com `mass-`, e toda descrição segue a mesma fórmula para o agente saber exatamente quando usar e quando não usar: *o que faz, use quando "a", "b" ou "c", não use para X (use outra skill)*. O corpo das skills é em inglês, para compatibilidade com todos os agentes.

## Segurança e confiança

Uma skill instalada em muitos agentes é um alvo de cadeia de suprimentos. Este repositório trata assim:

| Camada | O que confere | Onde |
| --- | --- | --- |
| **Validador** (toda PR e push, sem serviço externo) | Contrato do frontmatter, nenhum binário, padrões de segredo (chaves AWS, tokens do GitHub, chaves privadas), shell perigoso (`curl \| sh`, payload decodificado, `eval`), frases de prompt injection, bit executável em scripts, limite de tamanho do `SKILL.md` | `pnpm validate` |
| **Snyk Agent Scan** | Scan estático independente de cada skill na `main` e em PRs internas | `security-scan.yml` |
| **Integridade na instalação** | `sha256` por arquivo e `contentHash` por skill, registrados em `skills-registry.json`; o CLI recusa um download com hash diferente e não escreve nada | `mass-skills install` |
| **Lockfile** | O que foi instalado, de qual ref, em quais agentes; `update` nunca sobrescreve uma skill que você editou sem `--force` | `mass-skills.lock.json` |
| **Allowlist com validade** | Achados aceitos do scanner precisam de motivo e `expiresAt`; entrada vencida derruba a CI | `security-scan-allowlist.yaml` |
| **Governança** | `main` protegida, code owners, issue antes de pull request, relatório semanal de skills sem revisão há 90 dias | `CODEOWNERS`, `stale-skills.yml` |

Só o CLI `mass-skills` confere hash. `npx skills add` e o marketplace do Claude Code instalam o que o repositório servir naquele momento.

→ Modelo de ameaças completo e processo de relato: [SECURITY.md](SECURITY.md)

## Agentes suportados

O `mass-skills` escreve direto no diretório de skills destes agentes. Use `-a auto` para detectá-los pelas pastas presentes no projeto.

| Agente | id em `-a` | Escopo do projeto | Escopo global (`-g`) |
| --- | --- | --- | --- |
| [Claude Code](https://claude.ai/code) | `claude-code` | `.claude/skills/` | `~/.claude/skills/` |
| [Cursor](https://cursor.com) | `cursor` | `.agents/skills/` | `~/.cursor/skills/` |
| [OpenAI Codex](https://openai.com/codex/) | `codex` | `.agents/skills/` | `~/.codex/skills/` |
| [GitHub Copilot](https://github.com/features/copilot) | `github-copilot` | `.agents/skills/` | `~/.copilot/skills/` |
| [OpenCode](https://opencode.ai) | `opencode` | `.agents/skills/` | `~/.config/opencode/skills/` |
| [Windsurf](https://windsurf.com) | `windsurf` | `.windsurf/skills/` | `~/.codeium/windsurf/skills/` |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | `gemini-cli` | `.agents/skills/` | `~/.gemini/skills/` |
| [Cline](https://github.com/cline/cline) | `cline` | `.agents/skills/` | `~/.agents/skills/` |

Qualquer outro agente que suporte a especificação Agent Skills pode usar o caminho [`npx skills add`](#2-npx-skills-add-qualquer-agente-que-leia-skillmd) abaixo. Falta o seu no CLI? [Abra uma issue](https://github.com/maiconsouza89/agents-skills/issues/new/choose).

## Skills do catálogo

| Skill | Categoria | O que faz |
| --- | --- | --- |
| [`mass-skill-authoring`](skills/mass-skill-authoring) | Autoria de skills | Escreve ou revisa uma skill para passar no validador do catálogo na primeira tentativa. Use ao criar uma skill nova ou quando o validador rejeitar a sua. |
| [`mass-commit-message`](skills/mass-commit-message) | Fluxo Git | Escreve uma mensagem em Conventional Commits a partir do diff em stage, com escopo tirado dos diretórios alterados. |
| [`mass-pr-description`](skills/mass-pr-description) | Fluxo Git | Preenche o template de pull request a partir dos commits e do diff da branch. |
| [`mass-code-review`](skills/mass-code-review) | Qualidade de código | Revisa um PR ou diff local procurando bugs, testes ausentes e mudanças inseguras, apontando arquivo e linha. Precisa de `git` e `gh`. |
| [`mass-security-checklist`](skills/mass-security-checklist) | Segurança | Audita uma skill, script ou configuração contra as quatro classes de ameaça que o validador e o Snyk procuram, com passa ou falha por item. |

`skills-registry.json` é o índice legível por máquina: arquivos, hashes, versões, tags e deprecações. O [site](https://maiconsouza89.github.io/agents-skills/pt-br/) mostra os mesmos dados com busca e filtro por categoria, em inglês e português.

## Início rápido

Três caminhos, do mais ao menos verificado.

### 1. `mass-skills` (confere hash, mantém lockfile)

```bash
# instala uma skill nos agentes detectados no projeto atual
npx @mass-solutions/skills-cli install mass-code-review

# instala várias skills em agentes específicos
npx @mass-solutions/skills-cli install mass-commit-message mass-pr-description -a claude-code cursor

# instala para a conta do usuário inteira em vez de um projeto
npx @mass-solutions/skills-cli install mass-code-review -a claude-code -g
```

Se preferir, instale uma vez e use o nome curto:

```bash
npm install -g @mass-solutions/skills-cli
mass-skills list
```

### 2. `npx skills add` (qualquer agente que leia `SKILL.md`)

```bash
npx skills add maiconsouza89/agents-skills --skill mass-code-review
```

Funciona com mais de 70 agentes, sem verificação de hash.

### 3. Marketplace de plugins do Claude Code

```
/plugin marketplace add maiconsouza89/agents-skills
/plugin install mass-solutions-skills@mass-solutions
```

Instala o catálogo inteiro como um plugin.

## Referência do CLI

As mensagens do CLI são em inglês.

```bash
# Navegar pelo catálogo
mass-skills list                          # toda skill: nome, versão, categoria, descrição
mass-skills search review                 # busca por nome, descrição ou tag

# Instalar
mass-skills install mass-code-review                       # -a auto: detecta .claude/, .agents/, .windsurf/
mass-skills install mass-code-review -a claude-code cursor # agentes explícitos
mass-skills install mass-code-review -g                    # diretórios e lockfile do usuário
mass-skills install mass-code-review --ref v0.1.0          # lê o catálogo em outro ref do git

# Manter atualizado
mass-skills update --check                # mostra o estado de cada skill instalada, não muda nada
mass-skills update                        # reinstala skills com versão mais nova no catálogo
mass-skills update --force                # também sobrescreve skills editadas localmente

# Inspecionar e remover
mass-skills doctor                        # ok | missing | modified | deprecated, por skill
mass-skills remove mass-code-review       # apaga de todo agente registrado no lockfile

# Espelhos dos scripts do repositório, para mantenedores
mass-skills validate [dir]                # mesmas regras e códigos de saída de pnpm validate
mass-skills registry --check              # falha quando skills-registry.json está desatualizado

mass-skills --help
```

Códigos de saída: `0` sucesso, `1` falha de execução (hash divergente, skill deprecada, `doctor` achou problema), `2` erro de uso (skill ou agente desconhecido, nenhum agente detectado).

O lockfile é `mass-skills.lock.json` no projeto, ou `~/.config/mass-skills/lock.json` com `-g`. `MASS_SKILLS_BASE_URL` aponta o CLI para um espelho do catálogo.

## Como funciona

1. **Resolver.** O CLI lê `skills-registry.json` no ref pedido (padrão `main`) e resolve todo nome de skill e id de agente antes de tocar em qualquer coisa. Skill deprecada é recusada com um apontamento para a substituta.
2. **Baixar e verificar.** Cada arquivo é baixado num diretório temporário e seu `sha256` comparado com o registry; depois o `contentHash` da skill inteira é conferido. Qualquer divergência aborta sem escrever nada.
3. **Colocar.** As skills verificadas são copiadas para o diretório de skills de cada agente alvo, no escopo do projeto ou global.
4. **Travar.** `mass-skills.lock.json` registra versão, ref, hash e agentes. `update`, `doctor` e `remove` trabalham a partir desse arquivo, então o CLI só mexe no que ele mesmo instalou.

## Estrutura do repositório

```
skills/            o catálogo, uma pasta por skill, mais _categories.json e _deprecated.json
packages/core      @mass-solutions/skills-core: parse do frontmatter, validador, hash, registry
packages/cli       @mass-solutions/skills-cli: o comando mass-skills
apps/site          site em Astro, inglês e português, construído a partir do catálogo
tools/             scripts de manutenção (new-skill, stale, allowlist)
.claude-plugin/    manifesto do marketplace do Claude Code
skills-registry.json   índice gerado, commitado
```

Comandos de manutenção: `pnpm check` (validador, conferência do registry, testes), `pnpm registry` (regenera o índice após qualquer mudança em skill), `pnpm new-skill mass-<slug>` (cria uma skill que já passa no contrato), `pnpm build`.

## Contribuir

Issue primeiro, pull request depois. Abra uma issue *Skill proposal* ou *Skill bug*; um mantenedor concorda na issue antes de o PR ser aberto. As skills são escritas em inglês, passam no `pnpm check`, e sobem `metadata.version` e `metadata.reviewed` a cada mudança de conteúdo.

→ Fluxo completo, regras de versão e convenção de commits: [CONTRIBUTING.md](CONTRIBUTING.md)

## Relatar uma vulnerabilidade

Use o [security advisory privado](https://github.com/maiconsouza89/agents-skills/security/advisories/new) do repositório, nunca uma issue pública. Você recebe resposta em até 7 dias; a correção sai como uma versão nova da skill e, se for o caso, uma entrada de deprecação.

→ [SECURITY.md](SECURITY.md)

## Licença e atribuição

- **Código** (`packages/`, `apps/`, `tools/`): [MIT](LICENSE).
- **Conteúdo das skills** (`skills/`): [Creative Commons Attribution 4.0](skills/LICENSE). Reutilize à vontade, mantendo a atribuição à Mass Solutions.

Se você é autor de algum conteúdo incluído aqui e quer que ele seja atualizado ou removido, [abra uma issue](https://github.com/maiconsouza89/agents-skills/issues/new/choose).

---

<p align="center">
  <sub>Mantido pela Mass Solutions</sub>
</p>
