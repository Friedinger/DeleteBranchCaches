import { describe, it, expect } from "vitest";
import { formatDate, formatSize } from "../src/formatter";

describe("formatter", () => {
    it("formatDate returns readable string without commas", () => {
        const result = formatDate("2020-01-02T03:04:05.000Z");
        expect(typeof result).toBe("string");
        expect(result).not.toContain(",");
    });

    it("formatSize shows decimals only when needed", () => {
        expect(formatSize(100)).toBe("100 B");
        expect(formatSize(1024)).toBe("1 KB");
        expect(formatSize(1536)).toBe("1.5 KB");
        expect(formatSize(1234)).toBe("1.21 KB");
    });

    it("formatSize formats with all units", () => {
        const units: Array<{ bytes: number; expected: string }> = [
            { bytes: 100, expected: "100 B" },
            { bytes: 1024, expected: "1 KB" },
            { bytes: 1024 ** 2, expected: "1 MB" },
            { bytes: 1024 ** 3, expected: "1 GB" },
            { bytes: 1024 ** 4, expected: "1 TB" },
        ];

        for (const u of units) {
            expect(formatSize(u.bytes)).toBe(u.expected);
        }
    });
});
