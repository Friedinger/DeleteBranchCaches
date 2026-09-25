import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setupOctokitMocks } from "./utils";
import type * as CoreType from "@actions/core";
import type { Octokit } from "@octokit/rest";
import { main } from "../src/main";

vi.mock("@actions/core");
vi.mock("../src/summary");
vi.mock("@actions/github", () => ({
  context: {
    repo: {
      owner: "test-owner",
      repo: "test-repo",
    },
  },
}));
vi.mock("@octokit/rest");
vi.mock("../package.json", () => ({
  default: {
    version: "1.0.0",
  },
}));

describe("pagination", () => {
  let core: typeof CoreType;
  let octokit: typeof Octokit;

  beforeEach(async () => {
    const coreModule = await import("@actions/core");
    core = coreModule;
    const octokitModule = await import("@octokit/rest");
    octokit = octokitModule.Octokit;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("deletes caches across multiple pages", async () => {
    const caches = Array.from({ length: 130 }, (_, i) => ({
      id: i + 1,
      size_in_bytes: 100,
    }));
    const { getActionsCacheList, deleteActionsCacheById } = setupOctokitMocks(
      octokit,
      caches,
    );

    vi.spyOn(core, "getInput").mockImplementation((name: string) => {
      if (name === "ref") return "refs/heads/main";
      return "";
    });

    await main();

    expect(getActionsCacheList).toHaveBeenCalledTimes(2);
    expect(getActionsCacheList).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        owner: "test-owner",
        repo: "test-repo",
        ref: "refs/heads/main",
        per_page: 100,
        page: 1,
      }),
    );
    expect(getActionsCacheList).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        owner: "test-owner",
        repo: "test-repo",
        ref: "refs/heads/main",
        per_page: 100,
        page: 2,
      }),
    );
    expect(deleteActionsCacheById).toHaveBeenCalledTimes(130);
    expect(core.info).toHaveBeenCalledWith(
      "✅ Deleted 130 caches with a total size of 12.7 KB.",
    );
  });
});
