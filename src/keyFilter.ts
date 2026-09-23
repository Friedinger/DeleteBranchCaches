export function matchesKeyFilter(key: string, pattern: string): boolean {
  const regex = new RegExp(
    `^${pattern.split("*").map(escapeRegex).join(".*")}$`,
  );
  return regex.test(key);
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
