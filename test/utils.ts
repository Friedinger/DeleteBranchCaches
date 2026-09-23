import { Octokit } from "@octokit/rest";
import { vi } from "vitest";

export interface CacheEntry {
  id: number;
  key?: string;
  size_in_bytes?: number;
  created_at?: string;
  last_accessed_at?: string;
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
  const getActionsCacheList = vi
    .fn()
    .mockImplementation(
      async ({
        page = 1,
        per_page = 30,
      }: { page?: number; per_page?: number } = {}) => ({
        data: {
          total_count: caches.length,
          actions_caches: caches.slice((page - 1) * per_page, page * per_page),
        },
      }),
    );
  const deleteActionsCacheById = vi.fn().mockResolvedValue({});

  return { getActionsCacheList, deleteActionsCacheById };
}
