export type Lang = "en" | "pt-br";
export const LANGS: Lang[] = ["en", "pt-br"];

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Site-absolute href under the configured base: `href("pt-br/skills/x/")` -> `/agents-skills/pt-br/skills/x/`. */
export function href(path: string): string {
  return `${BASE}/${path.replace(/^\//, "")}`;
}

/** The same page in `lang`: `""` is the catalog, `"skills/x/"` a skill page. */
export function localized(lang: Lang, path = ""): string {
  return href(lang === "en" ? path : `pt-br/${path}`);
}

export function otherLang(lang: Lang): Lang {
  return lang === "en" ? "pt-br" : "en";
}

const dict = {
  en: {
    siteName: "Mass Solutions Skills",
    tagline: "Agent Skills for coding agents, validated in CI and installed with integrity checks.",
    nav: { catalog: "Catalog", install: "Install", agents: "Agents", github: "GitHub" },
    switchLang: "Português (BR)",
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
    skillCount: (n: number) => `${n} skills`,
    terminalTitle: "mass-skills",
    terminalCaption: "Every file is checked against the sha256 in the registry before anything is written. A file that no longer matches stops the install.",
    footerSite: "Site",
    footerProject: "Project",
    footerLanguages: "Language",
    footerSecurity: "Security policy",
    footerContributing: "Contributing",
  },
  "pt-br": {
    siteName: "Mass Solutions Skills",
    tagline: "Agent Skills para agentes de código, validadas em CI e instaladas com verificação de integridade.",
    nav: { catalog: "Catálogo", install: "Instalação", agents: "Agentes", github: "GitHub" },
    switchLang: "English",
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
    skillCount: (n: number) => `${n} skills`,
    terminalTitle: "mass-skills",
    terminalCaption: "Cada arquivo é conferido contra o sha256 do registry antes de qualquer escrita. Um arquivo que não bate mais interrompe a instalação.",
    footerSite: "Site",
    footerProject: "Projeto",
    footerLanguages: "Idioma",
    footerSecurity: "Política de segurança",
    footerContributing: "Como contribuir",
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
