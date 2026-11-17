import type {
  EditorHistoryEntry,
  TEditorBlock,
} from "@hacado/builder/editor-types";
import { generateId } from "@hacado/builder/helpers";
import { normalizePlateBodyValue } from "@hacado/rte/plate-value";

/** Matches page-builder-base `breakpoints` - keep in sync. */
const VALID_BREAKPOINTS = new Set([
  "sm",
  "max-sm",
  "md",
  "max-md",
  "lg",
  "max-lg",
  "xl",
  "max-xl",
  "2xl",
  "max-2xl",
]);

/** Common AI aliases → real responsive tokens. */
const BREAKPOINT_ALIASES: Record<string, string> = {
  mobile: "max-md",
  phone: "max-md",
  tablet: "md",
  desktop: "lg",
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isEmptyPlainObject(value: unknown): boolean {
  return isPlainObject(value) && Object.keys(value).length === 0;
}

function isEditorBlock(value: unknown): value is TEditorBlock {
  return (
    isPlainObject(value) &&
    typeof value.type === "string" &&
    typeof value.id === "string" &&
    "data" in value
  );
}

/** Block-shaped node (may be missing `id` when authored by the model). */
function isBlockLike(
  value: unknown,
): value is { type: string; data: unknown; id?: string } {
  return (
    isPlainObject(value) &&
    typeof value.type === "string" &&
    "data" in value &&
    value.data !== undefined
  );
}

function withBlockId<T extends { id?: string }>(block: T): T & { id: string } {
  if (typeof block.id === "string" && block.id.trim()) {
    return block as T & { id: string };
  }

  return { ...block, id: generateId() };
}

/**
 * Fill missing keys from catalog defaults; AI-provided values win.
 * Empty objects (`{}`) are treated as missing so blank `style: {}` does not
 * wipe defaults. Arrays from the override win (e.g. props.children).
 */
export function mergeBlockDataDefaults(
  defaults: unknown,
  override: unknown,
): unknown {
  if (override === undefined || override === null) return defaults;
  if (isEmptyPlainObject(override) && !isEmptyPlainObject(defaults)) {
    return defaults;
  }

  if (defaults === undefined || defaults === null) return override;

  if (Array.isArray(override) || Array.isArray(defaults)) {
    return override;
  }

  if (isPlainObject(defaults) && isPlainObject(override)) {
    const merged: Record<string, unknown> = { ...defaults };

    for (const [key, value] of Object.entries(override)) {
      merged[key] = mergeBlockDataDefaults(defaults[key], value);
    }

    return merged;
  }

  return override;
}

/** Parents whose EditorChildren allow only capability "inline". */
const INLINE_CHILD_PARENTS = new Set([
  "Heading",
  "Button",
  "Link",
  "InlineContainer",
]);

function collectPlatePlainText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";

  const parts: string[] = [];

  for (const node of value) {
    if (!node || typeof node !== "object") continue;

    const record = node as Record<string, unknown>;

    if (typeof record.text === "string") {
      parts.push(record.text);
    }

    if (record.children != null) {
      parts.push(collectPlatePlainText(record.children));
    }
  }

  return parts.join("").trim();
}

function extractInlineLabelText(block: TEditorBlock): string | null {
  const data = isPlainObject(block.data) ? block.data : {};
  const props = isPlainObject(data.props) ? data.props : {};

  if (block.type === "InlineText" && typeof props.text === "string") {
    return props.text;
  }

  if (block.type === "Text") {
    const fromValue = collectPlatePlainText(props.value);

    if (fromValue) return fromValue;

    if (typeof props.text === "string") return props.text;
  }

  return null;
}

function toInlineLabelChild(text: string, suffix: string): TEditorBlock {
  return {
    type: "InlineContainer",
    id: `ai-inline-ic-${suffix}`,
    data: {
      props: {
        children: [
          {
            type: "InlineText",
            id: `ai-inline-it-${suffix}`,
            data: {
              props: { text },
              style: {},
            },
          },
        ],
      },
      style: {},
    },
  };
}

function rewriteInlineParentChildren(
  children: unknown,
): TEditorBlock[] | unknown {
  if (!Array.isArray(children)) return children;

  return children.map((child, index) => {
    if (!isEditorBlock(child)) return child;

    if (
      child.type === "InlineContainer" ||
      child.type === "InlineText" ||
      child.type === "Icon" ||
      child.type === "CatalogValue" ||
      child.type === "TypewriterText" ||
      child.type === "PhraseCycle" ||
      child.type === "Link"
    ) {
      return child;
    }

    const label = extractInlineLabelText(child);

    if (label == null) return child;

    const suffix = `${Math.random().toString(36).slice(2, 8)}${index}`;

    return toInlineLabelChild(label, suffix);
  });
}

function coerceStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string" && value.length > 0) {
    return [value];
  }

  return [];
}

function normalizeBreakpointList(value: unknown): string[] | undefined {
  const mapped = coerceStringList(value)
    .map((token) => BREAKPOINT_ALIASES[token] ?? token)
    .filter((token) => VALID_BREAKPOINTS.has(token));

  return mapped.length > 0 ? mapped : undefined;
}

function normalizeStyleVariant(variant: unknown): unknown {
  if (!isPlainObject(variant)) return variant;

  const next: Record<string, unknown> = { ...variant };

  if ("breakpoint" in next) {
    const breakpoint = normalizeBreakpointList(next.breakpoint);

    if (breakpoint) {
      next.breakpoint = breakpoint;
    } else {
      delete next.breakpoint;
    }
  }

  if ("state" in next && next.state != null && !Array.isArray(next.state)) {
    if (typeof next.state === "string") {
      next.state = [{ state: next.state }];
    } else if (
      isPlainObject(next.state) &&
      typeof next.state.state === "string"
    ) {
      next.state = [next.state];
    } else {
      delete next.state;
    }
  }

  return next;
}

