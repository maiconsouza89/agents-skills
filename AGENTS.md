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
| pnpm | 11.23.0 (`packageManager`) | workspaces sem orquestrador; `allowBuilds` em `pnpm-workspace.yaml` libera só o `esbuild` |
| typescript | ^5.9.3 | linha 5.x estável; a 7.x (porta nativa) fica para quando o toolchain a acompanhar |
| tsx | ^4.23.13 | roda os bins e tools em TypeScript sem passo de build |
| vitest | ^5.0.0 | runner único para raiz, pacotes e site; seletor `-t` nas provas |
| yaml | ^2.9.1 | parser de frontmatter; o schema padrão mantém datas como string, que é o que o contrato exige |
| @types/node | ^24.13.4 | acompanha o Node 24 |
