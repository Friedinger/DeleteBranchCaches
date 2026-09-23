const MULTIPLIERS: Record<string, number> = {
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function parseMaxAge(input: string): number | undefined {
  if (input === "") return undefined;
  const match = /^(\d+)([mhd])$/i.exec(input);
  if (!match) {
    throw new Error(
      `Invalid max-age "${input}". Expected a number followed by m, h or d (e.g. 7d, 24h, 30m).`,
    );
  }
  return Number(match[1]) * MULTIPLIERS[match[2].toLowerCase()];
}
