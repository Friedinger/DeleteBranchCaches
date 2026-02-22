import { describe, it, expect } from "vitest";
import { parseRefs } from "../src/parseRefs";

describe("parseRefs", () => {
  it("parses a single ref string", () => {
    expect(parseRefs("refs/heads/main")).toEqual(["refs/heads/main"]);
  });

  it("parses a yaml list of refs", () => {
    const input = `
            - refs/heads/feat-1
            - refs/heads/feat-2
        `;
    expect(parseRefs(input)).toEqual([
      "refs/heads/feat-1",
      "refs/heads/feat-2",
    ]);
  });

  it("parses an inline array", () => {
    expect(parseRefs("[refs/heads/feat-1, refs/heads/feat-2]")).toEqual([
      "refs/heads/feat-1",
      "refs/heads/feat-2",
    ]);
  });

  it("throws on invalid input", () => {
    expect(() => parseRefs("{ not: valid }")).toThrow(TypeError);
  });
});
