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
**Where**: build completo (86 checks fechados, `pnpm check` verde com 143 testes). Verificação independente: 3 rodadas (`5c157b1`, `aa0648c`, `f9337d3`); a rodada 3 fechou em FAIL por um único mutante (Fh, causa `missing frontmatter` do C86), corrigido em `911a7ee` sem nova rodada. O usuário aceitou encerrar assim em 2026-09-15; `validate_verification.py` continua em 1 (veredito FAIL na rodada 3) por decisão dele, não por lacuna aberta.
**In progress**: nada
**Next step**: go-live, cada item com go-ahead explícito: (1) push de `feature/implement-v1` e PR para `main` em `maiconsouza89/agents-skills`; (2) branch protection em `main` via `gh api` (PR obrigatório, check `ci`, sem force-push) e Pages com source "GitHub Actions"; (3) secret `SNYK_TOKEN`; (4) tag `v0.1.0`; (5) arquivar `maiconsouza89/mass-agents-skills` com README apontando o sucessor
**Blockers**: nenhum técnico
**Uncommitted**: nada
**Branch**: feature/implement-v1
