import type {
  EditorHistoryEntry,
  TEditorBlock,
} from "@hacado/builder/editor-types";
import type { BuilderSchema } from "@hacado/builder/types";
import { matchesRule } from "@hacado/builder/utils";
import type { BlockCatalogEntry } from "../adapters/types";
import { findBlockById } from "../discovery/document-structure";
import type { ValidationIssue, ValidationResult } from "../types";

const PLATE_HEADING_TYPES = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

function plateNodesContainHeading(value: unknown): string | null {
  if (!Array.isArray(value)) return null;

  for (const node of value) {
    if (!node || typeof node !== "object") continue;

    const record = node as Record<string, unknown>;
    const type = record.type;

    if (typeof type === "string" && PLATE_HEADING_TYPES.has(type)) {
      return type;
    }

    const nested = plateNodesContainHeading(record.children);

    if (nested) return nested;
  }

  return null;
}

/** Page Text is body copy; titles belong in Heading blocks. */
function assertPageTextComposition(
  block: TEditorBlock,
  issues: ValidationIssue[],
) {
  if (block.type !== "Text") return;

  const data = block.data as Record<string, unknown> | undefined;
  const props = data?.props as Record<string, unknown> | undefined;
  const headingType = plateNodesContainHeading(props?.value);

  if (!headingType) return;

  issues.push({
    path: `${block.id}.props.value`,
    blockId: block.id,
    message: `Text must not use "${headingType}" Plate nodes - use a Heading block for titles (props.level + InlineContainer/InlineText children)`,
  });
}

function assertAllowedChild(
  parent: TEditorBlock,
  child: TEditorBlock,
  catalogByType: Map<string, BlockCatalogEntry> | undefined,
  issues: ValidationIssue[],
) {
  const rule = catalogByType?.get(parent.type)?.allowedChildren;

  if (!rule) return;

  const childMeta = catalogByType?.get(child.type);
  const ok = matchesRule(
    {
      type: child.type,
      tags: childMeta?.tags,
      capabilities: childMeta?.capabilities,
    },
    rule,
  );

  if (ok) return;

  issues.push({
    path: `${parent.id}.props.children`,
    blockId: child.id,
    message: `${parent.type} cannot contain ${child.type}. Respect allowedChildren on getBlockSchemas / getBlockRelationships (inline parents need InlineContainer/InlineText, not Text).`,
  });
}

function validateBlockTree(
  block: TEditorBlock,
  schemas: BuilderSchema,
  issues: ValidationIssue[],
  catalogByType?: Map<string, BlockCatalogEntry>,
) {
  const schema = schemas[block.type];

  if (!schema) {
    issues.push({
      path: block.id,
      blockId: block.id,
      message: `Unknown block type: ${block.type}`,
    });

    return;
  }

  const parsed = schema.safeParse(block.data);

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push({
        path: `${block.id}.${issue.path.join(".")}`,
        blockId: block.id,
        message: issue.message,
      });
    }
  }

  assertPageTextComposition(block, issues);

  const data = block.data as Record<string, unknown> | undefined;
  if (!data) return;

  const visitArray = (value: unknown) => {
    if (!Array.isArray(value)) return;

    for (const item of value) {
      if (
        item &&
        typeof item === "object" &&
        "type" in item &&
        "id" in item &&
        "data" in item
      ) {
        const child = item as TEditorBlock;

        assertAllowedChild(block, child, catalogByType, issues);
        validateBlockTree(child, schemas, issues, catalogByType);
      }
    }
  };

  visitArray(data.children);
  visitArray(data.cellBlocks);

  if (Array.isArray(data.cells)) {
    for (const cell of data.cells) {
      if (cell && typeof cell === "object") {
        visitArray((cell as Record<string, unknown>).children);
      }
    }
  }

  for (const value of Object.values(data)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      "children" in value
    ) {
      visitArray((value as { children?: unknown }).children);
    }
  }
}

export function validateDocument(
  document: TEditorBlock,
  schemas: BuilderSchema,
  catalogByType?: Map<string, BlockCatalogEntry>,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  validateBlockTree(document, schemas, issues, catalogByType);
  return { valid: issues.length === 0, issues };
}

