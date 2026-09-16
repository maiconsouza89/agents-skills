import { describe, expect, it } from "vitest";
import { FIELDS, ISSUE_NODE_ID, ITEM_ID, PROJECT_ID, fieldId, optionId, runWorkflow, type GhCall } from "./lib/workflow-run.js";

const WORKFLOW = "project-fields.yml";

const graphql = (calls: GhCall[]) => calls.filter((c) => c.args.includes("graphql"));
const adds = (calls: GhCall[]) => calls.filter((c) => c.text.includes("addProjectV2ItemById"));
const updates = (calls: GhCall[]) => calls.filter((c) => c.text.includes("updateProjectV2ItemFieldValue"));
const deletes = (calls: GhCall[]) => calls.filter((c) => c.method === "DELETE");

function expectFieldWrite(calls: GhCall[], field: string, option: string) {
  const u = updates(calls);
  expect(u, `one field write for ${field}=${option}`).toHaveLength(1);
  expect(u[0].text).toContain(PROJECT_ID);
  expect(u[0].text).toContain(ITEM_ID);
  expect(u[0].text).toContain(fieldId(field));
  expect(u[0].text).toContain(optionId(field, option));
  for (const other of FIELDS[field].filter((o) => o !== option)) expect(u[0].text).not.toContain(optionId(field, other));
}

const notFound = (status: string, message: string) => ({
  match: "labels/complexity%3Ahigh",
  exit: 1,
  stdout: JSON.stringify({ message, documentation_url: "https://docs.github.com/rest/issues/labels#remove-a-label-from-an-issue", status }),
  stderr: `gh: ${message} (HTTP ${status})`,
});

