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

const HOUR = 60 * 60 * 1000;

describe("max-age", () => {
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

  it("keeps caches below max-age and deletes older ones", async () => {
    const now = Date.now();
    const { deleteActionsCacheById } = setupOctokitMocks(octokit, [
      {
        id: 1,
        size_in_bytes: 100,
        created_at: new Date(now - HOUR / 2).toISOString(),
      },
      {
        id: 2,
        size_in_bytes: 100,
        created_at: new Date(now - 2 * HOUR).toISOString(),
      },
      { id: 3, size_in_bytes: 100 },
    ]);

    vi.spyOn(core, "getInput").mockImplementation((name: string) => {
      if (name === "ref") return "refs/heads/main";
      if (name === "max-age") return "1h";
      return "";
    });

    await main();

    expect(deleteActionsCacheById).toHaveBeenCalledTimes(1);
    expect(deleteActionsCacheById).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      cache_id: 2,
    });
    expect(core.info).toHaveBeenCalledWith(
      "🗄️ Kept 2 caches with age below max-age.",
    );
    expect(core.info).toHaveBeenCalledWith(
      "✅ Deleted 1 cache with a total size of 100 B.",
    );
  });

  it("uses last_accessed_at when available", async () => {
    const now = Date.now();
    const { deleteActionsCacheById } = setupOctokitMocks(octokit, [
      {
        id: 3,
        size_in_bytes: 100,
        created_at: new Date(now - 2 * HOUR).toISOString(),
        last_accessed_at: new Date(now - HOUR / 2).toISOString(),
      },
    ]);

    vi.spyOn(core, "getInput").mockImplementation((name: string) => {
      if (name === "ref") return "refs/heads/main";
      if (name === "max-age") return "1h";
      return "";
    });

    await main();

    expect(deleteActionsCacheById).toHaveBeenCalledTimes(0);
    expect(core.info).toHaveBeenCalledWith(
      "🗄️ Kept 1 cache with age below max-age.",
    );
  });

  it("fails on invalid max-age input", async () => {
    vi.spyOn(core, "getInput").mockImplementation((name: string) => {
      if (name === "ref") return "refs/heads/main";
      if (name === "max-age") return "abc";
      return "";
    });

    await expect(main()).rejects.toThrow("Invalid max-age");
  });
});