export function validateOperationsAgainstDocument(input: {
  document: TEditorBlock;
  operations: EditorHistoryEntry[];
  schemas: BuilderSchema;
  catalogByType?: Map<string, BlockCatalogEntry>;
}): ValidationResult {
  const issues: ValidationIssue[] = [];

  for (const [index, operation] of input.operations.entries()) {
    if (!operation || typeof operation.type !== "string") {
      issues.push({
        path: `operations[${index}]`,
        message: "Operation is missing a type",
      });

      continue;
    }

    if (operation.type === "set-block-data") {
      const block = findBlockById(input.document, operation.value.blockId);

      if (!block) {
        issues.push({
          path: `operations[${index}]`,
          blockId: operation.value.blockId,
          message: `Block not found: ${operation.value.blockId}`,
        });

        continue;
      }

      const schema = input.schemas[block.type];

      if (!schema) {
        issues.push({
          path: `operations[${index}]`,
          blockId: block.id,
          message: `Unknown block type: ${block.type}`,
        });

        continue;
      }

      const patch = operation.value.data as Record<string, unknown>;
      const current = (block.data ?? {}) as Record<string, unknown>;
      const merged: Record<string, unknown> = {
        ...current,
        ...patch,
      };

      // Deep-merge common nested maps so partial props/style patches validate.
      for (const key of ["props", "style", "base"]) {
        const currentNested = current[key];
        const patchNested = patch?.[key];

        if (
          currentNested &&
          typeof currentNested === "object" &&
          !Array.isArray(currentNested) &&
          patchNested &&
          typeof patchNested === "object" &&
          !Array.isArray(patchNested)
        ) {
          merged[key] = {
            ...(currentNested as Record<string, unknown>),
            ...(patchNested as Record<string, unknown>),
          };
        }
      }

      const parsed = schema.safeParse(merged);

      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          issues.push({
            path: `operations[${index}].${issue.path.join(".")}`,
            blockId: block.id,
            message: issue.message,
          });
        }
      }
    }

    if (operation.type === "add-block") {
      const parent = findBlockById(
        input.document,
        operation.value.parentBlockId,
      );

      if (!parent && operation.value.parentBlockId) {
        issues.push({
          path: `operations[${index}]`,
          message: `Parent block not found: ${operation.value.parentBlockId}`,
        });
      }

      const block = operation.value.block;

      if (!block || typeof block !== "object") {
        issues.push({
          path: `operations[${index}]`,
          message: "add-block is missing a block",
        });
      } else {
        // Nested children use z.any() on container schemas - walk the full tree.
        validateBlockTree(block, input.schemas, issues, input.catalogByType);
      }
    }

    if (operation.type === "delete-block" || operation.type === "move-block") {
      const blockId =
        operation.type === "delete-block"
          ? operation.value.blockId
          : operation.value.blockId;

      const block = findBlockById(input.document, blockId);

      if (!block) {
        issues.push({
          path: `operations[${index}]`,
          blockId,
          message: `Block not found: ${blockId}`,
        });
      }
    }

    if (
      (operation as { type?: string }).type === "document" &&
      "value" in operation &&
      operation.value &&
      typeof operation.value === "object" &&
      "document" in operation.value
    ) {
      const result = validateDocument(
        (operation.value as { document: TEditorBlock }).document,
        input.schemas,
        input.catalogByType,
      );

      issues.push(...result.issues);
      continue;
    }

    if (
      operation.type !== "delete-block" &&
      operation.type !== "clone-block" &&
      operation.type !== "add-block" &&
      operation.type !== "move-block-up" &&
      operation.type !== "move-block-down" &&
      operation.type !== "swap-block" &&
      operation.type !== "move-block" &&
      operation.type !== "set-block-data" &&
      operation.type !== "set-block-base" &&
      operation.type !== "set-block-metadata"
    ) {
      issues.push({
        path: `operations[${index}]`,
        message: `Unsupported operation type: ${String((operation as { type?: string }).type)}`,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}
