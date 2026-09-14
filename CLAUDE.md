# CLAUDE.md

Este é o repositório `mass-solutions-skills`: o catálogo público de Agent Skills da Mass Solutions, com validador, registry, CLI `mass-skills`, site bilíngue e governança de escrita. As regras de trabalho estão em [AGENTS.md](AGENTS.md); leia-o antes de mudar qualquer skill ou pacote.

## Linguagem

- **Documentos e respostas ao usuário**: escrever em português (pt-BR)
- **Processamento e pensamento do modelo**: manter em inglês (raciocínio interno, análise, planejamento)
- **Código, skills, mensagens do CLI e comentários**: em inglês, para compatibilidade com todos os agentes

## Design System

A referência do design system do site está em [@DESIGN.md](./DESIGN.md): paleta, tipografia monoespaçada, componentes, espaçamento e princípios. O site em `apps/site` segue esses tokens.

## Instalação de Novas Funcionalidades

Antes de instalar ou integrar novas dependências, funcionalidades ou tecnologias:
- **Pesquisar versão atual**: usar Context7 (`mcp__context7__query-docs`) para documentação oficial
- **Verificar boas práticas**: consultar padrões de mercado e recomendações atuais
- **Usar web search** se Context7 não tiver informação recente
- **Documentar decisões**: registrar versões e rationale na seção `## Dependências` do [AGENTS.md](AGENTS.md)

## Skills Disponíveis

Este projeto possui skills customizadas em `/skills`. Consulte sempre:
- Verificar skills relevantes antes de implementar soluções manuais
- Usar `Skill` tool para invocar funcionalidades do projeto

As skills de tooling do próprio repo (`.claude/skills/`) não são versionadas; instale-as localmente com `npx skills add`.
