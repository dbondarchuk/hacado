/**
 * Plain-text extraction of Plate values for SEO / meta descriptions.
 * Mirrors top-level block structure of {@link PlateStaticFastRenderer}
 * without producing HTML.
 */
import { BaseParagraphPlugin, type Value } from "@udecode/plate";
import { BaseBlockquotePlugin } from "@udecode/plate-block-quote";
import {
  BaseCodeBlockPlugin,
  BaseCodeLinePlugin,
} from "@udecode/plate-code-block";
import { BaseDatePlugin } from "@udecode/plate-date";
import { HEADING_KEYS } from "@udecode/plate-heading";
import { BaseHorizontalRulePlugin } from "@udecode/plate-horizontal-rule";
import {
  BaseIndentListPlugin,
  INDENT_LIST_KEYS,
  ULIST_STYLE_TYPES,
} from "@udecode/plate-indent-list";
import { BaseColumnItemPlugin, BaseColumnPlugin } from "@udecode/plate-layout";
import { BaseLinkPlugin } from "@udecode/plate-link";
import {
  BaseAudioPlugin,
  BaseFilePlugin,
  BaseImagePlugin,
  BaseVideoPlugin,
} from "@udecode/plate-media";
import { BaseMentionPlugin } from "@udecode/plate-mention";
import {
  BaseTableCellHeaderPlugin,
  BaseTableCellPlugin,
  BaseTablePlugin,
  BaseTableRowPlugin,
} from "@udecode/plate-table";
import { BaseTogglePlugin } from "@udecode/plate-toggle";
import type { Descendant, TText } from "@udecode/slate";
import { Element, Text } from "slate";

/** Avoid importing `@udecode/plate-math` (pulls KaTeX CSS). */
const EQUATION_KEY = "equation";
const INLINE_EQUATION_KEY = "inline_equation";

const HEADING_TYPE_SET = new Set<string>(Object.values(HEADING_KEYS));

function listStyleOnBlock(el: { [k: string]: unknown }): string | undefined {
  const v = el[BaseIndentListPlugin.key];
  return typeof v === "string" ? v : undefined;
}

function isListBlock(el: Descendant): boolean {
  if (!Element.isElement(el)) return false;
  if (!listStyleOnBlock(el as { [k: string]: unknown })) return false;
  return el.type === BaseParagraphPlugin.key || HEADING_TYPE_SET.has(el.type);
}

function normalizeCodeBlockChild(child: Descendant): Descendant {
  if (!Text.isText(child)) return child;
  const leaf = child as TText & { type?: unknown; id?: unknown };
  if (leaf.type !== BaseCodeLinePlugin.key) return child;
  return {
    type: BaseCodeLinePlugin.key,
    children: [{ text: leaf.text }],
    ...(typeof leaf.id === "string" ? { id: leaf.id } : {}),
  } as Descendant;
}

function phrasingText(nodes: Descendant[]): string {
  let s = "";
  for (const n of nodes) {
    if (Text.isText(n)) {
      s += n.text;
      continue;
    }
    if (!Element.isElement(n)) continue;
    const el = n as {
      type: string;
      children?: Descendant[];
      [k: string]: unknown;
    };
    const ch = (el.children ?? []) as Descendant[];

    if (el.type === BaseMentionPlugin.key) {
      const value = typeof el.value === "string" ? el.value : "";
      s += value;
      s += phrasingText(ch);
      continue;
    }
    if (el.type === INLINE_EQUATION_KEY) {
      const tex = typeof el.texExpression === "string" ? el.texExpression : "";
      if (tex) s += tex;
      s += phrasingText(ch);
      continue;
    }
    if (el.type === BaseDatePlugin.key) {
      const dateStr = el.date as string | undefined;
      if (dateStr) {
        const elementDate = new Date(dateStr);
        if (!Number.isNaN(elementDate.getTime())) {
          s += elementDate.toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
        }
      }
      s += phrasingText(ch);
      continue;
    }
    if (el.type === BaseLinkPlugin.key) {
      s += phrasingText(ch);
      continue;
    }
    s += phrasingText(ch);
  }
  return s;
}

function captionText(el: Record<string, unknown>): string {
  const caption = el.caption as Descendant[] | undefined;
  if (!caption?.[0]) return "";
  return phrasingText([caption[0]] as Descendant[]).trim();
}

function isUnorderedListStyle(style: string): boolean {
  return (ULIST_STYLE_TYPES as readonly string[]).includes(style);
}

function listItemPrefix(
  style: string,
  index: number,
  listStart?: number,
): string {
  if (
    isUnorderedListStyle(style) ||
    style === INDENT_LIST_KEYS.todo ||
    style === "fire"
  ) {
    return "- ";
  }
  const n = (listStart ?? 1) + index;
  return `${n}. `;
}

function indentPrefix(el: { [k: string]: unknown }): string {
  const raw = el.indent;
  if (typeof raw !== "number" || raw <= 0 || !Number.isFinite(raw)) return "";
  return "  ".repeat(raw);
}

