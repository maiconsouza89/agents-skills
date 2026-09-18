---
status: accepted
date: YYYY-MM-DD
title: "Registrar decisões de arquitetura como ADRs"
description: "Por que decisões caras de reverter viram arquivo nesta pasta em vez de ficarem no histórico de conversa e nos pull requests."
supersedes:
superseded-by:
---

# 0001. Registrar decisões de arquitetura como ADRs

## Contexto e problema

Toda escolha de tecnologia ou de desenho exclui alternativas. Conversa de sessão não persiste
e ninguém lê `git log` para recuperar um motivo, então seis meses depois ninguém sabe por que
X foi escolhido e a alternativa já descartada volta à mesa. Faltava um lugar onde a decisão e
o que foi recusado ficassem juntos, versionados com o código.

## Opções consideradas

- **ADRs nesta pasta** — um arquivo Markdown numerado por decisão, formato MADR minimal, versionado com o código.
- **Uma página só de decisões** — arquivo único que cresce; sem numeração, sem status, sem como supersedir uma entrada.
- **Nada formal** — decisões ficam em issues, pull requests e conversa; recuperar o motivo depende de quem estava lá.

## Decisão

Escolhidos os **ADRs nesta pasta**, porque numeração estável dá referência cruzada, o campo de
status dá o ciclo de vida (incluindo supersede bidirecional) e um arquivo por decisão mantém
cada registro dentro de um orçamento de leitura.

## Consequências

- Bom: para saber por que algo é como é, basta `grep` nesta pasta; o motivo e as opções recusadas estão no mesmo arquivo.
- Bom: `adr.py audit` valida numeração, front-matter e cadeias de supersede, então inconsistência aparece em comando e não em revisão.
- Ruim: toda decisão cara de reverter passa a custar um arquivo a mais; registrar decisão trivial infla o acervo até ninguém mais ler.
- Ruim: ADR `accepted` tem texto congelado; corrigir o conteúdo exige um ADR novo que o supersede.

## Referências

Consultado em YYYY-MM-DD.

- [MADR — Markdown Any Decision Records](https://adr.github.io/madr/) — o formato e o conjunto mínimo de seções adotados aqui.
