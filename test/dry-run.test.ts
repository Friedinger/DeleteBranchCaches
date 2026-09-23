import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setupOctokitMocks } from "./utils";
import type * as CoreType from "@actions/core";
import type { Octokit } from "@octokit/rest";
import { main } from "../src/main";

vi.mock("@actions/core");
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

describe("dry-run mode", () => {
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

  it("lists all caches and does not delete them in dry-run", async () => {
    const { getActionsCacheList, deleteActionsCacheById } = setupOctokitMocks(
      octokit,
      [
        { id: 1, size_in_bytes: 100 },
        { id: 2, size_in_bytes: 200 },
      ],
    );

    vi.spyOn(core, "getInput").mockImplementation((name: string) => {
      if (name === "ref") return "refs/heads/main";
      if (name === "dry-run") return "true";
      return "";
    });

    await main();

    expect(getActionsCacheList).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "test-owner",
        repo: "test-repo",
        ref: "refs/heads/main",
      }),
    );

    expect(deleteActionsCacheById).not.toHaveBeenCalled();

    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining("🧹 Would delete cache 1"),
    );
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining("🧹 Would delete cache 2"),
    );
    expect(core.info).toHaveBeenCalledWith(
      "🚫 Dry run: would delete 2 caches with a total size of 300 B.",
    );
  });

  it("uses fallback 0 when cache.size_in_bytes is undefined in dry-run", async () => {
    const { getActionsCacheList, deleteActionsCacheById } = setupOctokitMocks(
      octokit,
      [{ id: 1, size_in_bytes: 100 }, { id: 2 }],
    );

    vi.spyOn(core, "getInput").mockImplementation((name: string) => {
      if (name === "ref") return "refs/heads/main";
      if (name === "dry-run") return "true";
      return "";
    });

    await main();

    expect(getActionsCacheList).toHaveBeenCalled();
    expect(deleteActionsCacheById).not.toHaveBeenCalled();
    expect(core.info).toHaveBeenCalledWith(
      "🚫 Dry run: would delete 2 caches with a total size of 100 B.",
    );
  });
});
