import type { Value } from "@udecode/plate";

/** Plate editor document value (top-level element array). */
export type PlateEditorValue = Value;

/** Common AI / Slate aliases → Hacado Plate keys. */
const TYPE_ALIASES: Record<string, string> = {
  paragraph: "p",
  "list-item": "li",
  list_item: "li",
  "list-item-content": "lic",
  list_item_content: "lic",
  "bulleted-list": "ul",
  bulleted_list: "ul",
  "numbered-list": "ol",
  numbered_list: "ol",
  link: "a",
};

const MARK_TOKEN_RE = /\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`/;
const LINK_TOKEN_RE = /\[[^\]\n]+\]\([^)\n]+\)/;
const INLINE_MARKDOWN_RE = new RegExp(
  `(${LINK_TOKEN_RE.source}|${MARK_TOKEN_RE.source})`,
);

const BLOCK_MARKDOWN_RE = /^([-*]\s+|\d+\.\s+)/m;

function parseMarkToken(token: string): Record<string, unknown> {
  if (token.startsWith("**") && token.endsWith("**")) {
    return { text: token.slice(2, -2), bold: true };
  }

  if (
    (token.startsWith("*") && token.endsWith("*")) ||
    (token.startsWith("_") && token.endsWith("_"))
  ) {
    return { text: token.slice(1, -1), italic: true };
  }

  if (token.startsWith("`") && token.endsWith("`")) {
    return { text: token.slice(1, -1), code: true };
  }

  return { text: token };
}

/** Parse inline markdown marks and `[label](url)` links into Plate children. */
function parseInlineMarkdown(
  text: string,
  allowLinks = true,
): Array<Record<string, unknown>> {
  const nodes: Array<Record<string, unknown>> = [];
  const pattern = allowLinks
    ? new RegExp(INLINE_MARKDOWN_RE.source, "g")
    : new RegExp(`(${MARK_TOKEN_RE.source})`, "g");

  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      nodes.push({ text: text.slice(last, match.index) });
    }

    const token = match[0]!;

    if (allowLinks && token.startsWith("[")) {
      const linkMatch = /^\[([^\]]*)\]\(([^)]*)\)$/.exec(token);

      if (linkMatch) {
        const label = linkMatch[1] ?? "";
        const url = (linkMatch[2] ?? "").trim();

        nodes.push({
          type: "a",
          url,
          children: parseInlineMarkdown(label, false),
        });

        last = match.index + token.length;
        continue;
      }
    }

    nodes.push(parseMarkToken(token));
    last = match.index + token.length;
  }

  if (last < text.length) {
    nodes.push({ text: text.slice(last) });
  }

  return nodes.length ? nodes : [{ text: "" }];
}

function markdownToPlateBody(markdown: string): unknown[] {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return [{ type: "p", children: [{ text: "" }] }];
  }

  const blocks = normalized.split(/\n{2,}/);
  const result: unknown[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => line.trim().length > 0);

    if (!lines.length) continue;

    if (lines.every((line) => /^[-*]\s+/.test(line.trim()))) {
      result.push({
        type: "ul",
        children: lines.map((line) => ({
          type: "li",
          children: [
            {
              type: "lic",
              children: parseInlineMarkdown(
                line.trim().replace(/^[-*]\s+/, ""),
              ),
            },
          ],
        })),
      });

      continue;
    }

    if (lines.every((line) => /^\d+\.\s+/.test(line.trim()))) {
      result.push({
        type: "ol",
        children: lines.map((line) => ({
          type: "li",
          children: [
            {
              type: "lic",
              children: parseInlineMarkdown(
                line.trim().replace(/^\d+\.\s+/, ""),
              ),
            },
          ],
        })),
      });

      continue;
    }

    result.push({
      type: "p",
      children: parseInlineMarkdown(lines.join(" ")),
    });
  }

  return result.length ? result : [{ type: "p", children: [{ text: "" }] }];
}

function isPlainTextLeaf(node: unknown): node is { text: string } {
  if (!node || typeof node !== "object" || Array.isArray(node)) return false;

  const record = node as Record<string, unknown>;

  if (typeof record.text !== "string") return false;

  return !Object.entries(record).some(
    ([key, value]) => key !== "text" && Boolean(value),
  );
}

function joinPlainTextLeaves(children: Array<{ text: string }>): string {
  return children.map((child) => child.text).join("");
}

function looksLikeMarkdown(text: string): boolean {
  return INLINE_MARKDOWN_RE.test(text) || BLOCK_MARKDOWN_RE.test(text);
}

function wrapLiChildren(children: unknown[]): unknown[] {
  if (!children.length) {
    return [{ type: "lic", children: [{ text: "" }] }];
  }

  const allLic = children.every(
    (child) =>
      child &&
      typeof child === "object" &&
      (child as { type?: string }).type === "lic",
  );

  if (allLic) return children;

  const hasElement = children.some(
    (child) =>
      child &&
      typeof child === "object" &&
      typeof (child as { type?: string }).type === "string",
  );

  if (hasElement) return children;

  return [{ type: "lic", children }];
}

function normalizePlateNode(node: unknown): unknown {
  if (!node || typeof node !== "object") return node;

  if ("text" in node && typeof (node as { text: unknown }).text === "string") {
    return node;
  }

  const record = node as Record<string, unknown>;
  const rawType = typeof record.type === "string" ? record.type : undefined;
  const type = rawType ? (TYPE_ALIASES[rawType] ?? rawType) : rawType;
  const rawChildren = Array.isArray(record.children) ? record.children : [];
  let children = rawChildren.map(normalizePlateNode);

  // Nested leaves often still contain **bold** / links from the model.
  if (children.length > 0 && children.every(isPlainTextLeaf)) {
    const text = joinPlainTextLeaves(children);

    if (INLINE_MARKDOWN_RE.test(text) && !BLOCK_MARKDOWN_RE.test(text)) {
      children = parseInlineMarkdown(text);
    }
  }

  if (type === "li") {
    children = wrapLiChildren(children);
  }

  return {
    ...record,
    ...(type ? { type } : {}),
    children,
  };
}

/**
 * Top-level body nodes: when the model wraps markdown inside a Plate `p`
 * (`{ type:"p", children:[{ text:"**$75**" }] }`), re-parse as markdown.
 */
function expandMarkdownPlateNode(node: unknown): unknown[] {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return [normalizePlateNode(node)];
  }

  if ("text" in node) {
    return [node];
  }

  const record = node as Record<string, unknown>;
  const rawType = typeof record.type === "string" ? record.type : undefined;
  const type = rawType ? (TYPE_ALIASES[rawType] ?? rawType) : rawType;
  const rawChildren = Array.isArray(record.children) ? record.children : [];

  if (
    (type === "p" || type === undefined) &&
    rawChildren.length > 0 &&
    rawChildren.every(isPlainTextLeaf)
  ) {
    const text = joinPlainTextLeaves(rawChildren);

    if (looksLikeMarkdown(text)) {
      return markdownToPlateBody(text);
    }
  }

  return [normalizePlateNode(node)];
}

/**
 * Normalize AI / loose Plate body values:
 * - markdown string → Plate nodes
 * - markdown left inside Plate text leaves → marks / lists
 * - type aliases (`paragraph` → `p`, etc.)
 * - `li` children wrapped in `lic` when needed
 */
export function normalizePlateBodyValue(value: unknown): PlateEditorValue {
  if (value == null) {
    return [{ type: "p", children: [{ text: "" }] }];
  }

  if (typeof value === "string") {
    return markdownToPlateBody(value) as PlateEditorValue;
  }

  if (Array.isArray(value)) {
    return value.flatMap(expandMarkdownPlateNode) as PlateEditorValue;
  }

  return [{ type: "p", children: [{ text: "" }] }];
}
