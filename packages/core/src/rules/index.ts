import type { Rule } from "../types.js";
import { compatibilityRule, descriptionRule, frontmatterParse, metadataRule, nameRule, unknownKey } from "./frontmatter.js";
import { binaryRule, evalsRule, linksRule, promptInjectionRule, scriptsRule, secretRule, shellRule } from "./content.js";
import { sizeRule } from "./size.js";

export const RULES: ReadonlyArray<Rule> = [
  frontmatterParse,
  unknownKey,
  nameRule,
  descriptionRule,
  metadataRule,
  compatibilityRule,
  binaryRule,
  secretRule,
  shellRule,
  promptInjectionRule,
  scriptsRule,
  sizeRule,
  linksRule,
  evalsRule,
];
