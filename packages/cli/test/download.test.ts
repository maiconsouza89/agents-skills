import { describe, expect, it } from "vitest";
import { baseUrl, DEFAULT_BASE_URL, fileUrl, registryUrl } from "../src/download.js";

describe("download base url", () => {
  it("default base url is the raw github url of the catalog repo with ref main", () => {
    expect(DEFAULT_BASE_URL).toBe("https://raw.githubusercontent.com/maiconsouza89/mass-solutions-skills/");
    expect(baseUrl({})).toBe(DEFAULT_BASE_URL);
    expect(registryUrl({}, "main")).toBe("https://raw.githubusercontent.com/maiconsouza89/mass-solutions-skills/main/skills-registry.json");
    expect(fileUrl({}, "main", "skills/mass-x", "references/a.md")).toBe(
      "https://raw.githubusercontent.com/maiconsouza89/mass-solutions-skills/main/skills/mass-x/references/a.md",
    );
  });

  it("MASS_SKILLS_BASE_URL overrides the base and a ref is inserted after it", () => {
    expect(registryUrl({ MASS_SKILLS_BASE_URL: "http://127.0.0.1:9/" }, "v1")).toBe("http://127.0.0.1:9/v1/skills-registry.json");
    expect(baseUrl({ MASS_SKILLS_BASE_URL: "http://h/base" })).toBe("http://h/base/");
  });
});
