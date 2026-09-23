import * as core from "@actions/core";
import * as github from "@actions/github";
import type { Octokit } from "@octokit/rest";
import { formatDate, formatSize } from "./formatter";
import { matchesKeyFilter } from "./keyFilter";

type Cache = Awaited<
  ReturnType<Octokit["rest"]["actions"]["getActionsCacheList"]>
>["data"]["actions_caches"][number];

export interface DeleteRefResult {
  size: number;
  count: number;
  warnings: number;
}

export async function deleteCachesForRef(
  ref: string,
  dryRun: boolean,
  keyFilter: string,
  octokit: Octokit,
): Promise<DeleteRefResult> {
  const caches = (
    await octokit.rest.actions.getActionsCacheList({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      ref: ref,
    })
  ).data.actions_caches;
  const filteredCaches = keyFilter
    ? caches.filter((cache) => matchesKeyFilter(cache.key, keyFilter))
    : caches;
  const count = filteredCaches.length;
  let deletedSize = 0;
  let deletedCount = 0;
  let warnings = 0;
  core.info(
    `📦 ${count} cache${count === 1 ? "" : "s"} found for ref "${ref}"`,
  );
  for (const cache of filteredCaches) {
    if (dryRun) {
      core.info(`🧹 Would delete ${formatCache(cache)}`);
      deletedSize += cache.size_in_bytes ?? 0;
      deletedCount++;
      continue;
    }
    const { success, size, warning } = await deleteCache(cache, octokit);
    if (success) deletedCount++;
    deletedSize += size;
    if (warning) warnings++;
  }
  return { size: deletedSize, count: deletedCount, warnings };
}

function formatCache(cache: Cache): string {
  return `cache ${cache.id} with key "${cache.key}" on ref "${
    cache.ref
  }", size ${formatSize(cache.size_in_bytes ?? 0)}, created at ${formatDate(
    cache.created_at ?? "",
  )}`;
}

async function deleteCache(
  cache: Cache,
  octokit: Octokit,
): Promise<{ success: boolean; size: number; warning: boolean }> {
  try {
    if (!cache.id) throw new Error("Missing cache.id");
    await octokit.rest.actions.deleteActionsCacheById({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      cache_id: cache.id,
    });
    core.info(`🗑️ Deleted ${formatCache(cache)}`);
    return { success: true, size: cache.size_in_bytes ?? 0, warning: false };
  } catch (error) {
    core.warning(`⚠️ Could not delete cache ${cache.id}: ${error}`);
    return { success: false, size: 0, warning: true };
  }
}
