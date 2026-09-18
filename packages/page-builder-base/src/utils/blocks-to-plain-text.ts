import { isSlotLikeObject } from "@hacado/builder";
import { plateValueToPlainTextBlocks } from "@hacado/rte";
import {
  richTextToString,
  type RichTextValue,
} from "@hacado/rte-inline/reader";
import sanitizeHtml from "sanitize-html";

type EditorBlockLike = {
  type?: string;
  id?: string;
  data?: {
    props?: Record<string, unknown> | null;
    [key: string]: unknown;
  } | null;
};

const SKIP_BLOCK_TYPES = new Set([
  "BookingSimple",
  "BookingModern",
  "BookingConfirmationSimple",
  "BookingConfirmationModern",
  "ModifyAppointmentFormSimple",
  "ModifyAppointmentFormModern",
  "Video",
  "YouTubeVideo",
  "Redirect",
  "Spacer",
  "Icon",
  "Image",
  "Lightbox",
  "BeforeAfter",
  "Carousel",
  "MarketingBrowserCarousel",
  "MarketingScrollingLogos",
]);

function coerceArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value == null) return [];
  return [value as T];
}

function findChildBlocks(obj: unknown): EditorBlockLike[] {
  if (!obj || typeof obj !== "object") return [];

  const result: EditorBlockLike[] = [];
  const record = obj as Record<string, unknown>;
  for (const prop of Object.keys(record)) {
    const value = record[prop];
    if (prop === "children" && Array.isArray(value)) {
      result.push(...(value as EditorBlockLike[]));
    } else if (prop === "cellBlocks" && Array.isArray(value)) {
      result.push(...(value as EditorBlockLike[]));
    } else if (prop === "cells") {
      for (const item of coerceArray(value)) {
        if (isSlotLikeObject(item)) {
          result.push(...(item.children as EditorBlockLike[]));
        }
      }
    } else if (isSlotLikeObject(value) && prop !== "props") {
      result.push(...(value.children as EditorBlockLike[]));
    } else {
      result.push(...findChildBlocks(value));
    }
  }

  return result;
}

function stringifyInlineText(text: unknown): string {
  if (text == null) return "";
  if (typeof text === "number" || typeof text === "boolean")
    return String(text);
  if (typeof text === "string" || Array.isArray(text)) {
    return richTextToString(text as string | RichTextValue).trim();
  }

  return "";
}

function stripHtml(html: string): string {
  const cleaned = sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
  });

  return cleaned.replace(/\s+/g, " ").trim();
}

function extractBlockText(block: EditorBlockLike): string[] {
  const type = block.type;
  const props = block.data?.props || {};

  switch (type) {
    case "Text":
      return plateValueToPlainTextBlocks(props.value as never)
        .map((line) => line.trim())
        .filter(Boolean);
    case "InlineText": {
      const text = stringifyInlineText(props.text);
      return text ? [text] : [];
    }
    case "TypewriterText": {
      const phrases = Array.isArray(props.phrases) ? props.phrases : [];
      const texts = phrases
        .map((phrase) =>
          phrase && typeof phrase === "object"
            ? stringifyInlineText((phrase as { text?: unknown }).text)
            : "",
        )
        .filter(Boolean);
      return texts.length ? [texts.join(" / ")] : [];
    }
    case "CustomHTML": {
      const html = typeof props.html === "string" ? props.html : "";
      const text = html ? stripHtml(html) : "";
      return text ? [text] : [];
    }
    default:
      return [];
  }
}

function walkBlock(block: EditorBlockLike | null | undefined, out: string[]) {
  if (!block || typeof block !== "object") return;
  if (block.type && SKIP_BLOCK_TYPES.has(block.type)) return;

  out.push(...extractBlockText(block));
  const children = findChildBlocks(block.data);
  for (const child of children) {
    walkBlock(child, out);
  }
}

/**
 * Walk a page-builder document tree and extract plain-text lines suitable for
 * Markdown / LLM dumps. Skips booking widgets, media chrome, and similar.
 */
export function blocksToPlainText(document: unknown): string {
  const lines: string[] = [];
  if (Array.isArray(document)) {
    for (const block of document) {
      walkBlock(block as EditorBlockLike, lines);
    }
  } else if (document && typeof document === "object") {
    walkBlock(document as EditorBlockLike, lines);
  }

  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n\n");
}
