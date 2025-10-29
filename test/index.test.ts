import { describe, it, expect, vi, beforeEach } from "vitest";
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

describe("main", () => {
    let core: typeof CoreType;
    let octokit: typeof OctokitType;

    beforeEach(async () => {
        const coreModule = await import("@actions/core");
        core = coreModule;
        const octokitModule = await import("@octokit/rest");
        octokit = octokitModule.Octokit;
        vi.resetAllMocks();
    });

    const runAction = async () => {
        vi.resetModules();
        await import("../src/index");
    };

    const setupOctokitMock = (
        getActionsCacheList: any,
        deleteActionsCacheById: any
    ) => {
        vi.mocked(octokit).mockImplementation(function (): any {
            return {
                rest: {
                    actions: {
                        getActionsCacheList,
                        deleteActionsCacheById,
                    },
                },
            };
        });
    };

    it("should handle single ref", async () => {
        const getActionsCacheList = vi.fn().mockResolvedValue({
            data: {
                total_count: 1,
                actions_caches: [{ id: 1, size_in_bytes: 100 }],
            },
        });
        const deleteActionsCacheById = vi.fn().mockResolvedValue({});
        setupOctokitMock(getActionsCacheList, deleteActionsCacheById);

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
        expect(deleteActionsCacheById).toHaveBeenCalledWith({
            owner: "test-owner",
            repo: "test-repo",
            cache_id: 1,
        });
        expect(core.info).toHaveBeenCalledWith(
            "✅ Deleted 1 cache with a total size of 100.00 B."
        );
    });

    it("should handle multiple refs from yaml", async () => {
        const getActionsCacheList = vi
            .fn()
            .mockResolvedValueOnce({
                data: {
                    total_count: 1,
                    actions_caches: [{ id: 1, size_in_bytes: 100 }],
                },
            })
            .mockResolvedValueOnce({
                data: {
                    total_count: 1,
                    actions_caches: [{ id: 2, size_in_bytes: 200 }],
                },
            });
        const deleteActionsCacheById = vi.fn().mockResolvedValue({});
        setupOctokitMock(getActionsCacheList, deleteActionsCacheById);

        vi.spyOn(core, "getInput").mockImplementation((name: string) => {
            if (name === "ref")
                return `
                - refs/heads/feat-1
                - refs/heads/feat-2
            `;
            return "";
        });

        await runAction();

        expect(getActionsCacheList).toHaveBeenCalledTimes(2);
        expect(getActionsCacheList).toHaveBeenCalledWith({
            owner: "test-owner",
            repo: "test-repo",
            ref: "refs/heads/feat-1",
        });
        expect(getActionsCacheList).toHaveBeenCalledWith({
            owner: "test-owner",
            repo: "test-repo",
            ref: "refs/heads/feat-2",
        });
        expect(deleteActionsCacheById).toHaveBeenCalledTimes(2);
        expect(core.info).toHaveBeenCalledWith(
            "✅ Deleted 2 caches with a total size of 300.00 B."
        );
    });

    it("should handle inline array refs", async () => {
        const getActionsCacheList = vi
            .fn()
            .mockResolvedValueOnce({
                data: {
                    total_count: 1,
                    actions_caches: [{ id: 1, size_in_bytes: 100 }],
                },
            })
            .mockResolvedValueOnce({
                data: {
                    total_count: 1,
                    actions_caches: [{ id: 2, size_in_bytes: 200 }],
                },
            });
        const deleteActionsCacheById = vi.fn().mockResolvedValue({});
        setupOctokitMock(getActionsCacheList, deleteActionsCacheById);

        vi.spyOn(core, "getInput").mockImplementation((name: string) => {
            if (name === "ref") return "[refs/heads/feat-1, refs/heads/feat-2]";
            return "";
        });

        await runAction();

        expect(getActionsCacheList).toHaveBeenCalledTimes(2);
    });

    it("should fail on warning if input is true and a cache deletion fails", async () => {
        const getActionsCacheList = vi.fn().mockResolvedValue({
            data: {
                total_count: 1,
                actions_caches: [{ id: 1, size_in_bytes: 100 }],
            },
        });
        const deleteActionsCacheById = vi
            .fn()
            .mockRejectedValue(new Error("Deletion failed"));
        setupOctokitMock(getActionsCacheList, deleteActionsCacheById);

        vi.spyOn(core, "getInput").mockImplementation((name: string) => {
            if (name === "ref") return "refs/heads/main";
            if (name === "fail-on-warning") return "true";
            return "";
        });

        await runAction();

        expect(core.setFailed).toHaveBeenCalledWith(
            "⚠️ Action failed due to warning(s)."
        );
    });

    it("should not fail on warning if input is false and a cache deletion fails", async () => {
        const getActionsCacheList = vi.fn().mockResolvedValue({
            data: {
                total_count: 1,
                actions_caches: [{ id: 1, size_in_bytes: 100 }],
            },
        });
        const deleteActionsCacheById = vi
            .fn()
            .mockRejectedValue(new Error("Deletion failed"));
        setupOctokitMock(getActionsCacheList, deleteActionsCacheById);

        vi.spyOn(core, "getInput").mockImplementation((name: string) => {
            if (name === "ref") return "refs/heads/main";
            if (name === "fail-on-warning") return "false";
            return "";
        });

        await runAction();

        expect(core.setFailed).not.toHaveBeenCalled();
        expect(core.warning).toHaveBeenCalledWith(
            "⚠️ Could not delete cache 1: Error: Deletion failed"
        );
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
