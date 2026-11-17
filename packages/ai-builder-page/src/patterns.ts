import type { TEditorBlock } from "@hacado/builder/editor";
import {
  buildDocumentSectionPatterns,
  buildDocumentStructure,
} from "@hacado/ai-builder-core";

/**
 * v1 pattern discovery: live document section signatures.
 * Built-in template search can be layered later without prompt hardcoding.
 */
export function searchLiveDesignPatterns(input: {
  document: TEditorBlock;
  query: string;
  limit?: number;
}) {
  const structure = buildDocumentStructure(input.document);
  const patterns = buildDocumentSectionPatterns(structure);
  const query = input.query.toLowerCase();
  const matched = patterns.filter(
    (pattern) =>
      pattern.signature.toLowerCase().includes(query) ||
      pattern.type.toLowerCase().includes(query) ||
      (pattern.summary ?? "").toLowerCase().includes(query),
  );

  return {
    source: "live-document" as const,
    patterns: (matched.length ? matched : patterns).slice(0, input.limit ?? 5),
    hint: "Use cloneBlockForInsert on a matching section id to reuse real structure and styles.",
  };
}
