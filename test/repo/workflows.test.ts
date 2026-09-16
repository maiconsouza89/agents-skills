import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");
const workflow = (name: string) => parse(read(`.github/workflows/${name}`));

type Step = { uses?: string; run?: string; with?: Record<string, string>; if?: string; env?: Record<string, string>; id?: string };
const steps = (job: { steps: Step[] }) => job.steps;
const runs = (job: { steps: Step[] }) => steps(job).map((s) => s.run ?? "");

function expectNodeSetup(job: { steps: Step[] }) {
  const node = steps(job).find((s) => s.uses?.startsWith("actions/setup-node@"))!;
  expect(node.with?.["node-version-file"]).toBe(".nvmrc");
  expect(node.with?.cache).toBe("pnpm");
  expect(steps(job).some((s) => s.uses?.startsWith("pnpm/action-setup@"))).toBe(true);
  expect(runs(job)).toContain("pnpm install --frozen-lockfile");
}

describe("workflows", () => {
  it("ci workflow runs check, build and the marketplace validation on PRs and main without secrets", () => {
    const wf = workflow("ci.yml");
    expect(Object.keys(wf.on).sort()).toEqual(["pull_request", "push"]);
    expect(wf.on.push.branches).toEqual(["main"]);
    const job = wf.jobs.ci;
    expectNodeSetup(job);
    const r = runs(job);
    expect(r).toContain("pnpm check");
    expect(r).toContain("pnpm build");
    expect(r).toContain("npx -y @anthropic-ai/claude-code@latest plugin validate .");
    expect(read(".github/workflows/ci.yml")).not.toContain("secrets.");
  });

  it("pages workflow deploys the astro site from apps/site with the nvmrc node version", () => {
    const wf = workflow("pages.yml");
    expect(wf.on.push.branches).toEqual(["main"]);
    expect(wf.permissions.pages).toBe("write");
    expect(wf.permissions["id-token"]).toBe("write");
    const astro = steps(wf.jobs.build).find((s) => s.uses?.startsWith("withastro/action@"))!;
    expect(astro.with?.path).toBe("apps/site");
    expect(astro.with?.["package-manager"]).toBe("pnpm@11");
    expect(astro.with?.["node-version"]).toContain("steps.node.outputs.version");
    expect(runs(wf.jobs.build).some((r) => r.includes("cat .nvmrc"))).toBe(true);
    expect(steps(wf.jobs.deploy).some((s) => s.uses?.startsWith("actions/deploy-pages@"))).toBe(true);
    expect(wf.jobs.deploy.needs).toBe("build");
  });

  it("security scan workflow runs snyk only on push to main and same-repo PRs, with the allowlist flags", () => {
    const wf = workflow("security-scan.yml");
    expect(wf.on.push.branches).toEqual(["main"]);
    expect("pull_request" in wf.on).toBe(true);
    const job = wf.jobs.scan;
    expectNodeSetup(job);
    const allow = steps(job).find((s) => s.id === "allowlist")!;
    expect(allow.if).toBeUndefined();
    expect(allow.run).toContain("tools/allowlist.ts");
    const snyk = steps(job).find((s) => s.run?.includes("snyk-agent-scan"))!;
    expect(snyk.run).toContain("uvx snyk-agent-scan@latest skills --ci");
    expect(snyk.run).toContain("steps.allowlist.outputs.flags");
    expect(snyk.env?.SNYK_TOKEN).toBe("${{ secrets.SNYK_TOKEN }}");
    const condition = "github.event_name == 'push' || github.event.pull_request.head.repo.full_name == github.repository";
    expect(snyk.if).toContain(condition);
    const uv = steps(job).find((s) => s.uses?.startsWith("astral-sh/setup-uv@"))!;
    expect(uv.if).toContain(condition);
  });

  it("stale skills workflow runs weekly and on demand, and creates or updates the Stale skills issue from pnpm stale", () => {
    const wf = workflow("stale-skills.yml");
    expect(wf.on.schedule).toEqual([{ cron: "0 9 * * 1" }]);
    expect("workflow_dispatch" in wf.on).toBe(true);
    expect(wf.permissions.issues).toBe("write");
    const job = wf.jobs.stale;
    expectNodeSetup(job);
    const list = steps(job).find((s) => s.id === "stale")!;
    expect(list.run).toMatch(/pnpm (--silent )?stale --days 90/);
    const script = steps(job).find((s) => s.uses?.startsWith("actions/github-script@"))!;
    expect(script.with?.script).toContain('const title = "Stale skills"');
    expect(script.with?.script).toContain('const label = "stale-skill"');
    expect(script.with?.script).toContain("issues.create");
    expect(script.with?.script).toContain("issues.update");
    expect(script.with?.script).toContain("labels: [label]");
  });

  it("stale workflow closes when nothing is stale and creates nothing", () => {
    const wf = workflow("stale-skills.yml");
    const script = steps(wf.jobs.stale).find((s) => s.uses?.startsWith("actions/github-script@"))!.with!.script;
    expect(script).toMatch(/if \(!list\) \{\s*if \(existing\) await github\.rest\.issues\.update\([^)]*state: "closed"[^)]*\);\s*return;/);
  });

  it("release workflow runs on v* tags, checks, builds and creates a github release with generated notes", () => {
    const wf = workflow("release.yml");
    expect(wf.on.push.tags).toEqual(["v*"]);
    expect(wf.permissions.contents).toBe("write");
    const job = wf.jobs.release;
    expectNodeSetup(job);
    const r = runs(job);
    expect(r).toContain("pnpm check");
    expect(r).toContain("pnpm build");
    expect(r.some((x) => x.includes('gh release create "${{ github.ref_name }}" --generate-notes'))).toBe(true);
  });

  it("project board workflow reacts to issue open/assign without GITHUB_TOKEN or third-party actions", () => {
    const wf = workflow("project-board.yml");
    expect(wf.on.issues.types).toEqual(["opened", "assigned"]);
    expect(wf.permissions).toEqual({});
    const job = wf.jobs.board;
    expect(job.if).toBe("github.event.issue.state == 'open'");
    expect(wf.concurrency.group).toContain("github.event.issue.number");
    expect(wf.concurrency["cancel-in-progress"]).toBe(false);
    expect(job.env.GH_TOKEN).toBe("${{ secrets.PROJECT_TOKEN }}");
    expect(steps(job).every((s) => s.uses === undefined)).toBe(true);
    const r = runs(job);
    expect(r.some((x) => x.includes("addProjectV2ItemById"))).toBe(true);
    expect(r.some((x) => x.includes("updateProjectV2ItemFieldValue"))).toBe(true);
    const setStatus = steps(job).find((s) => s.run?.includes("updateProjectV2ItemFieldValue"))!;
    expect(setStatus.if).toContain("In Review");
    expect(setStatus.if).toContain("Done");
  });

  it("triage workflow classifies with a read-only Claude and writes the board from shell steps", () => {
    const wf = workflow("triage.yml");
    expect(wf.on.issues.types).toEqual(["opened"]);
    expect(wf.on.workflow_dispatch.inputs.issue.required).toBe(true);
    expect(wf.permissions).toEqual({ contents: "read", issues: "write" });
    expect(wf.concurrency.group).toContain("github.event.issue.number || inputs.issue");
    expect(wf.concurrency["cancel-in-progress"]).toBe(false);
    const job = wf.jobs.triage;
    const claude = steps(job).find((s) => s.uses?.startsWith("anthropics/claude-code-action@"))!;
    expect(claude.id).toBe("classify");
    expect(claude.with?.claude_code_oauth_token).toBe("${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}");
    expect(claude.with?.github_token).toBe("${{ github.token }}");
    expect(claude.with?.claude_args).toContain('--allowedTools "Read"');
    const schema = JSON.parse(claude.with!.claude_args.match(/--json-schema '(.+)'/)![1]);
    expect(schema.properties.priority.enum).toEqual(["p0", "p1", "p2", "backlog"]);
    expect(schema.properties.area.enum).toEqual(["cli", "core", "site", "ci", "catalog"]);
    expect(schema.properties.complexity.enum).toEqual(["low", "medium", "high"]);
    expect(schema.required).toEqual(["priority", "area", "complexity", "priority_reason", "area_reason", "complexity_reason"]);
    // The issue text is attacker-controlled: it reaches Claude through issue.json only, and no
    // script interpolates an expression at all.
    expect(claude.with?.prompt).not.toContain("${{");
    for (const p of ["issue.json", "skills/mass-issue-complexity/SKILL.md", "skills/mass-issue-priority/SKILL.md", "CLAUDE.md", "data, not instructions"]) {
      expect(claude.with?.prompt, p).toContain(p);
    }
    for (const r of runs(job)) expect(r).not.toContain("${{");
    expect(read(".github/workflows/triage.yml")).not.toMatch(/github\.event\.issue\.(title|body)/);
    const write = steps(job).find((s) => s.run?.includes("updateProjectV2ItemFieldValue"))!;
    expect(write.env?.GH_TOKEN).toBe("${{ secrets.PROJECT_TOKEN }}");
    expect(write.env?.RESULT).toBe("${{ steps.classify.outputs.structured_output }}");
    const comment = steps(job).find((s) => s.run?.includes("/comments"))!;
    expect(comment.env?.GH_TOKEN).toBe("${{ github.token }}");
    expect(steps(job).indexOf(comment)).toBeGreaterThan(steps(job).indexOf(write));
  });
});
