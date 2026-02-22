import { vi } from "vitest";

export type CacheEntry = { id: number; size_in_bytes?: number };

export const runAction = async () => {
  await import("../src/index");
};

export const setupOctokitMocks = (
  octokit: any,
  responses: Array<CacheEntry> | Array<Array<CacheEntry>>,
) => {
  const { getActionsCacheList, deleteActionsCacheById } = makeActionsMocks(
    responses as any,
  );
  vi.mocked(octokit).mockImplementation(function (): any {
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
};

export const makeActionsMocks = (
  responses: Array<CacheEntry> | Array<Array<CacheEntry>>,
) => {
  let getActionsCacheList: any;

  if (
    Array.isArray(responses) &&
    responses.length &&
    Array.isArray(responses[0])
  ) {
    getActionsCacheList = vi.fn();
    for (const caches of responses as Array<Array<any>>) {
      getActionsCacheList.mockResolvedValueOnce({
        data: {
          total_count: caches.length,
          actions_caches: caches,
        },
      });
    }
  } else {
    const caches = responses as Array<any>;
    getActionsCacheList = vi.fn().mockResolvedValue({
      data: { total_count: caches.length, actions_caches: caches },
    });
  }

  const deleteActionsCacheById = vi.fn().mockResolvedValue({});

  return { getActionsCacheList, deleteActionsCacheById };
};
