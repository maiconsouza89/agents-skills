export type Lang = "en" | "pt-br";
export const LANGS: Lang[] = ["en", "pt-br"];

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Site-absolute href under the configured base: `href("pt-br/skills/x/")` -> `/agents-skills/pt-br/skills/x/`. */
export function href(path: string): string {
  return `${BASE}/${path.replace(/^\//, "")}`;
}

/** The same page in `lang`: `""` is the home page, `"catalog/"` the catalog, `"skills/x/"` a skill page. */
export function localized(lang: Lang, path = ""): string {
  return href(lang === "en" ? path : `pt-br/${path}`);
}

/** Display code and native name of each language; the same in every locale, so it lives outside the dictionary. */
export const LANG_META: Record<Lang, { code: string; name: string }> = {
  en: { code: "EN", name: "English" },
  "pt-br": { code: "PT", name: "Português (BR)" },
};

export function otherLang(lang: Lang): Lang {
  return lang === "en" ? "pt-br" : "en";
}

const dict = {
  en: {
    siteName: "Mass Skills",
    tagline: "Agent Skills for coding agents, validated in CI and installed with integrity checks.",
    nav: { catalog: "Catalog", install: "Install", agents: "Agents", about: "About", github: "GitHub" },
    searchLabel: "Search skills",
    searchPlaceholder: "name, description or tag",
    filterLabel: "Category",
    allCategories: "All categories",
    noMatch: (term: string) => `No skills match "${term}"`,
    version: "version",
    whatItDoes: "What it does",
    useWhen: "Use when",
    doNotUseFor: "Do not use for",
    metadata: "Metadata",
    author: "author",
    reviewed: "reviewed",
    category: "category",
    tags: "tags",
    requires: "requires",
    allowedTools: "allowed tools",
    files: "Installed files",
    extraFiles: "Additional files",
    bytes: "bytes",
    contentHash: "content hash",
    source: "Source on GitHub",
    install: "Install",
    installCli: "Verified install with the CLI (checks every file against the registry hash and keeps a lockfile)",
    installNpx: "Open installer, no hash verification",
    installMarketplace: "Claude Code marketplace, installs the whole catalog, no hash verification",
    hashWarning: "Only the mass-skills CLI verifies hashes.",
    deprecatedSince: (since: string) => `Deprecated since ${since}`,
    replacedBy: "Use instead",
    reason: "Reason",
    skillBody: "Skill instructions (always in English)",
    installTitle: "Install",
    installIntro: "Three ways to install a skill, from most to least verified.",
    installPaths: [
      {
        title: "1. mass-skills CLI",
        verifies: "Downloads skills-registry.json from the pinned ref, checks the sha256 of every file and the contentHash of the set, writes a lockfile, and refuses deprecated skills. update never overwrites a skill you edited unless you pass --force.",
      },
      {
        title: "2. npx skills add",
        verifies: "Installs from the public repo into 70+ agents. Nothing is verified against the registry: what is on the branch is what you get.",
      },
      {
        title: "3. Claude Code marketplace",
        verifies: "Installs the whole catalog as one plugin. No hash verification; Claude Code pins by marketplace version.",
      },
    ],
    agentsTitle: "Supported agents",
    agentsIntro: "Agent ids accepted by mass-skills install -a, with the directory each one reads. Use -a auto to detect them from the folders present in your project.",
    agentId: "id",
    projectPath: "project path",
    globalPath: "global path",
    notFound: "Page not found",
    notFoundBody: "There is nothing at this address.",
    backToCatalog: "Back to the catalog",
    ptCatalog: "Catálogo em português",
    footer: "Code MIT · Skills CC-BY-4.0 · Mass Solutions",
    skipToContent: "Skip to content",
    menu: "Menu",
    heroEyebrow: "Agent Skills catalog",
    whatIsTitle: "What is an Agent Skill?",
    whatIsLead:
      "A folder with a SKILL.md at its root: short instructions a coding agent loads when the task calls for them, plus the reference material and scripts it needs.",
    whatIsPoints: [
      {
        title: "A folder, not a prompt",
        body: "SKILL.md holds the frontmatter and the short instructions. Long material lives in references/ and runnable steps in scripts/, so nothing is loaded until it is needed.",
      },
      {
        title: "Picked from the description",
        body: "Every description says what the skill does, when to use it and when not to. The agent chooses the right skill without you naming it.",
      },
      {
        title: "One catalog, any agent",
        body: "The CLI installs the same folder into Claude Code, Cursor, Codex, Copilot and the rest, checking every file against the registry before writing it.",
      },
    ],
    skillCount: (n: number) => `${n} skills`,
    terminalTitle: "mass-skills",
    terminalCaption: "Every file is checked against the sha256 in the registry before anything is written. A file that no longer matches stops the install.",
    footerSite: "Site",
    footerProject: "Project",
    language: "Language",
    footerSecurity: "Security policy",
    footerContributing: "Contributing",
    aboutTitle: "About",
    aboutIntro:
      "Mass Solutions Skills is a small, verified catalog of Agent Skills for AI coding agents: open source, reviewed by hand and installed with an integrity check.",
    aboutSections: [
      {
        title: "What it is",
        body: "A curated set of skills that follow the open Agent Skills specification, so the same folder works in Claude Code, Cursor, Codex, Copilot and any other agent that reads SKILL.md. The code is MIT and the skills are CC-BY-4.0.",
      },
      {
        title: "Why it exists",
        body: "A skill installed into many agents is a supply-chain target. Every skill here has a declared author, a semver version and a review date, and nothing enters the catalog without an issue, a review and the validator.",
      },
    ],
    aboutTrustTitle: "How trust is kept",
    aboutTrust: [
      {
        title: "Validator in CI",
        body: "Checks the frontmatter contract, secret patterns, dangerous shell, prompt-injection phrases and binaries on every pull request, with no external service.",
      },
      {
        title: "Independent scan",
        body: "Snyk Agent Scan reviews every skill on main. Accepted findings need a reason and an expiry date, and an expired entry fails CI.",
      },
      {
        title: "Integrity at install time",
        body: "The mass-skills CLI checks the sha256 of every file against the registry before writing anything and records what it installed in a lockfile.",
      },
    ],
    aboutTeamTitle: "Who maintains it",
    aboutTeamBody:
      "The catalog is maintained by Mass Solutions. Maicon Souza owns the repository, reviews every skill that enters the catalog and answers security reports.",
    aboutMaintainer: "Maintainer",
    aboutCtaTitle: "Want to help?",
    aboutCtaBody: "Propose a skill through an issue, or report a vulnerability through a private advisory.",
  },
  "pt-br": {
    siteName: "Mass Skills",
    tagline: "Agent Skills para agentes de código, validadas em CI e instaladas com verificação de integridade.",
    nav: { catalog: "Catálogo", install: "Instalação", agents: "Agentes", about: "Sobre", github: "GitHub" },
    searchLabel: "Buscar skills",
    searchPlaceholder: "nome, descrição ou tag",
    filterLabel: "Categoria",
    allCategories: "Todas as categorias",
    noMatch: (term: string) => `Nenhuma skill corresponde a "${term}"`,
    version: "versão",
    whatItDoes: "O que faz",
    useWhen: "Use quando",
    doNotUseFor: "Não use para",
    metadata: "Metadados",
    author: "autor",
    reviewed: "revisada em",
    category: "categoria",
    tags: "tags",
    requires: "requer",
    allowedTools: "ferramentas permitidas",
    files: "Arquivos instalados",
    extraFiles: "Arquivos adicionais",
    bytes: "bytes",
    contentHash: "hash do conteúdo",
    source: "Fonte no GitHub",
    install: "Instalar",
    installCli: "Instalação verificada com o CLI (confere cada arquivo contra o hash do registry e mantém um lockfile)",
    installNpx: "Instalador aberto, sem verificação de hash",
    installMarketplace: "Marketplace do Claude Code, instala o catálogo inteiro, sem verificação de hash",
    hashWarning: "Só o CLI mass-skills verifica hash.",
    deprecatedSince: (since: string) => `Descontinuada desde ${since}`,
    replacedBy: "Use no lugar",
    reason: "Motivo",
    skillBody: "Instruções da skill (sempre em inglês)",
    installTitle: "Instalação",
    installIntro: "Três formas de instalar uma skill, da mais verificada para a menos.",
    installPaths: [
      {
        title: "1. CLI mass-skills",
        verifies: "Baixa o skills-registry.json do ref fixado, confere o sha256 de cada arquivo e o contentHash do conjunto, grava um lockfile e recusa skills deprecadas. O update nunca sobrescreve uma skill que você editou sem --force.",
      },
      {
        title: "2. npx skills add",
        verifies: "Instala do repositório público em mais de 70 agentes. Nada é conferido contra o registry: o que está na branch é o que você recebe.",
      },
      {
        title: "3. Marketplace do Claude Code",
        verifies: "Instala o catálogo inteiro como um plugin. Sem verificação de hash; o Claude Code fixa pela versão do marketplace.",
      },
    ],
    agentsTitle: "Agentes suportados",
    agentsIntro: "Ids de agente aceitos por mass-skills install -a, com o diretório que cada um lê. Use -a auto para detectar pelas pastas presentes no projeto.",
    agentId: "id",
    projectPath: "path no projeto",
    globalPath: "path global",
    notFound: "Página não encontrada",
    notFoundBody: "Não há nada neste endereço.",
    backToCatalog: "Voltar ao catálogo",
    ptCatalog: "Catalog in English",
    footer: "Código MIT · Skills CC-BY-4.0 · Mass Solutions",
    skipToContent: "Pular para o conteúdo",
    menu: "Menu",
    heroEyebrow: "Catálogo de Agent Skills",
    whatIsTitle: "O que é uma Agent Skill?",
    whatIsLead:
      "Uma pasta com um SKILL.md na raiz: instruções curtas que um agente de código carrega quando a tarefa pede, junto do material de referência e dos scripts de que ela precisa.",
    whatIsPoints: [
      {
        title: "Uma pasta, não um prompt",
        body: "O SKILL.md guarda o frontmatter e as instruções curtas. Material longo fica em references/ e passos executáveis em scripts/, então nada é carregado antes da hora.",
      },
      {
        title: "Escolhida pela description",
        body: "Toda description diz o que a skill faz, quando usar e quando não usar. O agente escolhe a skill certa sem você nomeá-la.",
      },
      {
        title: "Um catálogo, qualquer agente",
        body: "O CLI instala a mesma pasta no Claude Code, Cursor, Codex, Copilot e nos demais, conferindo cada arquivo contra o registry antes de escrever.",
      },
    ],
    skillCount: (n: number) => `${n} skills`,
    terminalTitle: "mass-skills",
    terminalCaption: "Cada arquivo é conferido contra o sha256 do registry antes de qualquer escrita. Um arquivo que não bate mais interrompe a instalação.",
    footerSite: "Site",
    footerProject: "Projeto",
    language: "Idioma",
    footerSecurity: "Política de segurança",
    footerContributing: "Como contribuir",
    aboutTitle: "Sobre",
    aboutIntro:
      "Mass Solutions Skills é um catálogo pequeno e verificado de Agent Skills para agentes de código com IA: código aberto, revisado à mão e instalado com verificação de integridade.",
    aboutSections: [
      {
        title: "O que é",
        body: "Um conjunto curado de skills que segue a especificação aberta Agent Skills, então a mesma pasta funciona no Claude Code, Cursor, Codex, Copilot e em qualquer outro agente que leia SKILL.md. O código é MIT e as skills são CC-BY-4.0.",
      },
      {
        title: "Por que existe",
        body: "Uma skill instalada em muitos agentes é alvo de ataque à cadeia de suprimentos. Toda skill aqui tem autor declarado, versão semver e data de revisão, e nada entra no catálogo sem issue, revisão e validador.",
      },
    ],
    aboutTrustTitle: "Como a confiança é mantida",
    aboutTrust: [
      {
        title: "Validador em CI",
        body: "Confere o contrato do frontmatter, padrões de segredo, shell perigoso, frases de prompt injection e binários em todo pull request, sem serviço externo.",
      },
      {
        title: "Varredura independente",
        body: "O Snyk Agent Scan revisa toda skill em main. Achados aceitos precisam de motivo e data de validade, e uma entrada vencida derruba o CI.",
      },
      {
        title: "Integridade na instalação",
        body: "O CLI mass-skills confere o sha256 de cada arquivo contra o registry antes de escrever qualquer coisa e registra o que instalou num lockfile.",
      },
    ],
    aboutTeamTitle: "Quem mantém",
    aboutTeamBody:
      "O catálogo é mantido pela Mass Solutions. Maicon Souza é o dono do repositório, revisa toda skill que entra no catálogo e responde aos relatos de segurança.",
    aboutMaintainer: "Mantenedor",
    aboutCtaTitle: "Quer ajudar?",
    aboutCtaBody: "Proponha uma skill por uma issue, ou relate uma vulnerabilidade por um advisory privado.",
  },
} as const;

export type Dict = (typeof dict)["en"];

export function t(lang: Lang): Dict {
  return dict[lang] as Dict;
}

/** Route params for `[...lang]` pages: `undefined` is the default locale at the root. */
export function langPaths(): Array<{ params: { lang: string | undefined }; props: { lang: Lang } }> {
  return [
    { params: { lang: undefined }, props: { lang: "en" } },
    { params: { lang: "pt-br" }, props: { lang: "pt-br" } },
  ];
}