/** Flatten a single block node into zero or more plain-text block strings. */
function blockToPlainTextBlocks(node: Descendant): string[] {
  if (!Element.isElement(node)) return [];
  const el = node as {
    type: string;
    children?: Descendant[];
    [k: string]: unknown;
  };
  const ch = (el.children ?? []) as Descendant[];

  switch (el.type) {
    case BaseParagraphPlugin.key:
    case HEADING_KEYS.h1:
    case HEADING_KEYS.h2:
    case HEADING_KEYS.h3:
    case HEADING_KEYS.h4:
    case HEADING_KEYS.h5:
    case HEADING_KEYS.h6:
      return [phrasingText(ch)];

    case BaseBlockquotePlugin.key: {
      const lines: string[] = [];
      for (const c of ch) {
        if (Text.isText(c)) {
          if (c.text) lines.push(c.text);
          continue;
        }
        if (Element.isElement(c)) {
          lines.push(...blockToPlainTextBlocks(c));
        }
      }
      return [lines.filter((l) => l.trim()).join("\n")];
    }

    case BaseHorizontalRulePlugin.key:
      return [];

    case BaseCodeBlockPlugin.key: {
      const lines = ch.map((c) => {
        const normalized = normalizeCodeBlockChild(c);
        if (!Element.isElement(normalized)) return "";
        const lineEl = normalized as {
          type: string;
          children?: Descendant[];
          text?: unknown;
        };
        const fromChildren = phrasingText(
          (lineEl.children ?? []) as Descendant[],
        );
        const legacy = typeof lineEl.text === "string" ? lineEl.text : "";
        return fromChildren || legacy;
      });
      return [lines.join("\n")];
    }

    case BaseCodeLinePlugin.key:
      return [phrasingText(ch)];

    case BaseImagePlugin.key:
    case BaseVideoPlugin.key: {
      const cap = captionText(el as Record<string, unknown>);
      return cap ? [cap] : [];
    }

    case BaseAudioPlugin.key:
      return [];

    case BaseFilePlugin.key: {
      const name = typeof el.name === "string" ? el.name.trim() : "";
      return name ? [name] : [];
    }

    case EQUATION_KEY: {
      const tex =
        typeof el.texExpression === "string" ? el.texExpression.trim() : "";
      return tex ? [tex] : [];
    }

    case BaseTogglePlugin.key:
    case BaseColumnPlugin.key:
    case BaseColumnItemPlugin.key:
      return flattenRootBlocks(ch);

    case BaseTablePlugin.key: {
      const rows: string[] = [];
      for (const row of ch) {
        if (!Element.isElement(row) || row.type !== BaseTableRowPlugin.key) {
          continue;
        }
        const cells = ((row as { children?: Descendant[] }).children ??
          []) as Descendant[];
        const cellTexts = cells
          .filter(
            (c) =>
              Element.isElement(c) &&
              (c.type === BaseTableCellPlugin.key ||
                c.type === BaseTableCellHeaderPlugin.key),
          )
          .map((c) =>
            phrasingText(
              ((c as { children?: Descendant[] }).children ??
                []) as Descendant[],
            ).trim(),
          );
        rows.push(cellTexts.join(" | "));
      }
      return rows;
    }

    case BaseTableRowPlugin.key:
    case BaseTableCellPlugin.key:
    case BaseTableCellHeaderPlugin.key:
      return [phrasingText(ch)];

    default:
      return flattenRootBlocks(ch);
  }
}

function flattenRootBlocks(nodes: Descendant[]): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < nodes.length) {
    const n = nodes[i]!;
    if (isListBlock(n)) {
      const lst = listStyleOnBlock(n as { [k: string]: unknown })!;
      const group: Descendant[] = [];
      while (i < nodes.length && isListBlock(nodes[i]!)) {
        group.push(nodes[i]!);
        i++;
      }
      const listStart = (() => {
        const first = group[0];
        if (!Element.isElement(first)) return undefined;
        const v = (first as Record<string, unknown>)[
          INDENT_LIST_KEYS.listStart
        ];
        return typeof v === "number" ? v : undefined;
      })();

      const lines = group.map((item, j) => {
        if (!Element.isElement(item)) return "";
        const itemEl = item as {
          type: string;
          children?: Descendant[];
          [k: string]: unknown;
        };
        const text = phrasingText(
          (itemEl.children ?? []) as Descendant[],
        ).trim();
        if (!text) return "";
        return `${indentPrefix(itemEl)}${listItemPrefix(lst, j, listStart)}${text}`;
      });
      out.push(lines.filter(Boolean).join("\n"));
      continue;
    }

    out.push(...blockToPlainTextBlocks(n));
    i++;
  }
  return out;
}

/**
 * Convert a Plate editor value into plain-text blocks (one string per
 * top-level paragraph, heading, list group, etc.).
 */
export function plateValueToPlainTextBlocks(
  value?: Value | Descendant[] | null,
): string[] {
  if (!Array.isArray(value)) return [];
  return flattenRootBlocks(value as Descendant[]);
}

/**
 * First `max` non-empty plain-text blocks, joined for use as a meta description.
 */
export function plateValueToPlainTextDescription(
  value?: Value | Descendant[] | null,
  max = 3,
  separator = "\n",
): string {
  const blocks = plateValueToPlainTextBlocks(value)
    .map((b) => b.trim())
    .filter(Boolean)
    .slice(0, Math.max(0, max));
  return blocks.join(separator);
}
