import * as core from "@actions/core";
import { Octokit } from "@octokit/rest";
import { formatSize } from "./formatter";
import { deleteCachesForRef, type DeleteRefResult } from "./deleteCaches";
import { parseInputs } from "./inputs";
import { buildSummary, getCacheUsage, writeSummary } from "./summary";
import packageJson from "../package.json";

export async function main(): Promise<void> {
  const { token, refs, failOnWarning, dryRun, keyFilter, maxAge } =
    parseInputs();
  const octokit = new Octokit({ auth: token });
  core.info(`🛠️ Running Friedinger/DeleteBranchCaches@v${packageJson.version}`);

  const results: DeleteRefResult[] = [];
  let deletedSize = 0;
  let totalCaches = 0;
  let warningsCount = 0;
  for (const ref of refs) {
    const result = await deleteCachesForRef(
      ref,
      dryRun,
      keyFilter,
      maxAge,
      octokit,
    );
    results.push(result);
    deletedSize += result.size;
    totalCaches += result.count;
    warningsCount += result.warnings;
  }
  core.info(
    `${dryRun ? "🚫 Dry run: would delete" : "✅ Deleted"} ${totalCaches} cache${
      totalCaches === 1 ? "" : "s"
    } with a total size of ${formatSize(deletedSize)}.`,
  );
  let usage;
  try {
    usage = await getCacheUsage(octokit);
  } catch (error) {
    core.warning(`⚠️ Could not fetch repo cache usage: ${error}`);
  }
  await writeSummary(buildSummary(refs, results, usage, dryRun));
  if (failOnWarning && warningsCount > 0) {
    core.setFailed("⚠️ Action failed due to warning(s).");
  }
}
