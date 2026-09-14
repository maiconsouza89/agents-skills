# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Linguagem

- **Documentos e respostas ao usuário**: escrever em português (pt-BR)
- **Processamento e pensamento do modelo**: manter em inglês (raciocínio interno, análise, planejamento)
- **Integração**: toda comunicação com o usuário e documentação deve ser em português
- **Código e comentários**: seguir as convenções do projeto (geralmente em inglês para compatibilidade)

## Design System

A referência completa do design system está documentada em [@DESIGN.md](./DESIGN.md). Consulte este arquivo para:
- Paleta de cores e tokens
- Tipografia e hierarquia
- Componentes e suas variantes
- Layout, espaçamento e breakpoints
- Princípios de design e boas práticas

## Instalação de Novas Funcionalidades

Antes de instalar ou integrar novas dependências, funcionalidades ou tecnologias:
- **Pesquisar versão atual**: usar Context7 (`mcp__context7__query-docs`) para documentação oficial
- **Verificar boas práticas**: consultar padrões de mercado e recomendações atuais
- **Usar web search** se Context7 não tiver informação recente
- **Documentar decisões**: registrar versões e rationale no projeto

## Skills Disponíveis

Este projeto possui skills customizadas em `/skills`. Consulte sempre:
- Verificar skills relevantes antes de implementar soluções manuais
- Usar `Skill` tool para invocar funcionalidades do projeto


