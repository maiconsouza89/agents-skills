# Política de segurança

## Relatar uma vulnerabilidade

Use o **security advisory privado** do repositório:

https://github.com/maiconsouza89/mass-solutions-skills/security/advisories/new

Nunca abra uma issue pública para uma vulnerabilidade: uma skill instalada em muitos agentes é um alvo de cadeia de suprimentos, e a descrição pública chega antes da correção. Você recebe resposta em até 7 dias; a correção sai como uma versão nova da skill e, se for o caso, uma entrada em `skills/_deprecated.json`.

## O que é verificado

**Validador (`pnpm validate`, em toda PR e push)**, sem serviço externo:

- frontmatter só com as chaves da especificação Agent Skills, `name` igual à pasta, `description` na fórmula, `metadata` completo;
- nenhum arquivo binário;
- padrões de segredo: chaves AWS, tokens do GitHub, chaves privadas, `api_key = "..."`;
- shell perigoso: download canalizado para `sh`/`bash`, payload decodificado e executado, `eval` de subshell, variáveis de ambiente enviadas pela rede;
- frases de prompt injection ("ignore previous instructions" e afins);
- scripts com `#!` e bit executável;
- limite de tamanho do `SKILL.md`.

**Snyk Agent Scan (`security-scan.yml`)** roda `uvx snyk-agent-scan@latest skills --ci` em push para `main` e em PRs abertos do próprio repositório. PRs de fork não têm acesso ao `SNYK_TOKEN`, então o scan roda depois do merge; o validador roda sempre.

**Integridade na instalação**: `skills-registry.json` carrega `sha256` por arquivo e `contentHash` por skill. O CLI `mass-skills` recusa um download cujo hash difere e não escreve nada no diretório do agente. `npx skills add` e o marketplace do Claude Code não verificam hash.

## Allowlist de falsos positivos

`security-scan-allowlist.yaml` na raiz lista achados do Snyk aceitos, com `risk`, `skill`, `reason` e `expiresAt` **obrigatório**. Uma entrada vencida faz a CI falhar até ser renovada ou removida, para que nenhuma exceção seja permanente por esquecimento.

```yaml
- risk: example-risk-name
  skill: mass-example
  reason: the pattern is documentation, not an instruction
  expiresAt: "2026-12-31"
```

## Escopo

Cobre o conteúdo de `skills/`, o CLI `mass-skills`, o site e os workflows deste repositório. Vulnerabilidades nos agentes que consomem as skills devem ser relatadas aos respectivos projetos.
