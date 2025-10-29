import { describe, it, expect } from "vitest";
import { formatDate, formatSize } from "../src/formatter";

describe("formatter", () => {
    it("formatDate returns readable string without commas", () => {
        const result = formatDate("2020-01-02T03:04:05.000Z");
        expect(typeof result).toBe("string");
        expect(result).not.toContain(",");
    });

    it("formatSize formats bytes to B", () => {
        expect(formatSize(100)).toBe("100.00 B");
    });

    it("formatSize formats to KB and MB correctly", () => {
        expect(formatSize(1024)).toBe("1.00 KB");
        expect(formatSize(1024 * 1024)).toBe("1.00 MB");
    });
});
