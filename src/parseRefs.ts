import yaml from "yaml";

export function parseRefs(refsInput: string): string[] {
  const refsParsed = yaml.parse(refsInput);
  if (Array.isArray(refsParsed)) {
    return refsParsed
      .map((ref) => String(ref).trim())
      .filter((ref) => ref.length > 0);
  } else if (typeof refsParsed === "string") {
    return [refsParsed.trim()];
  } else {
    throw new TypeError("ref input must be a string or array");
  }
}
