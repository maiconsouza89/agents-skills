# Mass Solutions Skills

[English](README.md)

## O que é

O catálogo público de [Agent Skills](https://agentskills.io) escritas e mantidas pela Mass Solutions. Cada skill vive em `skills/<name>/` com um `SKILL.md` que segue a especificação Agent Skills, tem autor declarado, versão semver e data de revisão, e é validada em CI antes de ser publicada. O catálogo pode ser navegado em https://maiconsouza89.github.io/agents-skills/pt-br/ (inglês e português).

A escrita neste repositório é controlada (`main` protegida, code owners, issue antes de pull request); ler e instalar é aberto a qualquer pessoa.

## Instalação

Três caminhos, do mais ao menos verificado:

1. **`mass-skills` (verifica integridade, mantém lockfile)**

   ```bash
   npx @mass-solutions/skills-cli install mass-code-review -a claude-code
   ```

   Baixa os arquivos no ref fixado, confere o `sha256` de cada arquivo e o `contentHash` da skill contra `skills-registry.json`, e registra o que instalou em `mass-skills.lock.json`. `mass-skills update` nunca sobrescreve uma skill editada localmente sem `--force`.

2. **`npx skills add` (70+ agentes)**

   ```bash
   npx skills add maiconsouza89/agents-skills --skill mass-code-review
   ```

3. **Marketplace de plugins do Claude Code**

   ```
   /plugin marketplace add maiconsouza89/agents-skills
   /plugin install mass-solutions-skills@mass-solutions
   ```

Só o CLI `mass-skills` verifica hash. Os outros dois instalam o que o repositório servir naquele momento, sem verificação de integridade.

## Skills

| Skill | Categoria | O que faz |
| --- | --- | --- |
| `mass-skill-authoring` | Autoria de skills | Escreve ou revisa uma skill para passar no validador |
| `mass-commit-message` | Fluxo Git | Mensagem em Conventional Commits a partir do diff em stage |
| `mass-pr-description` | Fluxo Git | Preenche o template de pull request a partir da branch |
| `mass-code-review` | Qualidade de código | Revisa um PR ou diff procurando bugs, testes ausentes e mudanças inseguras |
| `mass-security-checklist` | Segurança | Audita uma skill ou script contra quatro classes de ameaça |

O corpo das skills é em inglês; `skills-registry.json` é o índice legível por máquina: arquivos, hashes, versões e deprecações.

## Contribuir

Issue primeiro, pull request depois. Veja [CONTRIBUTING.md](CONTRIBUTING.md).

## Segurança

Relate vulnerabilidades por security advisory privado, nunca por issue pública. Veja [SECURITY.md](SECURITY.md).

## Licença

Código (`packages/`, `apps/`, `tools/`) é MIT ([LICENSE](LICENSE)). Conteúdo das skills (`skills/`) é CC-BY-4.0 ([skills/LICENSE](skills/LICENSE)).
