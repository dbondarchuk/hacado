/** Glob-style matching: `*` matches any substring (including across `.`). */
export function eventPatternMatches(
  pattern: string,
  eventType: string,
): boolean {
  if (pattern === "*") {
    return true;
  }
  const regex = new RegExp(
    `^${pattern
      .split("*")
      .map((segment) => segment.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
      .join(".*")}$`,
  );
  return regex.test(eventType);
}
