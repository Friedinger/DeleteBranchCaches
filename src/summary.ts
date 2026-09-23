import * as core from "@actions/core";
import * as github from "@actions/github";
import type { Octokit } from "@octokit/rest";
import { formatSize } from "./formatter";
import type { DeleteRefResult } from "./deleteCaches";

export const CACHE_LIMIT_BYTES = 10 * 1024 ** 3;

export interface CacheUsage {
  sizeBytes: number;
}

export async function getCacheUsage(octokit: Octokit): Promise<CacheUsage> {
  const { data } = await octokit.rest.actions.getActionsCacheUsage({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
  });
  return {
    sizeBytes: data.active_caches_size_in_bytes ?? 0,
  };
}

export function buildSummary(
  refs: string[],
  results: DeleteRefResult[],
  usage: CacheUsage | undefined,
  dryRun: boolean,
): string {
  const lines = [
    `### Cache cleanup${dryRun ? " (dry run)" : ""}`,
    "",
    "| Ref | Found | Deleted | Freed |",
    "|---|---|---|---|",
  ];
  let totalSize = 0;
  let totalFound = 0;
  let totalDeleted = 0;
  refs.forEach((ref, i) => {
    const result = results[i];
    totalSize += result.size;
    totalFound += result.found;
    totalDeleted += result.count;
    lines.push(
      `| ${ref} | ${result.found} | ${result.count} | ${formatSize(result.size)} |`,
    );
  });
  lines.push(
    `| **Total** | ${totalFound} | ${totalDeleted} | ${formatSize(totalSize)} |`,
  );
  if (usage !== undefined) {
    lines.push(
      "",
      `Repo cache usage: ${formatSize(usage.sizeBytes)} / ${formatSize(CACHE_LIMIT_BYTES)}`,
    );
  }
  return lines.join("\n");
}

export async function writeSummary(summary: string): Promise<void> {
  try {
    await core.summary.addRaw(summary).write();
  } catch {
    // No GITHUB_STEP_SUMMARY available, skip the step summary.
  }
}
