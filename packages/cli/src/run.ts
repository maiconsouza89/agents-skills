import { Command, CommanderError } from "commander";
import { openSession, type CommonOptions } from "./context.js";
import { doctor } from "./commands/doctor.js";
import { install } from "./commands/install.js";
import { list, search } from "./commands/list.js";
import { registry, validate } from "./commands/mirrors.js";
import { remove } from "./commands/remove.js";
import { update } from "./commands/update.js";
import { DEFAULT_REF } from "./download.js";
import { CliError, EXIT_FAILURE, EXIT_OK, EXIT_USAGE, type RunContext } from "./types.js";

export interface RunOptions {
  /** Injected for tests; defaults to the global `fetch`. */
  fetchImpl?: typeof fetch;
  now?: Date;
}

function common(cmd: Command): CommonOptions {
  const o = cmd.optsWithGlobals<{ ref: string; global: boolean }>();
  return { ref: o.ref ?? DEFAULT_REF, global: Boolean(o.global) };
}

function buildProgram(ctx: RunContext, run: RunOptions, result: { code: number }): Command {
  const program = new Command("mass-skills");
  program
    .description("Install Mass Solutions skills with integrity verification and a lockfile")
    .option("--ref <ref>", "git ref of the catalog to read", DEFAULT_REF)
    .option("-g, --global", "use the user-level agent directories and lockfile", false)
    .exitOverride()
    .configureOutput({
      writeOut: (s) => ctx.stdout.write(s),
      writeErr: (s) => ctx.stderr.write(s),
    });

  const session = (cmd: Command) => openSession(ctx, common(cmd), run.fetchImpl, run.now);
  const done = (code: number) => {
    result.code = code;
  };

  program
    .command("list")
    .description("list every skill in the catalog")
    .action(async (_o, cmd: Command) => done(await list(session(cmd))));
  program
    .command("search <term>")
    .description("find skills by name, description or tag")
    .action(async (term: string, _o, cmd: Command) => done(await search(session(cmd), term)));
  program
    .command("install <skills...>")
    .description("download, verify and install skills into agent directories")
    .option("-a, --agent <agents...>", "target agents, or auto", ["auto"])
    .action(async (skills: string[], o: { agent: string[] }, cmd: Command) => done(await install(session(cmd), skills, { agents: o.agent })));
  program
    .command("update")
    .description("reinstall skills whose catalog version is newer, unless edited locally")
    .option("--check", "only print the state of each installed skill", false)
    .option("--force", "overwrite skills that were edited locally", false)
    .action(async (o: { check: boolean; force: boolean }, cmd: Command) => done(await update(session(cmd), { check: o.check, force: o.force })));
  program
    .command("remove <skills...>")
    .description("delete installed skills from every agent recorded in the lockfile")
    .action(async (skills: string[], _o, cmd: Command) => done(await remove(session(cmd), skills)));
  program
    .command("doctor")
    .description("compare the lockfile with what is on disk and in the catalog")
    .action(async (_o, cmd: Command) => done(await doctor(session(cmd))));
  program
    .command("validate [dir]")
    .description("validate a catalog directory (same rules and exit codes as pnpm validate)")
    .action((dir: string | undefined) => done(validate(ctx, dir)));
  program
    .command("registry")
    .description("generate or check skills-registry.json (same as pnpm registry)")
    .option("--check", "fail when the committed registry is out of date", false)
    .option("--root <dir>", "repository root")
    .action((o: { check: boolean; root?: string }) => done(registry(ctx, o)));
  return program;
}

/** Run the CLI in-process. Never calls `process.exit`; returns the exit code of the door 11 contract. */
export async function run(argv: string[], ctx: RunContext, opts: RunOptions = {}): Promise<number> {
  const result = { code: EXIT_OK };
  const program = buildProgram(ctx, opts, result);
  try {
    await program.parseAsync(argv, { from: "user" });
    return result.code;
  } catch (e) {
    if (e instanceof CliError) {
      ctx.stderr.write(`${e.message}\n`);
      return e.exitCode;
    }
    if (e instanceof CommanderError) {
      if (e.code === "commander.helpDisplayed" || e.code === "commander.version" || e.code === "commander.help") return EXIT_OK;
      return EXIT_USAGE;
    }
    ctx.stderr.write(`${(e as Error).message}\n`);
    return EXIT_FAILURE;
  }
}
