import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runAction } from "./utils";
import type * as CoreType from "@actions/core";

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

    beforeEach(async () => {
        const coreModule = await import("@actions/core");
        core = coreModule;
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
});
