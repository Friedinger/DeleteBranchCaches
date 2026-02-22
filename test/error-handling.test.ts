import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runAction, setupOctokitMocks } from "./utils";
import type * as CoreType from "@actions/core";
import type { Octokit } from "@octokit/rest";

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

describe("error handling", () => {
  let core: typeof CoreType;
  let octokit: typeof Octokit;

  beforeEach(async () => {
    const coreModule = await import("@actions/core");
    core = coreModule;
    const octokitModule = await import("@octokit/rest");
    octokit = octokitModule.Octokit;
  });

  afterEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
  });

  it("should fail if main function throws", async () => {
    vi.spyOn(core, "getInput").mockImplementation((name: string) => {
      if (name === "ref") throw new Error("Test error");
      return "";
    });

    await runAction();

    expect(core.setFailed).toHaveBeenCalledWith("❌ Test error");
  });

  it("warns when cache.id is missing and does not call delete API", async () => {
    const { deleteActionsCacheById } = setupOctokitMocks(octokit, [
      { id: undefined, size_in_bytes: 100 } as any,
    ]);

    vi.spyOn(core, "getInput").mockImplementation((name: string) => {
      if (name === "ref") return "refs/heads/main";
      return "";
    });

    await runAction();

    expect(deleteActionsCacheById).not.toHaveBeenCalled();
    expect(core.warning).toHaveBeenCalledWith(
      `⚠️ Could not delete cache ${undefined}: Error: Missing cache.id`,
    );
  });
});
