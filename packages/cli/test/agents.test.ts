import { describe, expect, it } from "vitest";
import { AGENTS } from "../src/agents.js";
import { DOOR_10 } from "./door10.js";

describe("agents table", () => {
  it("agents table matches door 10: eight ids with their literal project and global paths", () => {
    expect(AGENTS.map((a) => ({ id: a.id, project: a.projectDir, global: a.globalDir }))).toEqual(DOOR_10);
    expect(DOOR_10).toHaveLength(8);
  });
});
