# Project state

## Decisions

| ID | Decision | Rationale | Status | Date |
| --- | --- | --- | --- | --- |
| AD-001 | O catálogo vive em `skills/<name>/SKILL.md` na raiz do repo; nada além de skills, `_categories.json`, `_deprecated.json` e `LICENSE` entra em `skills/` | único layout que `npx skills`, o marketplace do Claude Code e humanos encontram sem flags | active | 2026-09-14 |
| AD-002 | Frontmatter usa só as chaves do spec Agent Skills; `metadata` é string→string e carrega `author`, `version`, `category`, `tags`, `reviewed`; `name` = pasta com prefixo `mass-` | compatibilidade com todo agente que aplica o spec; chaves de um agente só são rejeitadas por outro | active | 2026-09-14 |
| AD-003 | `contentHash` de uma skill = sha256 da concatenação, em ordem de bytes de `path`, de `"<path>\n<sha256>\n"` sobre todo arquivo regular exceto `evals/**` | contrato entre registry, CLI e lockfile; mudar invalida todo lockfile instalado | active | 2026-09-14 |
| AD-004 | `skills-registry.json` (`version: 1`) é a fonte de verdade para CLI e site; é gerado, commitado e checado em CI | CLI instalado lê o registry de qualquer ref; site não reimplementa parse | active | 2026-09-14 |
| AD-005 | Lockfile `mass-skills.lock.json` (`version: 1`) chaveado por nome de skill, com `contentHash`; edição local nunca é sobrescrita sem `--force` | nada do usuário se perde por acidente | active | 2026-09-14 |
| AD-006 | Skill deprecada sai da pasta e entra em `skills/_deprecated.json`; `install` recusa e aponta substituta; nada é removido do usuário automaticamente | instaladores externos não leem nosso registry, então a pasta não pode continuar existindo | active | 2026-09-14 |
| AD-007 | Código MIT (`LICENSE`), conteúdo das skills CC-BY-4.0 (`skills/LICENSE` + `license:` no frontmatter) | atribuição é a razão de publicar sob a marca | active | 2026-09-14 |
| AD-008 | Contribuição externa é issue-first; PR sem issue vinculada é fechado com redirecionamento | lição documentada do tech-leads-club/agent-skills | active | 2026-09-14 |
| AD-009 | Skills de tooling do próprio repo (`.claude/skills/`, `skills-lock.json`) não são versionadas | `npx skills add <repo> --list` varre `.claude/skills/` e listaria tooling junto com o catálogo | active | 2026-09-14 |

## Handoff

**Feature**: mass-solutions-skills
**Where**: batch B1 (S1-S4, C1-C42 + C81) fechado e verde; B2 (S5, CLI) e B3 (S6-S8) pendentes
**In progress**: nada
**Next step**: despachar o builder B2 com `checks.md` e o diff `c18c7f5..HEAD`; B2 cria `packages/cli/src` com `run(argv, {cwd, env, stdout, stderr})`, lê `MASS_SKILLS_BASE_URL`, importa `@mass-solutions/skills-core` (alias do vitest aponta para o src)
**Blockers**: open questions 1-4 (go-live) não bloqueiam o build local
**Uncommitted**: nada
**Branch**: main
