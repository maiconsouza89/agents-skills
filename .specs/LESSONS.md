# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Plan/Checks)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Um teste table-driven que itera a tabela do próprio módulo sob teste não prova a tabela: quando o plano fixa valores literais (paths, ids, URLs), escreva-os literalmente no teste ou num fixture separado e compare o módulo contra eles.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `packages/cli` · harmful: 0
- features: mass-solutions-skills
- evidence: packages/cli/src/agents.ts:16 (packages/cli)
- last seen: 2026-09-15T03:54:31Z

### L-002 - Quando uma linha de Coverage declara um exit code por comando, cite um teste que dispare esse código naquele comando específico; um erro de uso genérico de outro comando não prova o membro.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `packages/cli` · harmful: 0
- features: mass-solutions-skills
- evidence: C59 (packages/cli)
- last seen: 2026-09-15T03:54:31Z

### L-003 - Ao implementar mais ramos do que o AC enumera (estados extra num classify, guard de pasta existente), acrescente um caso asserido por ramo novo ou remova o ramo; a linha de Test policy conta linhas da tabela de decisão do código, não do AC.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `packages/cli` · harmful: 0
- features: mass-solutions-skills
- evidence: packages/cli/src/commands/update.ts:30 (packages/cli)
- last seen: 2026-09-15T03:54:31Z

### L-004 - Se a Surface lista o mesmo status para duas URLs, exercite o status em cada URL (um 404 de arquivo além do 404 do registry); destruir o socket prova falha de rede, não o mapeamento de status.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `packages/cli` · harmful: 0
- features: mass-solutions-skills
- evidence: packages/cli/test/helpers.ts:66 (packages/cli)
- last seen: 2026-09-15T03:54:31Z

### L-005 - Ao fechar um batch, recompute o tamanho de cada conjunto de Coverage a partir do código e atualize a linha e os check ids: um membro adicionado no meio do build precisa de check, não só de teste.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `.specs` · harmful: 0
- features: mass-solutions-skills
- evidence: checks.md Coverage validator rule ids (16) (.specs)
- last seen: 2026-09-15T03:54:32Z

### L-006 - Quando um check enumera várias entradas que produzem o mesmo resultado, a prova precisa de um caso asserido por entrada nomeada (it.each), não de um único caso pelo id da regra.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `packages/core` · harmful: 0
- features: mass-solutions-skills
- evidence: C86 - packages/core/test/rules.test.ts:17-19; packages/core/src/frontmatter.ts:27,34 (packages/core)
- last seen: 2026-09-15T04:09:10Z

### L-007 - Ao reforçar um check para exigir contagem exata e mensagem por caso, leve os casos pré-existentes para a mesma asserção: um caso que só assere a presença do id da regra deixa um mutante de rótulo sobreviver.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `packages/core` · harmful: 0
- features: mass-solutions-skills
- evidence: Fh - packages/core/src/frontmatter.ts:25; C86 - packages/core/test/rules.test.ts:19 (packages/core)
- last seen: 2026-09-15T04:20:42Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
