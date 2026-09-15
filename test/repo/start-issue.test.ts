import { describe, expect, it } from "vitest";
import { branchName, main, type Exec } from "../../tools/start-issue.js";

const ISSUE = {
  number: 8,
  title: "cli: pin the default download ref to the release tag",
  state: "OPEN",
  url: "https://github.com/acme/skills/issues/8",
  labels: [{ name: "enhancement" }],
};

// Answers each command by its longest matching prefix and records every call in order.
function fake(overrides: Record<string, string | Error> = {}) {
  const calls: string[] = [];
  const responses: Record<string, string | Error> = {
    "gh repo view": JSON.stringify({ owner: { login: "acme" }, name: "skills" }),
    "gh issue view": JSON.stringify(ISSUE),
    "git status": "",
    "gh project field-list": JSON.stringify({
      fields: [
        { id: "F_TITLE", name: "Title" },
        { id: "F_STATUS", name: "Status", options: [{ id: "O_TODO", name: "Todo" }, { id: "O_PROGRESS", name: "In Progress" }] },
      ],
    }),
    "gh project view": JSON.stringify({ id: "P_1" }),
    "gh issue develop --list": "",
    "gh api graphql": JSON.stringify({
      data: { repository: { issue: { projectItems: { nodes: [{ id: "I_OTHER", project: { number: 3 } }, { id: "I_1", project: { number: 5 } }] } } } },
    }),
    "gh project item-add": JSON.stringify({ id: "I_NEW" }),
    ...overrides,
  };
  const exec: Exec = (cmd, args) => {
    const line = [cmd, ...args].join(" ");
    calls.push(line);
    const key = Object.keys(responses)
      .filter((k) => line.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];
    const res = key === undefined ? "" : responses[key];
    if (res instanceof Error) throw res;
    return res;
  };
  return { calls, exec };
}

function run(argv: string[], f = fake()) {
  let out = "";
  const code = main(argv, { write: (s: string) => (out += s) }, f.exec);
  return { code, out, calls: f.calls };
}

const writes = (calls: string[]) =>
  calls.filter((c) => /^gh issue develop \d|^gh issue edit|^gh project item-(add|edit)|^git (fetch|switch)/.test(c));

describe("start-issue", () => {
  it("names the branch from the labels and the title, cutting the slug at a word", () => {
    expect(branchName({ number: 8, title: ISSUE.title, labels: ["enhancement"] })).toBe("feat/8-pin-the-default-download-ref-to-the");
    expect(branchName({ number: 15, title: "cli: `mass-skills --version` fails with unknown option", labels: ["bug"] })).toBe(
      "fix/15-mass-skills-version-fails-with-unknown",
    );
    expect(branchName({ number: 3, title: "Update the README", labels: ["documentation"] })).toBe("docs/3-update-the-readme");
  });

  it("creates the linked branch, assigns the issue and moves the item to In Progress", () => {
    const r = run(["8"]);
    expect(r.code).toBe(0);
    expect(r.calls).toContain("gh project field-list 5 --owner acme --format json");
    expect(writes(r.calls)).toEqual([
      "gh issue develop 8 --base main --checkout --name feat/8-pin-the-default-download-ref-to-the",
      "gh issue edit 8 --add-assignee @me",
      "gh project item-edit --id I_1 --project-id P_1 --field-id F_STATUS --single-select-option-id O_PROGRESS",
    ]);
    // The project is resolved before the branch exists.
    expect(r.calls.findIndex((c) => c.startsWith("gh project field-list"))).toBeLessThan(
      r.calls.findIndex((c) => c.startsWith("gh issue develop 8")),
    );
    expect(r.out).toContain("In Progress in project 5");
  });

  it("switches to an already linked branch instead of creating another", () => {
    const r = run(["8"], fake({ "gh issue develop --list": "feat/8-custom\thttps://github.com/acme/skills/tree/feat/8-custom\n" }));
    expect(r.code).toBe(0);
    expect(writes(r.calls).slice(0, 2)).toEqual(["git fetch origin feat/8-custom", "git switch feat/8-custom"]);
    expect(r.calls.some((c) => c.startsWith("gh issue develop 8"))).toBe(false);
  });

  it("adds the issue to the project when it is not there yet", () => {
    const r = run(["8"], fake({ "gh api graphql": JSON.stringify({ data: { repository: { issue: { projectItems: { nodes: [] } } } } }) }));
    expect(r.code).toBe(0);
    expect(r.calls).toContain("gh project item-add 5 --owner acme --url https://github.com/acme/skills/issues/8 --format json");
    expect(r.calls.at(-1)).toContain("item-edit --id I_NEW");
  });

  it("honours --project and --owner without mistaking their values for the issue number", () => {
    const r = run(["--project", "3", "--owner", "other", "8"]);
    expect(r.code).toBe(0);
    expect(r.calls).toContain("gh project field-list 3 --owner other --format json");
    expect(r.calls.at(-1)).toContain("item-edit --id I_OTHER");
  });

  it("refuses without writing anything", () => {
    const cases = [
      fake({ "gh issue view": JSON.stringify({ ...ISSUE, state: "CLOSED" }) }),
      fake({ "git status": " M README.md\n" }),
      fake({ "gh project field-list": JSON.stringify({ fields: [{ id: "F_STATUS", name: "Status", options: [{ id: "O_TODO", name: "Todo" }] }] }) }),
      fake({ "gh issue view": Object.assign(new Error("exit 1"), { stderr: "no issue found\n" }) }),
    ];
    const outputs = ["is closed", "uncommitted changes", 'no Status option "In Progress"', "start-issue failed: no issue found"];
    cases.forEach((f, i) => {
      const r = run(["8"], f);
      expect(r.code, outputs[i]).toBe(1);
      expect(r.out).toContain(outputs[i]);
      expect(writes(r.calls)).toEqual([]);
    });
  });

  it("prints usage and exits 2 without an issue number", () => {
    const r = run(["--project", "5"]);
    expect(r.code).toBe(2);
    expect(r.out).toMatch(/^Usage: pnpm start-issue <number>/);
    expect(r.calls).toEqual([]);
  });
});
