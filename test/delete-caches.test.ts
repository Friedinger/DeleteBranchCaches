import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setupOctokitMocks, runAction } from "./utils";
import type * as CoreType from "@actions/core";
import type { Octokit as OctokitType } from "@octokit/rest";

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
    let octokit: typeof OctokitType;

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

    it("calls delete for each cache and reports sizes", async () => {
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
            "✅ Deleted 2 caches with a total size of 300.00 B."
        );
    });
});
