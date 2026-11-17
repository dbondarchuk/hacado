import type { TEditorBlock } from "@hacado/builder/editor";
import { randomUUID } from "node:crypto";
import type { DocumentStructureNode } from "../types";

function findChildren(data: unknown): TEditorBlock[] {
  if (!data || typeof data !== "object") return [];

  const record = data as Record<string, unknown>;
  const children: TEditorBlock[] = [];

  const maybePush = (value: unknown) => {
    if (!Array.isArray(value)) return;

    for (const item of value) {
      if (
        item &&
        typeof item === "object" &&
        "type" in item &&
        "id" in item &&
        "data" in item
      ) {
        children.push(item as TEditorBlock);
      }
    }
  };

  maybePush(record.children);

  if (Array.isArray(record.cellBlocks)) {
    maybePush(record.cellBlocks);
  }

  if (Array.isArray(record.cells)) {
    for (const cell of record.cells) {
      if (cell && typeof cell === "object") {
        maybePush((cell as Record<string, unknown>).children);
      }
    }
  }

  for (const value of Object.values(record)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      "children" in value
    ) {
      maybePush((value as { children?: unknown }).children);
    }
  }

  return children;
}

function summarizeBlock(block: TEditorBlock): string | undefined {
  const data = block.data as Record<string, unknown> | undefined;
  const props = data?.props as Record<string, unknown> | undefined;

  if (!props) return undefined;

  for (const key of ["text", "title", "heading", "alt", "label", "name"]) {
    const value = props[key];
    if (typeof value === "string" && value.trim()) {
      return value.slice(0, 120);
    }
  }

  return undefined;
}

export function buildDocumentStructure(
  document: TEditorBlock,
): DocumentStructureNode[] {
  const nodes: DocumentStructureNode[] = [];

  const walk = (
    block: TEditorBlock,
    depth: number,
    parentId: string | null,
  ) => {
    const children = findChildren(block.data);
    nodes.push({
      id: block.id,
      type: block.type,
      depth,
      parentId,
      childIds: children.map((child) => child.id),
      summary: summarizeBlock(block),
    });

    for (const child of children) {
      walk(child, depth + 1, block.id);
    }
  };

  walk(document, 0, null);
  return nodes;
}

export type DocumentSectionPattern = {
  id: string;
  type: string;
  summary?: string;
  childTypes: string[];
  signature: string;
};

/**
 * Top-level section signatures from the live document (under PageLayout / root).
 * Teaches invent-from-scratch to match real composition, not skinny Container+Text.
 */
export function buildDocumentSectionPatterns(
  structure: DocumentStructureNode[],
  limit = 12,
): DocumentSectionPattern[] {
  if (!structure.length) return [];

  const byId = new Map(structure.map((node) => [node.id, node]));
  const pageLayout = structure.find((node) => node.type === "PageLayout");
  const emailLayout = structure.find((node) => node.type === "EmailLayout");
  const root = pageLayout ?? emailLayout ?? structure.find((node) => node.depth === 0);
  const sectionIds = root?.childIds ?? [];

  return sectionIds
    .slice(0, limit)
    .flatMap((id): DocumentSectionPattern[] => {
      const node = byId.get(id);

      if (!node) return [];

      const childTypes = node.childIds
        .map((childId) => byId.get(childId)?.type)
        .filter((type): type is string => Boolean(type));

      return [
        {
          id: node.id,
          type: node.type,
          summary: node.summary,
          childTypes,
          signature:
            childTypes.length > 0
              ? `${node.type} > ${childTypes.join(", ")}`
              : node.type,
        },
      ];
    });
}

export function findBlockById(
  document: TEditorBlock,
  blockId: string,
): TEditorBlock | null {
  if (document.id === blockId) return document;

  for (const child of findChildren(document.data)) {
    const found = findBlockById(child, blockId);
    if (found) return found;
  }

  return null;
}

export function findAncestorChain(
  structure: DocumentStructureNode[],
  blockId: string,
): DocumentStructureNode[] {
  const byId = new Map(structure.map((node) => [node.id, node]));
  const chain: DocumentStructureNode[] = [];
  let current = byId.get(blockId);

  while (current?.parentId) {
    const parent = byId.get(current.parentId);
    if (!parent) break;

    chain.unshift(parent);
    current = parent;
  }

  return chain;
}

function remintBlockIds(value: unknown): void {
  if (!value || typeof value !== "object") return;

  if (Array.isArray(value)) {
    for (const item of value) {
      remintBlockIds(item);
    }

    return;
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record.id === "string" &&
    typeof record.type === "string" &&
    "data" in record
  ) {
    record.id = `block-${randomUUID()}`;
  }

  for (const nested of Object.values(record)) {
    remintBlockIds(nested);
  }
}

export function cloneBlockWithNewIds(block: TEditorBlock): TEditorBlock {
  const cloned = JSON.parse(JSON.stringify(block)) as TEditorBlock;
  remintBlockIds(cloned);
  return cloned;
}

export function getBlocksByIds(
  document: TEditorBlock,
  blockIds: string[],
): Array<{ id: string; type: string; data: unknown; found: boolean }> {
  return blockIds.map((blockId) => {
    const block = findBlockById(document, blockId);

    if (!block) {
      return { id: blockId, type: "unknown", data: null, found: false };
    }

    return {
      id: block.id,
      type: block.type,
      data: block.data,
      found: true,
    };
  });
}

export function cloneBlockForInsert(
  document: TEditorBlock,
  blockId: string,
): {
  found: boolean;
  sourceBlockId: string;
  parentBlockId: string | null;
  index: number | null;
  block?: TEditorBlock;
} {
  const structure = buildDocumentStructure(document);
  const node = structure.find((entry) => entry.id === blockId);
  const source = findBlockById(document, blockId);

  if (!node || !source) {
    return {
      found: false,
      sourceBlockId: blockId,
      parentBlockId: null,
      index: null,
    };
  }

  let index: number | null = null;

  if (node.parentId) {
    const parentNode = structure.find((entry) => entry.id === node.parentId);
    const siblingIndex = parentNode?.childIds.indexOf(blockId) ?? -1;
    index = siblingIndex >= 0 ? siblingIndex + 1 : null;
  }

  return {
    found: true,
    sourceBlockId: blockId,
    parentBlockId: node.parentId ?? null,
    index,
    block: cloneBlockWithNewIds(source),
  };
}
