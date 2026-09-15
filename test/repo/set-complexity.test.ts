import { describe, expect, it } from "vitest";
import { main, type FetchLike } from "../../tools/set-complexity.js";
import { ENOENT, fakeExec, fakeFetch, unusedFetch } from "./lib/gh-fakes.js";

const FIELDS = [
  { id: 412670087, name: "Priority", data_type: "single_select", options: [{ id: "p0", name: { raw: "P0" } }] },
  {
    id: 412833793,
    name: "Complexity",
    data_type: "single_select",
    options: [
      { id: "low1", name: { raw: "Low" } },
      { id: "med1", name: { raw: "Medium" } },
      { id: "high1", name: { raw: "High" } },
    ],
  },
];

const itemsWith = (currentValue?: string) => [
  {
    id: 111,
    content: { number: 8 },
    fields: currentValue ? [{ id: 412833793, name: "Complexity", value: { name: { raw: currentValue } } }] : [],
  },
];

function fake(overrides: Record<string, string | Error> = {}, currentValue?: string) {
  return fakeExec({
    "git remote get-url origin": "https://github.com/acme/skills.git\n",
    "gh api users/acme/projectsV2/5/fields": JSON.stringify(FIELDS),
    "gh api users/acme/projectsV2/5/items?fields=412833793 --paginate": JSON.stringify(itemsWith(currentValue)),
    ...overrides,
  });
}

async function run(argv: string[], f = fake(), env: NodeJS.ProcessEnv = {}, fetchImpl: FetchLike = unusedFetch) {
  let out = "";
  const code = await main(argv, { write: (s: string) => (out += s) }, f.exec, env, fetchImpl);
  return { code, out, calls: f.calls };
}

const patches = (calls: string[]) => calls.filter((c) => c.startsWith("gh api -X PATCH"));

describe("set-complexity", () => {
  it("sets the Complexity field for an issue already on the board", async () => {
    const r = await run(["8", "medium"]);
    expect(r.code).toBe(0);
    expect(patches(r.calls)).toEqual(["gh api -X PATCH users/acme/projectsV2/5/items/111 -F fields[][id]=412833793 -f fields[][value]=med1"]);
    expect(r.out).toContain("Complexity set to Medium");
  });

  it("is case-insensitive on the level argument", async () => {
    const r = await run(["8", "HIGH"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("Complexity set to High");
  });

  it("does nothing when the field already has the target value", async () => {
    const r = await run(["8", "low"], fake({}, "Low"));
    expect(r.code).toBe(0);
    expect(patches(r.calls)).toEqual([]);
    expect(r.out).toContain("already Low");
  });

  it("reports the previous value when overwriting it", async () => {
    const r = await run(["8", "high"], fake({}, "Low"));
    expect(r.code).toBe(0);
    expect(r.out).toContain("Complexity set to High (was Low)");
  });

  it("honours --project and --owner", async () => {
    const f = fakeExec({
      "gh api users/other/projectsV2/3/fields": JSON.stringify(FIELDS),
      "gh api users/other/projectsV2/3/items?fields=412833793 --paginate": JSON.stringify(itemsWith()),
    });
    const r = await run(["8", "low", "--project", "3", "--owner", "other"], f);
    expect(r.code).toBe(0);
    expect(r.calls.some((c) => c.startsWith("git remote get-url"))).toBe(false);
    expect(patches(r.calls)[0]).toContain("users/other/projectsV2/3/items/111");
  });

  it("falls back to REST over fetch when gh is missing (ENOENT), using GH_TOKEN", async () => {
    const f = fake({
      "gh api users/acme/projectsV2/5/fields": ENOENT(),
      "gh api users/acme/projectsV2/5/items?fields=412833793 --paginate": ENOENT(),
      "gh api -X PATCH users/acme/projectsV2/5/items/111": ENOENT(),
    });
    const { fn, calls: fetchCalls } = fakeFetch({
      "GET https://api.github.com/users/acme/projectsV2/5/fields": { status: 200, body: FIELDS },
      "GET https://api.github.com/users/acme/projectsV2/5/items?fields=412833793&per_page=100": { status: 200, body: itemsWith() },
      "PATCH https://api.github.com/users/acme/projectsV2/5/items/111": { status: 200, body: {} },
    });
    const r = await run(["8", "medium"], f, { GH_TOKEN: "proxy-injected" }, fn);
    expect(r.code).toBe(0);
    expect(fetchCalls).toEqual([
      "GET https://api.github.com/users/acme/projectsV2/5/fields",
      "GET https://api.github.com/users/acme/projectsV2/5/items?fields=412833793&per_page=100",
      "PATCH https://api.github.com/users/acme/projectsV2/5/items/111",
    ]);
  });

  it("follows Link pagination through the fetch fallback", async () => {
    const f = fake({
      "gh api users/acme/projectsV2/5/fields": ENOENT(),
      "gh api users/acme/projectsV2/5/items?fields=412833793 --paginate": ENOENT(),
    });
    const { fn } = fakeFetch({
      "GET https://api.github.com/users/acme/projectsV2/5/fields": { status: 200, body: FIELDS },
      "GET https://api.github.com/users/acme/projectsV2/5/items?fields=412833793&per_page=100": {
        status: 200,
        body: [{ id: 999, content: { number: 1 }, fields: [] }],
        link: '<https://api.github.com/users/acme/projectsV2/5/items?fields=412833793&per_page=100&page=2>; rel="next"',
      },
      "GET https://api.github.com/users/acme/projectsV2/5/items?fields=412833793&per_page=100&page=2": { status: 200, body: itemsWith() },
    });
    const r = await run(["8", "low"], f, { GH_TOKEN: "proxy-injected" }, fn);
    expect(r.code).toBe(0);
    expect(r.out).toContain("Complexity set to Low");
  });

  it("refuses without writing anything", async () => {
    const cases: Array<[string, Record<string, string | Error>, string]> = [
      ["medium", { "gh api users/acme/projectsV2/5/fields": JSON.stringify([FIELDS[0]]) }, 'no single-select "Complexity" field'],
      [
        "high",
        {
          "gh api users/acme/projectsV2/5/fields": JSON.stringify([
            { id: 1, name: "Complexity", data_type: "single_select", options: [{ id: "a", name: { raw: "Low" } }] },
          ]),
        },
        'no "High" option',
      ],
      ["low", { "gh api users/acme/projectsV2/5/items?fields=412833793 --paginate": JSON.stringify([{ id: 1, content: { number: 999 }, fields: [] }]) }, "is not on project"],
    ];
    for (const [level, overrides, expected] of cases) {
      const r = await run(["8", level], fake(overrides));
      expect(r.code, expected).toBe(1);
      expect(r.out).toContain(expected);
      expect(patches(r.calls)).toEqual([]);
    }
  });

  it("prints usage and exits 2 for a missing or invalid level", async () => {
    const r1 = await run(["8"]);
    expect(r1.code).toBe(2);
    expect(r1.out).toMatch(/^Usage: pnpm set-complexity/);
    const r2 = await run(["8", "urgent"]);
    expect(r2.code).toBe(2);
    const r3 = await run([]);
    expect(r3.code).toBe(2);
  });
});
