import { beforeEach, describe, expect, it, vi } from "vitest";
import * as core from "@actions/core";

vi.mock("@actions/core", () => ({
  getInput: vi.fn(),
  info: vi.fn(),
  setFailed: vi.fn(),
}));

const mockMain = vi.fn();
vi.mock("../src/main", () => ({
  main: mockMain,
}));

describe("index", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  function runIndex() {
    return import("../src/index");
  }

  it("calls main on import", async () => {
    mockMain.mockResolvedValue(undefined);
    await runIndex();

    expect(mockMain).toHaveBeenCalled();
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("calls setFailed when main rejects", async () => {
    mockMain.mockRejectedValue(new Error("error"));
    await runIndex();

    expect(core.setFailed).toHaveBeenCalledWith("❌ error");
  });
});
