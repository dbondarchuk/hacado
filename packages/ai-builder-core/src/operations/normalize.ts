import type { EditorHistoryEntry } from "@hacado/builder/editor-types";

const NATIVE_OPERATION_TYPES = new Set<EditorHistoryEntry["type"]>([
  "document",
  "delete-block",
  "clone-block",
  "add-block",
  "move-block-up",
  "move-block-down",
  "swap-block",
  "move-block",
  "set-block-data",
  "set-block-base",
  "set-block-metadata",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

/** Email Text blocks need Plate nodes; models often pass a plain string. */
function coerceEmailTextPlateValue(value: unknown): unknown {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    return [{ type: "p", children: [{ text: value }] }];
  }

  return value;
}

function normalizeBlockTreeData(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map((item) => normalizeBlockTreeData(item));
  }

  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};

  for (const [key, nested] of Object.entries(record)) {
    next[key] = normalizeBlockTreeData(nested);
  }

  if (
    typeof next.type === "string" &&
    next.type === "Text" &&
    next.data &&
    typeof next.data === "object" &&
    !Array.isArray(next.data)
  ) {
    const data = next.data as Record<string, unknown>;
    const props = asRecord(data.props);

    if (props && typeof props.value === "string") {
      next.data = {
        ...data,
        props: {
          ...props,
          value: coerceEmailTextPlateValue(props.value),
        },
      };
    }
  }

  return next;
}

function normalizeSetBlockDataPayload(data: unknown): unknown {
  const record = asRecord(data);

  if (!record) return data;

  const props = asRecord(record.props);

  if (props && typeof props.value === "string") {
    return {
      ...record,
      props: {
        ...props,
        value: coerceEmailTextPlateValue(props.value),
      },
    };
  }

  return normalizeBlockTreeData(data);
}

function normalizeSetBlockData(
  operation: Record<string, unknown>,
): EditorHistoryEntry | null {
  const value = asRecord(operation.value);
  const blockId = String(
    operation.blockId ?? value?.blockId ?? operation.id ?? "",
  );

  const data = operation.data ?? value?.data;

  if (!blockId || data == null || typeof data !== "object") {
    return null;
  }

  return {
    type: "set-block-data",
    value: {
      blockId,
      data: normalizeSetBlockDataPayload(data),
    },
  };
}

/**
 * Map model-invented operation aliases to native EditorHistoryEntry shapes.
 */
export function normalizeEditorOperations(operations: unknown[]): {
  operations: EditorHistoryEntry[];
  issues: string[];
} {
  const normalized: EditorHistoryEntry[] = [];
  const issues: string[] = [];

  for (const [index, raw] of operations.entries()) {
    const operation = asRecord(raw);

    if (!operation || typeof operation.type !== "string") {
      issues.push(`operations[${index}] is not a valid editor operation`);
      continue;
    }

    if (
      NATIVE_OPERATION_TYPES.has(
        operation.type as EditorHistoryEntry["type"],
      ) &&
      "value" in operation
    ) {
      if (operation.type === "set-block-data") {
        const next = normalizeSetBlockData(operation);

        if (next) {
          normalized.push(next);
          continue;
        }
      }

      if (operation.type === "add-block") {
        const value = asRecord(operation.value);

        if (value?.block) {
          normalized.push({
            type: "add-block",
            value: {
              ...(value as any),
              block: normalizeBlockTreeData(value.block) as any,
            },
          });

          continue;
        }
      }

      normalized.push(operation as EditorHistoryEntry);
      continue;
    }

    if (
      operation.type === "updateBlock" ||
      operation.type === "update-block" ||
      operation.type === "setBlockData" ||
      operation.type === "set-block-data"
    ) {
      const next = normalizeSetBlockData(operation);

      if (!next) {
        issues.push(
          `operations[${index}] could not be normalized to set-block-data`,
        );

        continue;
      }

      normalized.push(next);
      continue;
    }

    if (
      operation.type === "addBlock" ||
      operation.type === "add-block" ||
      operation.type === "insertBlock"
    ) {
      const value = asRecord(operation.value) ?? operation;
      const block = asRecord(value.block);

      if (!block) {
        issues.push(`operations[${index}] add-block is missing block`);
        continue;
      }

      normalized.push({
        type: "add-block",
        value: {
          block: normalizeBlockTreeData(block) as any,
          parentBlockId: String(value.parentBlockId ?? ""),
          parentBlockProperty: value.parentBlockProperty
            ? String(value.parentBlockProperty)
            : undefined,
          index:
            typeof value.index === "number" || value.index === "last"
              ? value.index
              : "last",
        },
      });

      continue;
    }

    if (
      operation.type === "deleteBlock" ||
      operation.type === "delete-block" ||
      operation.type === "removeBlock"
    ) {
      const value = asRecord(operation.value);
      const blockId = String(operation.blockId ?? value?.blockId ?? "");

      if (!blockId) {
        issues.push(`operations[${index}] delete-block is missing blockId`);
        continue;
      }

      normalized.push({
        type: "delete-block",
        value: { blockId },
      });

      continue;
    }

    issues.push(
      `operations[${index}] has unsupported type "${operation.type}"`,
    );
  }

  return { operations: normalized, issues };
}

export function listNativeEditorOperationTypes(): string[] {
  return [...NATIVE_OPERATION_TYPES];
}
