# Architecture Decision Records

Cada decisão de arquitetura cara de reverter vira um arquivo aqui. Um ADR responde uma pergunta
para quem chegar daqui a seis meses: **por que está assim, e o que mais foi tentado?**

Formato: [MADR](https://adr.github.io/madr/) minimal. Ponto de partida: `template.md`.

| Arquivo | O que é |
|---|---|
| `NNNN-*.md` | Os registros. Um arquivo por decisão. |
| `template.md` | Ponto de partida de um registro novo. A auditoria deriva dele as seções e chaves obrigatórias. |
| `index.md` | Tabela de todos os registros. **Gerado**, nunca editado à mão. |
| `README.md` | Este arquivo. |

## Quando escrever

Escreva quando a decisão for **cara de reverter** ou quando **alguém vai questioná-la em seis
meses**: escolha de framework, banco ou hospedagem, o formato de um contrato entre componentes,
estratégia de auth/persistência/erro, ou a escolha deliberada da opção não óbvia.

Não escreva para decisão trivialmente reversível, para "como fazer X" (isso é README ou guia
de contribuição) nem para escolha sem alternativa real. Acervo inflado deixa de ser lido, o
que custa mais que uma entrada faltando.

## Nome e numeração

`NNNN-titulo-com-hifens.md`: quatro dígitos, sequencial, **nunca reutilizado**, mesmo que um
ADR seja apagado. Buraco não faz mal; número repetido quebra toda referência cruzada.

O título é a decisão em voz ativa, não o tema. `ls` tem que ler como lista de decisões:

- `0007-usar-zod-para-validar-env.md` ✓
- `0007-validacao-de-env.md` ✗

## Front-matter

```yaml
---
status: accepted
date: 2026-09-17
title: "Usar Zod para validar env"
description: "Por que a validação de env passou a usar Zod em vez de checagem manual."
supersedes: "0003"
superseded-by:
---
```

- `status` — um dos cinco abaixo, minúsculo.
- `date` — ISO; o dia em que o registro chegou ao status **atual**. Atualiza a cada transição.
- `title` — só a decisão, sem o número (o número vive no nome do arquivo e no `# NNNN.`).
- `description` — uma frase, "por que X em vez de Y". É o que uma pessoa ou um agente lê ao escanear o acervo sem abrir cada arquivo.
- `supersedes` / `superseded-by` — número do outro ADR como string de 4 dígitos, vazio quando não se aplica. As duas chaves ficam no arquivo mesmo vazias, para a cadeia continuar greppável.

Chaves, valores de `status` e nomes de arquivo ficam sempre em inglês/ASCII; a prosa fica no idioma do acervo.

## Ciclo de status

| Status | Significado | Vai para |
|---|---|---|
| `proposed` | Escrito, em discussão. Único estado livremente editável. | `accepted`, `rejected` |
| `accepted` | Vale hoje. Texto congelado. | `superseded`, `deprecated` |
| `rejected` | Discutido e recusado. Fica no repo; o valor é o motivo registrado. | — |
| `superseded` | Trocado por uma decisão mais nova. Exige `superseded-by`. | — |
| `deprecated` | Não vale mais e nada substituiu (o problema deixou de existir). | — |

Qualquer outra transição é erro. Um ADR `rejected` que volta à mesa é uma decisão **nova**, que
o supersede, não uma edição.

## Imutabilidade

Depois de `accepted`, só o front-matter muda. Conteúdo errado ou desatualizado → ADR novo que
o supersede. O ADR registra o que foi decidido **e o que se sabia naquele momento**; editar
retroativamente deixa o histórico do git como única testemunha do raciocínio original.
Corrigir typo ou link quebrado, tudo bem; mudar o raciocínio ou o resultado, não.

## Supersede é bidirecional

- ADR novo: `supersedes: "0003"`, e o contexto abre dizendo o que mudou desde o 0003.
- ADR antigo: `status: superseded`, `superseded-by: "0011"`, `date` atualizada.

Cadeia de um lado só é beco sem saída: alguém cai no 0003, acredita, e nunca encontra o 0011.

## Referências

Seção opcional, no fim do arquivo, presente sempre que a decisão se apoia em fato externo
(versão de framework, issue aberta, estado de manutenção de uma biblioteca, benchmark).
Comece pela data de consulta e diga, por bullet, o que a fonte sustenta nesta decisão.
Decisão sem fato externo não tem o que citar: apague a seção.

## Tamanho

| Seção | Orçamento |
|---|---|
| Contexto e problema | até 5 frases |
| Opções consideradas | 2 a 4 opções, uma linha cada |
| Decisão | 1 a 3 frases |
| Consequências | 2 a 5 bullets, uma linha cada |
| Referências | só o que foi de fato usado |

Estourar o orçamento quase sempre significa duas decisões embaralhadas no mesmo arquivo. Separe.
Consequência tem que ser **falsificável**: algo que alguém possa descobrir depois que é falso.
"Código mais manutenível" é desejo, não consequência.

## Manutenção

```bash
ADR=<skill-dir>/scripts/adr.py   # the folder holding this skill's SKILL.md
python3 $ADR audit  docs/adr                     # nomes, front-matter, numeração, cadeias, índice
python3 $ADR index  docs/adr                     # regenera o index.md após qualquer mudança
python3 $ADR new    docs/adr "Usar X em vez de Y" --status accepted [--supersedes 0003]
python3 $ADR status docs/adr 0003 deprecated
```
