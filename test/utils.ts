import { Octokit } from "@octokit/rest";
import { vi } from "vitest";

export interface CacheEntry {
  id: number;
  size_in_bytes?: number;
}

export async function runAction() {
  await import("../src/index");
}

export function setupOctokitMocks(
  octokit: typeof Octokit,
  caches: CacheEntry[],
) {
  const { getActionsCacheList, deleteActionsCacheById } =
    makeActionsMocks(caches);
  vi.mocked(octokit).mockImplementation(function () {
    return {
      rest: {
        actions: {
          getActionsCacheList,
          deleteActionsCacheById,
        },
      },
    };
  });
  return { getActionsCacheList, deleteActionsCacheById };
}

export function makeActionsMocks(caches: CacheEntry[]) {
  const getActionsCacheList = vi.fn().mockResolvedValue({
    data: { total_count: caches.length, actions_caches: caches },
  });
  const deleteActionsCacheById = vi.fn().mockResolvedValue({});

  return { getActionsCacheList, deleteActionsCacheById };
}
