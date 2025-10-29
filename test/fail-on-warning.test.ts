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

    const cases = [
        {
            name: "fail-on-warning true",
            failOnWarning: "true",
            shouldFail: true,
        },
        {
            name: "fail-on-warning false",
            failOnWarning: "false",
            shouldFail: false,
        },
    ];

    it.each(cases)("%s", async (c) => {
        const { deleteActionsCacheById } = setupOctokitMocks(octokit, [
            { id: 1, size_in_bytes: 100 },
        ]);
        deleteActionsCacheById.mockRejectedValue(new Error("Deletion failed"));

        vi.spyOn(core, "getInput").mockImplementation((name: string) => {
            if (name === "ref") return "refs/heads/main";
            if (name === "fail-on-warning") return c.failOnWarning;
            return "";
        });

        await runAction();

        if (c.shouldFail) {
            expect(core.setFailed).toHaveBeenCalledWith(
                "⚠️ Action failed due to warning(s)."
            );
        } else {
            expect(core.setFailed).not.toHaveBeenCalled();
            expect(core.warning).toHaveBeenCalledWith(
                "⚠️ Could not delete cache 1: Error: Deletion failed"
            );
        }
    });
});
