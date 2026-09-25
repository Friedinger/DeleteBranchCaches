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

describe("key-filter", () => {
  let core: typeof CoreType;
  let octokit: typeof Octokit;

  beforeEach(async () => {
    core = await import("@actions/core");
    octokit = (await import("@octokit/rest")).Octokit;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  function mockInputs(overrides: Record<string, string> = {}) {
    vi.spyOn(core, "getInput").mockImplementation((name: string) => {
      if (name === "ref") return overrides.ref ?? "refs/heads/main";
      if (name === "key-filter") return overrides["key-filter"] ?? "";
      if (name === "dry-run") return overrides["dry-run"] ?? "";
      return "";
    });
  }

  it("deletes only caches matching the key-filter", async () => {
    const { getActionsCacheList, deleteActionsCacheById } = setupOctokitMocks(
      octokit,
      [
        { id: 1, key: "npm-1", size_in_bytes: 100 },
        { id: 2, key: "build-2", size_in_bytes: 200 },
      ],
    );

    mockInputs({ "key-filter": "npm-*" });

    await main();

    expect(getActionsCacheList).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "test-owner",
        repo: "test-repo",
        ref: "refs/heads/main",
      }),
    );

    expect(deleteActionsCacheById).toHaveBeenCalledTimes(1);
    expect(deleteActionsCacheById).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      cache_id: 1,
    });
    expect(core.info).toHaveBeenCalledWith(
      "✅ Deleted 1 cache with a total size of 100 B.",
    );
  });

  it("deletes nothing when no key matches", async () => {
    const { deleteActionsCacheById } = setupOctokitMocks(octokit, [
      { id: 1, key: "npm-1", size_in_bytes: 100 },
    ]);

    mockInputs({ "key-filter": "build-*" });

    await main();

    expect(deleteActionsCacheById).not.toHaveBeenCalled();
    expect(core.info).toHaveBeenCalledWith(
      "✅ Deleted 0 caches with a total size of 0 B.",
    );
  });

  it("treats a pattern without wildcard as exact match", async () => {
    const { deleteActionsCacheById } = setupOctokitMocks(octokit, [
      { id: 1, key: "npm-1", size_in_bytes: 100 },
      { id: 2, key: "npm-10", size_in_bytes: 200 },
    ]);

    mockInputs({ "key-filter": "npm-1" });

    await main();

    expect(deleteActionsCacheById).toHaveBeenCalledTimes(1);
    expect(deleteActionsCacheById).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      cache_id: 1,
    });
  });

  it("combines with dry-run", async () => {
    const { deleteActionsCacheById } = setupOctokitMocks(octokit, [
      { id: 1, key: "npm-1", size_in_bytes: 100 },
      { id: 2, key: "build-2", size_in_bytes: 200 },
      { id: 3 },
    ]);

    mockInputs({ "key-filter": "npm-*", "dry-run": "true" });

    await main();

    expect(deleteActionsCacheById).not.toHaveBeenCalled();
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining("🧹 Would delete cache 1"),
    );
    expect(core.info).toHaveBeenCalledWith(
      "🚫 Dry run: would delete 1 cache with a total size of 100 B.",
    );
  });
});
