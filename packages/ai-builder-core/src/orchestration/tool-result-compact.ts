const MAX_TOOL_RESULT_CHARS = 8_000;

/** Structural trees must stay intact so the model can propose add-block. */
const UNCOMPACTED_TOOLS = new Set([
  "cloneBlockForInsert",
  "getBlocksByIds",
  "proposeDocumentOperations",
  "proposeDocumentSettings",
  "askUser",
]);

/** Keep tool transcripts from blowing up multi-iteration prompt size. */
export function compactToolResult(result: unknown, toolName?: string): string {
  const raw = JSON.stringify(result ?? null);

  if (toolName && UNCOMPACTED_TOOLS.has(toolName)) {
    return raw;
  }

  if (raw.length <= MAX_TOOL_RESULT_CHARS) return raw;

  return JSON.stringify({
    truncated: true,
    toolName,
    originalChars: raw.length,
    preview: raw.slice(0, MAX_TOOL_RESULT_CHARS),
    hint: "Result truncated. For section trees use cloneBlockForInsert (not truncated) then proposeDocumentOperations.",
  });
}