describe("project-fields workflow", () => {
  it("sets Complexity to High for complexity:high", () => {
    const r = runWorkflow(WORKFLOW, { label: "complexity:high" });
    expect(r.code, r.output).toBe(0);
    expectFieldWrite(r.calls, "Complexity", "High");
  });

  it("maps every contract label to its field option", () => {
    const cases: Array<[string, string, string]> = [
      ["priority:p0", "Priority", "P0"],
      ["priority:p1", "Priority", "P1"],
      ["priority:p2", "Priority", "P2"],
      ["priority:backlog", "Priority", "Backlog"],
      ["area:cli", "Area", "CLI"],
      ["area:core", "Area", "Core"],
      ["area:site", "Area", "Site"],
      ["area:ci", "Area", "CI"],
      ["area:catalog", "Area", "Catalog"],
      ["complexity:low", "Complexity", "Low"],
      ["complexity:medium", "Complexity", "Medium"],
      ["complexity:high", "Complexity", "High"],
    ];
    expect(cases).toHaveLength(12);
    for (const [label, field, option] of cases) {
      const r = runWorkflow(WORKFLOW, { label });
      expect(r.code, `${label}: ${r.output}`).toBe(0);
      expectFieldWrite(r.calls, field, option);
    }
  });

  it("matches family and value without case", () => {
    const r = runWorkflow(WORKFLOW, { label: "Complexity:HIGH" });
    expect(r.code, r.output).toBe(0);
    expectFieldWrite(r.calls, "Complexity", "High");
  });

  it("adds the issue and writes the field on the returned item", () => {
    const r = runWorkflow(WORKFLOW, { label: "area:site" });
    expect(r.code, r.output).toBe(0);
    const a = adds(r.calls);
    expect(a).toHaveLength(1);
    expect(a[0].text).toContain(PROJECT_ID);
    expect(a[0].text).toContain(ISSUE_NODE_ID);
    expect(r.calls.indexOf(a[0])).toBeLessThan(r.calls.indexOf(updates(r.calls)[0]));
    expectFieldWrite(r.calls, "Area", "Site");
  });

  it("fails on a value with no matching option", () => {
    const cases: Array<[string, string, string[]]> = [
      ["priority:urgent", "Priority", ["priority:p1", "priority:urgent"]],
      ["complexity: high", "Complexity", ["complexity:low", "complexity: high"]],
    ];
    for (const [label, field, labels] of cases) {
      const r = runWorkflow(WORKFLOW, { label, labels });
      expect(r.code, label).toBe(1);
      const error = r.output.split("\n").find((l) => l.startsWith("::error::"));
      expect(error, `${label}: ${r.output}`).toBeDefined();
      expect(error).toContain(label);
      for (const option of FIELDS[field]) expect(error).toContain(option);
      expect(updates(r.calls)).toEqual([]);
      expect(deletes(r.calls)).toEqual([]);
    }
  });

  it("stops before removing labels when the field write fails", () => {
    const r = runWorkflow(WORKFLOW, {
      label: "complexity:low",
      labels: ["complexity:high", "complexity:low"],
      failures: [{ match: "updateProjectV2ItemFieldValue", exit: 1, stderr: "gh: Something went wrong while executing your query." }],
    });
    expect(r.code).not.toBe(0);
    expect(updates(r.calls)).toHaveLength(1);
    expect(deletes(r.calls)).toEqual([]);
  });

  it("stops when the field lookup fails", () => {
    const r = runWorkflow(WORKFLOW, {
      label: "complexity:low",
      labels: ["complexity:high", "complexity:low"],
      failures: [
        {
          match: "projectV2(number",
          exit: 1,
          stdout: JSON.stringify({ errors: [{ message: "Could not resolve to a User with the login of 'maiconsouza89'." }] }),
          stderr: "gh: Could not resolve to a User with the login of 'maiconsouza89'.",
        },
      ],
    });
    expect(r.code).not.toBe(0);
    expect(adds(r.calls)).toEqual([]);
    expect(updates(r.calls)).toEqual([]);
    expect(deletes(r.calls)).toEqual([]);
  });

  it("removes the older sibling of the same family", () => {
    const r = runWorkflow(WORKFLOW, { label: "complexity:low", labels: ["complexity:high", "complexity:low"] });
    expect(r.code, r.output).toBe(0);
    const d = deletes(r.calls);
    expect(d).toHaveLength(1);
    expect(d[0].args).toContain("repos/acme/skills/issues/8/labels/complexity%3Ahigh");
    expect(d[0].token).toBe("github-token");
  });

  it("keeps other families and labels added after the event", () => {
    const r = runWorkflow(WORKFLOW, {
      label: "complexity:low",
      labels: ["bug", "priority:p1", "area:cli", "complexity:low"],
      otherResponse: JSON.stringify([{ name: "complexity:medium" }]),
    });
    expect(r.code, r.output).toBe(0);
    expect(deletes(r.calls)).toEqual([]);
  });

  it("treats an already removed sibling as done", () => {
    const r = runWorkflow(WORKFLOW, {
      label: "complexity:low",
      labels: ["complexity:high", "complexity:low"],
      failures: [notFound("404", "Not Found")],
    });
    expect(deletes(r.calls)).toHaveLength(1);
    expect(r.code, r.output).toBe(0);
  });

  it("fails when removing a sibling fails for another reason", () => {
    const r = runWorkflow(WORKFLOW, {
      label: "complexity:low",
      labels: ["complexity:high", "complexity:low"],
      failures: [notFound("410", "Gone")],
    });
    expect(deletes(r.calls)).toHaveLength(1);
    expect(r.code).not.toBe(0);
  });

  // 301 is the fourth status the labels endpoint documents; it reaches this code only when gh
  // surfaces the redirect instead of following it, which happens on a renamed or transferred
  // repository. Failing loudly is the wanted outcome - the alternative is deleting a label on a
  // repository that is no longer the one the workflow was configured for.
  it("fails when the label endpoint answers a redirect", () => {
    const r = runWorkflow(WORKFLOW, {
      label: "complexity:low",
      labels: ["complexity:high", "complexity:low"],
      failures: [notFound("301", "Moved Permanently")],
    });
    expect(deletes(r.calls)).toHaveLength(1);
    expect(r.code).not.toBe(0);
    expect(r.output).toContain("Could not remove 'complexity:high'");
  });

  it("uses PROJECT_TOKEN for the project and github.token for labels", () => {
    const r = runWorkflow(WORKFLOW, { label: "priority:p2", labels: ["priority:p0", "priority:p2"] });
    expect(r.code, r.output).toBe(0);
    const g = graphql(r.calls);
    expect(g.length).toBeGreaterThanOrEqual(2);
    for (const c of g) expect(c.token, c.text.slice(0, 80)).toBe("project-token");
    const d = deletes(r.calls);
    expect(d).toHaveLength(1);
    for (const c of d) expect(c.token).toBe("github-token");
  });
});
