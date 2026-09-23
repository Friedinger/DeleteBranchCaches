import * as core from "@actions/core";
import { parseRefs } from "./parseRefs";

export function parseInputs() {
  const token = core.getInput("github-token", { required: true });
  const refsInput = core.getInput("ref", { required: true });
  const failOnWarning = core.getInput("fail-on-warning") === "true";
  const dryRun = core.getInput("dry-run") === "true";
  const keyFilter = core.getInput("key-filter");

  return {
    token,
    refs: parseRefs(refsInput),
    failOnWarning,
    dryRun,
    keyFilter,
  };
}
