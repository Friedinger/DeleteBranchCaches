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
  responses: CacheEntry[] | CacheEntry[][],
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

export function makeActionsMocks(responses: CacheEntry[] | CacheEntry[][]) {
  let getActionsCacheList: ReturnType<typeof vi.fn>;

  if (
    Array.isArray(responses) &&
    responses.length &&
    Array.isArray(responses[0])
  ) {
    getActionsCacheList = vi.fn();
    for (const caches of responses as CacheEntry[][]) {
      getActionsCacheList.mockResolvedValueOnce({
        data: {
          total_count: caches.length,
          actions_caches: caches,
        },
      });
    }
  } else {
    const caches = responses as CacheEntry[];
    getActionsCacheList = vi.fn().mockResolvedValue({
      data: { total_count: caches.length, actions_caches: caches },
    });
  }

  const deleteActionsCacheById = vi.fn().mockResolvedValue({});

  return { getActionsCacheList, deleteActionsCacheById };
}
