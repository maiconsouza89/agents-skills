import { describe, expect, it } from "vitest";
import { FIELDS, ISSUE_NODE_ID, ITEM_ID, PROJECT_ID, fieldId, optionId, runWorkflow, type GhCall } from "./lib/workflow-run.js";

const WORKFLOW = "triage.yml";
const ISSUE = JSON.stringify({ number: 8, node_id: ISSUE_NODE_ID, title: "cli: pin the ref", body: "The CLI should pin its ref." });
const RESULT = {
  priority: "p1",
  area: "cli",
  complexity: "medium",
  priority_reason: "Breaks install for every user without --ref.",
  area_reason: "Title prefix cli:.",
  complexity_reason: "One module, covered by the existing tests.",
};

const graphql = (calls: GhCall[]) => calls.filter((c) => c.args.includes("graphql"));
const updates = (calls: GhCall[]) => calls.filter((c) => c.text.includes("updateProjectV2ItemFieldValue"));
const comments = (calls: GhCall[]) => calls.filter((c) => c.method === "POST" && c.text.includes("/comments"));

// The action step is skipped: its answer arrives as the structured_output expression, the way the
// runner hands it to the shell steps.
const run = (result: unknown, opts: { otherResponse?: string; failures?: Array<{ match: string }> } = {}) =>
  runWorkflow(WORKFLOW, {
    skipActions: true,
    otherResponse: opts.otherResponse ?? ISSUE,
    failures: opts.failures,
    expressions: { "steps.classify.outputs.structured_output": typeof result === "string" ? result : JSON.stringify(result) },
  });

describe("triage workflow", () => {
  it("writes the three fields with the project token, then comments with the justifications", () => {
    const r = run(RESULT);
    expect(r.code, r.output).toBe(0);
    const add = r.calls.find((c) => c.text.includes("addProjectV2ItemById"))!;
    expect(add.text).toContain(PROJECT_ID);
    expect(add.text).toContain(ISSUE_NODE_ID);
    const u = updates(r.calls);
    expect(u.map((c) => c.token)).toEqual(["project-token", "project-token", "project-token"]);
    const expected: Array<[string, string]> = [
      ["Priority", "P1"],
      ["Area", "CLI"],
      ["Complexity", "Medium"],
    ];
    for (const [i, [field, option]] of expected.entries()) {
      expect(u[i].text).toContain(ITEM_ID);
      expect(u[i].text).toContain(fieldId(field));
      expect(u[i].text).toContain(optionId(field, option));
      for (const other of FIELDS[field].filter((o) => o !== option)) expect(u[i].text).not.toContain(optionId(field, other));
    }
    const c = comments(r.calls);
    expect(c).toHaveLength(1);
    expect(c[0].token).toBe("github-token");
    expect(c[0].text).toContain("repos/acme/skills/issues/8/comments");
    expect(c[0].text).toContain("body=Triage: priority:p1 · area:cli · complexity:medium\n\n- Priority: Breaks install");
    expect(c[0].text).toContain("\n- Area: Title prefix cli:.\n- Complexity: One module");
    expect(c[0].text).not.toContain("Caveat");
    // The comment comes last: it records writes that already happened.
    expect(r.calls.indexOf(c[0])).toBeGreaterThan(r.calls.indexOf(u[2]));
  });

  it("appends the caveat when Claude reports one", () => {
    const r = run({ ...RESULT, caveat: "No reproduction steps; P0 if it affects every install." });
    expect(r.code, r.output).toBe(0);
    expect(comments(r.calls)[0].text).toContain("\n\nCaveat: No reproduction steps; P0 if it affects every install.");
  });

  it("writes nothing when the answer is not a triage object", () => {
    for (const bad of ["", "null", "not json", JSON.stringify({ priority: "p1" })]) {
      const r = run(bad);
      expect(r.code, bad).toBe(1);
      expect(r.output).toContain("Claude returned no triage object");
      expect(graphql(r.calls), bad).toHaveLength(0);
      expect(comments(r.calls), bad).toHaveLength(0);
    }
  });

  it("writes nothing when a value is not an option on the board", () => {
    const r = run({ ...RESULT, area: "docs" });
    expect(r.code).toBe(1);
    expect(r.output).toContain("'docs' is not an option of Area");
    expect(updates(r.calls)).toHaveLength(0);
    expect(comments(r.calls)).toHaveLength(0);
  });

  it("matches option names without case", () => {
    const r = run({ ...RESULT, priority: "P0", complexity: "HIGH" });
    expect(r.code, r.output).toBe(0);
    expect(updates(r.calls)[0].text).toContain(optionId("Priority", "P0"));
    expect(updates(r.calls)[2].text).toContain(optionId("Complexity", "High"));
  });

  it("does not comment when a field write fails", () => {
    const r = run(RESULT, { failures: [{ match: "updateProjectV2ItemFieldValue" }] });
    expect(r.code).toBe(1);
    expect(comments(r.calls)).toHaveLength(0);
  });

  it("refuses a pull request number before calling Claude or the board", () => {
    const r = run(RESULT, { otherResponse: JSON.stringify({ number: 8, pull_request: { url: "x" } }) });
    expect(r.code).toBe(1);
    expect(r.output).toContain("is a pull request");
    expect(graphql(r.calls)).toHaveLength(0);
  });
});
