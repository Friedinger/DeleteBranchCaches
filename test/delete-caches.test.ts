import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setupOctokitMocks, runAction } from "./utils";
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

describe("delete caches", () => {
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

    it("calls delete for single cache and reports size", async () => {
        const { getActionsCacheList, deleteActionsCacheById } =
            setupOctokitMocks(octokit, [{ id: 1, size_in_bytes: 123 }]);

        vi.spyOn(core, "getInput").mockImplementation((name: string) => {
            if (name === "ref") return "refs/heads/main";
            return "";
        });

        await runAction();

        expect(getActionsCacheList).toHaveBeenCalledWith({
            owner: "test-owner",
            repo: "test-repo",
            ref: "refs/heads/main",
        });

        expect(deleteActionsCacheById).toHaveBeenCalledTimes(1);
        expect(core.info).toHaveBeenCalledWith(
            "✅ Deleted 1 cache with a total size of 123 B."
        );
    });

    it("calls delete for multiple caches and reports sizes", async () => {
        const { getActionsCacheList, deleteActionsCacheById } =
            setupOctokitMocks(octokit, [
                { id: 1, size_in_bytes: 100 },
                { id: 2, size_in_bytes: 200 },
            ]);

        vi.spyOn(core, "getInput").mockImplementation((name: string) => {
            if (name === "ref") return "refs/heads/main";
            return "";
        });

        await runAction();

        expect(getActionsCacheList).toHaveBeenCalledWith({
            owner: "test-owner",
            repo: "test-repo",
            ref: "refs/heads/main",
        });

        expect(deleteActionsCacheById).toHaveBeenCalledTimes(2);
        expect(core.info).toHaveBeenCalledWith(
            "✅ Deleted 2 caches with a total size of 300 B."
        );
    });

    it("uses fallback 0 when cache.size_in_bytes is undefined", async () => {
        const { getActionsCacheList, deleteActionsCacheById } =
            setupOctokitMocks(octokit, [
                { id: 1 },
                { id: 2, size_in_bytes: 200 },
            ]);

        vi.spyOn(core, "getInput").mockImplementation((name: string) => {
            if (name === "ref") return "refs/heads/main";
            return "";
        });

        await runAction();

        expect(getActionsCacheList).toHaveBeenCalledWith({
            owner: "test-owner",
            repo: "test-repo",
            ref: "refs/heads/main",
        });

        expect(deleteActionsCacheById).toHaveBeenCalledTimes(2);

        expect(core.info).toHaveBeenCalledWith(
            "✅ Deleted 2 caches with a total size of 200 B."
        );
    });
});
