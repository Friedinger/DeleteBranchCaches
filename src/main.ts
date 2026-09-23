import * as core from "@actions/core";
import { Octokit } from "@octokit/rest";
import { formatSize } from "./formatter";
import { deleteCachesForRef } from "./deleteCaches";
import { parseInputs } from "./inputs";
import packageJson from "../package.json";

export async function main(): Promise<void> {
  const { token, refs, failOnWarning, dryRun } = parseInputs();
  const octokit = new Octokit({ auth: token });
  core.info(`🛠️ Running Friedinger/DeleteBranchCaches@v${packageJson.version}`);

  let deletedSize = 0;
  let totalCaches = 0;
  let warningsCount = 0;
  for (const ref of refs) {
    const { size, count, warnings } = await deleteCachesForRef(
      ref,
      dryRun,
      octokit,
    );
    deletedSize += size;
    totalCaches += count;
    warningsCount += warnings;
  }
  core.info(
    `${dryRun ? "🚫 Dry run: would delete" : "✅ Deleted"} ${totalCaches} cache${
      totalCaches === 1 ? "" : "s"
    } with a total size of ${formatSize(deletedSize)}.`,
  );
  if (failOnWarning && warningsCount > 0) {
    core.setFailed("⚠️ Action failed due to warning(s).");
  }
}
