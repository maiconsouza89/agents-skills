# Contribuindo

Obrigado pelo interesse. Este catálogo é pequeno de propósito: cada skill tem dono, versão e data de revisão, e tudo passa pelo validador antes de entrar.

## Issue primeiro

- **Contribuição externa**: abra uma issue com o template *Skill proposal* (nova skill) ou *Skill bug* (defeito). Um pull request só é aberto depois que um mantenedor concorda na issue. PR sem issue vinculada e aprovada é fechado com um redirecionamento para o template, não é uma rejeição da ideia.
- **Membros do repositório** abrem PR direto, ainda assim vinculando a issue quando ela existe.

Esta política vem de uma lição documentada por outros catálogos: PRs automatizados em volume consomem a revisão antes que ela aconteça.

## Fluxo

1. `pnpm install`
2. `pnpm new-skill mass-<slug>` cria `skills/mass-<slug>/SKILL.md` e `README.md` já no contrato.
3. Escreva a skill em inglês. `mass-skill-authoring` (em `skills/`) descreve o contrato; `skills/mass-skill-authoring/references/skill-contract.md` lista cada regra do validador.
4. `pnpm check` roda o validador, confere o `skills-registry.json` e os testes. Um achado sai como `<regra> <arquivo>:<linha> <mensagem>`; corrija todos.
5. `pnpm registry` regenera `skills-registry.json` quando qualquer arquivo de skill muda; o arquivo é commitado.
6. Abra o PR com o template preenchido e a issue vinculada.

## Revisão e versão

- `metadata.reviewed` recebe a data de hoje (`YYYY-MM-DD`) em toda mudança de conteúdo da skill. Uma skill sem revisão há mais de 90 dias aparece na issue semanal *Stale skills*.
- `metadata.version` segue semver: patch para texto, minor para um passo ou referência nova, major quando o escopo de disparo (`Use when` / `Do NOT use for`) muda.
- Skill retirada sai da pasta e entra em `skills/_deprecated.json` com `since`, `replacedBy` e `reason`; o CLI recusa instalar e aponta a substituta, e nunca remove nada de quem já tem.

## Commits

[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/): `<type>(<scope>): <description>`, imperativo, minúsculas, sem ponto final. Tipos: `feat`, `fix`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`. Exemplos: `feat(skills): add mass-release-checklist`, `docs(skills): clarify mass-code-review report format`.

## Segurança

Nunca inclua segredos, binários, downloads canalizados para um shell ou instruções que peçam ao agente para esconder algo do usuário. O validador e o Snyk Agent Scan bloqueiam o PR; a política completa está em [SECURITY.md](SECURITY.md).
