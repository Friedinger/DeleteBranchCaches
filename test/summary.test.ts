import { afterEach, describe, expect, it, vi } from "vitest";
import { Octokit } from "@octokit/rest";
import * as core from "@actions/core";
import { buildSummary, getCacheUsage, writeSummary } from "../src/summary";
import type { DeleteRefResult } from "../src/deleteCaches";

vi.mock("@actions/core", () => ({
  summary: {
    addRaw: vi.fn().mockReturnThis(),
    write: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock("@actions/github", () => ({
  context: {
    repo: {
      owner: "test-owner",
      repo: "test-repo",
    },
  },
}));

const results: DeleteRefResult[] = [
  { size: 1024, count: 2, warnings: 0, found: 2 },
  { size: 512, count: 1, warnings: 1, found: 1 },
];
const usage = { sizeBytes: 2048 };

describe("buildSummary", () => {
  it("renders per-ref table with total and usage", () => {
    const md = buildSummary(["feature/a", "feature/b"], results, usage, false);
    expect(md).toContain("### Cache cleanup");
    expect(md).toContain("| Ref | Found | Deleted | Freed |");
    expect(md).toContain("| feature/a | 2 | 2 | 1 KB |");
    expect(md).toContain("| feature/b | 1 | 1 | 512 B |");
    expect(md).toContain("| **Total** | 3 | 3 | 1.5 KB |");
    expect(md).toContain("Repo cache usage: 2 KB / 10 GB");
    expect(
      md.endsWith(
        "> Notice: The repository cache limit may be higher, and usage data may be delayed.",
      ),
    ).toBe(true);
  });

  it("marks the summary as dry run and labels prospective results", () => {
    const md = buildSummary(["feature/a"], [results[0]], usage, true);
    expect(md).toContain("### Cache cleanup (dry run)");
    expect(md).toContain("| Ref | Found | Would delete | Would free |");
  });

  it("omits usage when unavailable", () => {
    const md = buildSummary(["feature/a"], [results[0]], undefined, false);
    expect(md).not.toContain("Repo cache usage");
  });

  it("escapes pipe characters in refs", () => {
    const md = buildSummary(["feature|test"], [results[0]], undefined, false);
    expect(md).toContain("| feature\\|test | 2 | 2 | 1 KB |");
  });
});

describe("getCacheUsage", () => {
  it("returns the active cache size from the usage response", async () => {
    const octokit = {
      rest: {
        actions: {
          getActionsCacheUsage: vi.fn().mockResolvedValue({
            data: {
              full_name: "test-owner/test-repo",
              active_caches_size_in_bytes: 2048,
              active_caches_count: 3,
            },
          }),
        },
      },
    } as unknown as Octokit;
    await expect(getCacheUsage(octokit)).resolves.toEqual(usage);
    const octokitMock = vi.mocked(
      (
        octokit as unknown as {
          rest: {
            actions: { getActionsCacheUsage: ReturnType<typeof vi.fn> };
          };
        }
      ).rest.actions.getActionsCacheUsage,
    );
    expect(octokitMock).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
    });
  });

  it("propagates failures", async () => {
    const octokit = {
      rest: {
        actions: {
          getActionsCacheUsage: vi.fn().mockRejectedValue(new Error("nope")),
        },
      },
    } as unknown as Octokit;
    await expect(getCacheUsage(octokit)).rejects.toThrow("nope");
  });

  it("falls back to 0 when fields are missing", async () => {
    const octokit = {
      rest: {
        actions: {
          getActionsCacheUsage: vi.fn().mockResolvedValue({ data: {} }),
        },
      },
    } as unknown as Octokit;
    await expect(getCacheUsage(octokit)).resolves.toEqual({ sizeBytes: 0 });
  });
});

describe("writeSummary", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("writes the summary via core summary without a real summary file", async () => {
    const md = "### Cache cleanup";
    await writeSummary(md);
    expect(core.summary.addRaw).toHaveBeenCalledWith(md, true);
    expect(core.summary.write).toHaveBeenCalled();
  });

  it("propagates write failures", async () => {
    vi.mocked(core.summary.write).mockRejectedValueOnce(
      new Error("write failed"),
    );
    await expect(writeSummary("### Cache cleanup")).rejects.toThrow(
      "write failed",
    );
  });
});
