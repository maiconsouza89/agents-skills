export interface Writer {
  write(chunk: string): unknown;
}

/** Everything the CLI reads from its environment, injected so tests run it in-process. */
export interface RunContext {
  cwd: string;
  env: NodeJS.ProcessEnv;
  stdout: Writer;
  stderr: Writer;
}

/** Exit code contract (plan door 11). */
export const EXIT_OK = 0;
/** Execution failure: integrity, network, deprecated, doctor with a problem. */
export const EXIT_FAILURE = 1;
/** Usage error: bad flag, unknown agent or skill, unsafe name. */
export const EXIT_USAGE = 2;

/** A failure the command reports on stderr with the given exit code. */
export class CliError extends Error {
  constructor(message: string, public readonly exitCode: 1 | 2) {
    super(message);
  }
}

export interface LockEntry {
  version: string;
  contentHash: string;
  ref: string;
  agents: string[];
  installedAt: string;
}

export interface Lockfile {
  version: 1;
  skills: Record<string, LockEntry>;
}