/** Coerce string breakpoints/states and drop invalid responsive tokens. */
export function normalizeAiStyleMap(style: unknown): unknown {
  if (!isPlainObject(style)) return style;

  return Object.fromEntries(
    Object.entries(style).map(([key, variants]) => {
      if (!Array.isArray(variants)) return [key, variants];

      return [key, variants.map(normalizeStyleVariant)];
    }),
  );
}

/** Fix common AI shape mistakes before/after merging defaults. */
export function normalizeAiBlockData(
  type: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  let next = { ...data };

  // style belongs next to props, not inside props
  if (
    isPlainObject(next.props) &&
    next.style == null &&
    "style" in next.props
  ) {
    const { style, ...restProps } = next.props;
    next = {
      ...next,
      style: isEmptyPlainObject(style) ? undefined : style,
      props: restProps,
    };
  }

  if (next.style != null) {
    next = {
      ...next,
      style: normalizeAiStyleMap(next.style),
    };
  }

  if (isPlainObject(next.props)) {
    const props = { ...next.props };

    // Text body: Plate nodes or markdown (schema); normalize aliases like "paragraph"→"p"
    if (type === "Text") {
      if (props.value == null && typeof props.text === "string") {
        props.value = props.text;
        delete props.text;
      }

      if (props.value != null) {
        props.value = normalizePlateBodyValue(props.value);
      }
    }

    // Page Heading uses InlineContainer/InlineText children, not props.text
    if (
      type === "Heading" &&
      typeof props.text === "string" &&
      (!Array.isArray(props.children) || props.children.length === 0)
    ) {
      const suffix = Math.random().toString(36).slice(2, 10);

      props.level = typeof props.level === "string" ? props.level : "h2";
      props.children = [
        {
          type: "InlineContainer",
          id: `ai-heading-ic-${suffix}`,
          data: {
            props: {
              children: [
                {
                  type: "InlineText",
                  id: `ai-heading-it-${suffix}`,
                  data: {
                    props: { text: props.text },
                    style: {},
                  },
                },
              ],
            },
            style: {},
          },
        },
      ];

      delete props.text;
    }

    if (INLINE_CHILD_PARENTS.has(type) && Array.isArray(props.children)) {
      props.children = rewriteInlineParentChildren(props.children);
    }

    if ("style" in props) {
      delete props.style;
    }

    next = { ...next, props };
  }

  return next;
}

function hydrateNestedValue(
  value: unknown,
  defaultsByType: Map<string, unknown>,
  metadataByType?: Map<string, Record<string, unknown>>,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) =>
      hydrateNestedValue(item, defaultsByType, metadataByType),
    );
  }

  if (isBlockLike(value)) {
    return hydrateEditorBlock(
      value as TEditorBlock,
      defaultsByType,
      metadataByType,
    );
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        hydrateNestedValue(child, defaultsByType, metadataByType),
      ]),
    );
  }

  return value;
}

/** Merge catalog defaultValue into an AI-authored block tree (style, props, nested children). */
export function hydrateEditorBlock(
  block: TEditorBlock,
  defaultsByType: Map<string, unknown>,
  metadataByType?: Map<string, Record<string, unknown>>,
): TEditorBlock {
  const rawData = isPlainObject(block.data)
    ? normalizeAiBlockData(block.type, block.data)
    : {};

  const defaults = defaultsByType.get(block.type);
  const mergedData = (
    defaults !== undefined ? mergeBlockDataDefaults(defaults, rawData) : rawData
  ) as TEditorBlock["data"];

  const defaultMetadata = metadataByType?.get(block.type);
  const metadata =
    defaultMetadata || block.metadata
      ? {
          ...(defaultMetadata ?? {}),
          ...(block.metadata ?? {}),
        }
      : undefined;

  return withBlockId({
    ...block,
    ...(metadata ? { metadata } : {}),
    data: hydrateNestedValue(
      mergedData,
      defaultsByType,
      metadataByType,
    ) as TEditorBlock["data"],
  });
}

export function hydrateEditorOperations(
  operations: EditorHistoryEntry[],
  defaultsByType: Map<string, unknown>,
  metadataByType?: Map<string, Record<string, unknown>>,
): EditorHistoryEntry[] {
  return operations.map((operation) => {
    if (operation.type === "add-block") {
      const block = operation.value?.block;

      if (!block || typeof block !== "object") return operation;

      return {
        ...operation,
        value: {
          ...operation.value,
          block: hydrateEditorBlock(
            block as TEditorBlock,
            defaultsByType,
            metadataByType,
          ),
        },
      };
    }

    if (operation.type === "set-block-data") {
      const data = operation.value?.data;

      if (!isPlainObject(data) || data.style == null) return operation;

      return {
        ...operation,
        value: {
          ...operation.value,
          data: {
            ...data,
            style: normalizeAiStyleMap(data.style),
          },
        },
      };
    }

    if (operation.type === "document") {
      const document = operation.value?.document;

      if (!document || typeof document !== "object") return operation;

      return {
        ...operation,
        value: {
          ...operation.value,
          document: hydrateEditorBlock(
            document as TEditorBlock,
            defaultsByType,
            metadataByType,
          ),
        },
      };
    }

    return operation;
  });
}

export function resolveCatalogDefaultValue(value: unknown): unknown {
  if (typeof value !== "function") return value;

  try {
    return (value as () => unknown)();
  } catch {
    return undefined;
  }
}
