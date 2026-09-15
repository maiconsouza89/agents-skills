// Runs in the node environment: the page is loaded into an explicit JSDOM with scripts enabled,
// which is what executes the search script; a jsdom test environment would break the file URL helpers.
import { beforeAll, describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { DIST, buildSite, html } from "./helpers";

async function loadHome(page: string): Promise<Document> {
  const index = html(DIST, "search-index.json");
  const dom = new JSDOM(html(DIST, page), {
    runScripts: "dangerously",
    url: "https://maiconsouza89.github.io/agents-skills/",
    beforeParse(window) {
      // The page fetches search-index.json; serve the built file.
      (window as unknown as { fetch: unknown }).fetch = async () => ({ ok: true, json: async () => JSON.parse(index) });
    },
  });
  const doc = dom.window.document;
  for (let i = 0; i < 100 && doc.querySelector("[data-catalog]")?.getAttribute("data-ready") !== "1"; i++) {
    await new Promise((r) => setTimeout(r, 20));
  }
  expect(doc.querySelector("[data-catalog]")!.getAttribute("data-ready")).toBe("1");
  return doc;
}

function type(doc: Document, value: string) {
  const input = doc.querySelector<HTMLInputElement>("input#q")!;
  input.value = value;
  input.dispatchEvent(new (doc.defaultView as Window & typeof globalThis).Event("input", { bubbles: true }));
}

beforeAll(() => {
  buildSite();
});

describe("home search", () => {
  it("no match message names the term and keeps the field visible", async () => {
    for (const [page, message] of [
      ["index.html", 'No skills match "zzz-nothing"'],
      ["pt-br/index.html", 'Nenhuma skill corresponde a "zzz-nothing"'],
    ] as const) {
      const doc = await loadHome(page);
      const noMatch = doc.querySelector<HTMLElement>("[data-no-match]")!;
      expect(noMatch.hidden).toBe(true);
      type(doc, "zzz-nothing");
      expect(noMatch.hidden).toBe(false);
      expect(noMatch.textContent).toBe(message);
      expect(doc.querySelector<HTMLInputElement>("input#q")!.hidden).toBe(false);
      expect([...doc.querySelectorAll<HTMLElement>("[data-skill]")].every((li) => li.hidden)).toBe(true);
      type(doc, "review");
      expect(noMatch.hidden).toBe(true);
      const visible = [...doc.querySelectorAll<HTMLElement>("[data-skill]")].filter((li) => !li.hidden).map((li) => li.dataset.name);
      expect(visible).toContain("mass-code-review");
      expect(visible).not.toContain("mass-commit-message");
    }
  });

  it("category pills filter the catalog and combine with the search term", async () => {
    const doc = await loadHome("index.html");
    const win = doc.defaultView as Window & typeof globalThis;
    const index: Array<{ name: string; description: string; tags: string[]; category: string }> = JSON.parse(html(DIST, "search-index.json"));
    const expected = (category: string, term: string) =>
      index
        .filter((s) => (!category || s.category === category) && (!term || [s.name, s.description, ...s.tags].join(" ").toLowerCase().includes(term)))
        .map((s) => s.name)
        .sort();
    const pick = (value: string) => {
      const radio = doc.querySelector<HTMLInputElement>(`input[name="category"][value="${value}"]`)!;
      radio.checked = true;
      radio.dispatchEvent(new win.Event("change", { bubbles: true }));
    };
    const visible = () => [...doc.querySelectorAll<HTMLElement>("[data-skill]")].filter((li) => !li.hidden).map((li) => li.dataset.name!).sort();
    const noMatch = doc.querySelector<HTMLElement>("[data-no-match]")!;

    pick("workflow");
    expect(visible()).toEqual(expected("workflow", ""));
    expect(visible().length).toBeGreaterThan(0);
    expect(doc.querySelector<HTMLElement>('section[data-category="quality"]')!.hidden).toBe(true);
    type(doc, "commit");
    expect(visible()).toEqual(expected("workflow", "commit"));
    type(doc, "zzz-nothing");
    expect(visible()).toEqual([]);
    expect(noMatch.hidden).toBe(false);
    type(doc, "");
    pick("");
    expect(visible()).toEqual(expected("", ""));
    expect(noMatch.hidden).toBe(true);
  });
});
