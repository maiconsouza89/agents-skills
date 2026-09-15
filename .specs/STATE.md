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
| AD-010 | O repositório público é `maiconsouza89/agents-skills`; site em `https://maiconsouza89.github.io/agents-skills/`; nome do plugin do Claude Code continua `mass-solutions-skills@mass-solutions` | decisão do usuário em 2026-09-15; o repo foi criado com esse nome | active | 2026-09-15 |

## Handoff

**Feature**: mass-solutions-skills
**Where**: rodada 1 do Verifier (`5c157b1`) devolveu FAIL com 5 lacunas; B4 corrigiu todas (C83-C86, provas de C45/C58/C59/C68 reforçadas); 86/86 checks marcados
**In progress**: nada
**Next step**: o orquestrador despacha o Verifier para a **rodada 2 - scoped** (diff do B4 + os vereditos não-PASS da rodada 1: F5, cobertura de exits e 404 de arquivo, test policy de `agents.ts`/`update.ts`/`new-skill.ts`, rule ids 17), provas em full no novo HEAD; depois `validate_verification.py mass-solutions-skills`; go-live só com go-ahead explícito
**Blockers**: open questions 1-4 (go-live) não bloqueiam a verificação local
**Uncommitted**: nada
**Branch**: feature/implement-v1
