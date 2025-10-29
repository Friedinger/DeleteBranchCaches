import { describe, it, expect } from "vitest";
import { formatDate, formatSize } from "../src/formatter";

describe("formatter", () => {
    it("formatDate returns readable string without commas", () => {
        const result = formatDate("2020-01-02T03:04:05.000Z");
        expect(result).toBe("2020-01-02 03:04:05");
    });

    it("formatSize shows decimals only when needed", () => {
        expect(formatSize(100)).toBe("100 B");
        expect(formatSize(1024)).toBe("1 KB");
        expect(formatSize(1536)).toBe("1.5 KB");
        expect(formatSize(1234)).toBe("1.21 KB");
    });

    it.each([
        [100, "100 B"],
        [1024, "1 KB"],
        [1024 ** 2, "1 MB"],
        [1024 ** 3, "1 GB"],
        [1024 ** 4, "1 TB"],
    ])("formatSize unit for %i bytes -> %s", (bytes, expected) => {
        expect(formatSize(bytes as number)).toBe(expected as string);
    });
});
