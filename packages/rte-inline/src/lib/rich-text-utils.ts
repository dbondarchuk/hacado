// Utility functions for rich text editor

import { pluginRegistry } from "../plugins";
import type {
  Block,
  RichTextValue,
  TextMark,
  TextNode,
} from "./rich-text-types";

// Convert plain string to RichTextValue (blocks)
export function stringToRichText(text: string): RichTextValue {
  const lines = text.split("\n");
  return lines.map((line) => ({
    type: "paragraph" as const,
    content: [{ text: line || "" }],
  }));
}

// Convert RichTextValue to plain string
export function richTextToString(
  value: RichTextValue | string | undefined,
): string {
  if (!value || typeof value === "string") return value ?? "";

  return value
    .map((block) => block.content.map((node) => node.text).join(""))
    .join("\n");
}

// Parse HTML to RichTextValue (for paste support)
export function htmlToRichText(
  html: string,
  defaultView: Window,
): RichTextValue {
  const div = defaultView.document.createElement("div");
  div.innerHTML = html;

  const blocks: Block[] = [];
  let currentNodes: TextNode[] = [];

  function finishBlock() {
    if (currentNodes.length > 0) {
      blocks.push({
        type: "paragraph",
        content: currentNodes,
      });

      currentNodes = [];
    }
  }

  function traverse(element: Node, inheritedMarks: TextMark = {}) {
    if (element.nodeType === Node.TEXT_NODE) {
      const text = element.textContent || "";
      if (text) {
        currentNodes.push({
          text,
          marks:
            Object.keys(inheritedMarks).length > 0 ? inheritedMarks : undefined,
        });
      }
    } else if (element.nodeType === Node.ELEMENT_NODE) {
      const el = element as HTMLElement;
      const marks: TextMark = { ...inheritedMarks };

      // Handle block-level elements
      if (["DIV", "P", "BR"].includes(el.tagName)) {
        if (el.tagName === "BR") {
          finishBlock();
          blocks.push({ type: "paragraph", content: [{ text: "" }] });
          return;
        }

        if (currentNodes.length > 0) {
          finishBlock();
        }
      }

      // Use plugin parsers
      const plugins = pluginRegistry.getAll();
      for (const plugin of plugins) {
        if (plugin.parseHTML) {
          const parsed = plugin.parseHTML(el, marks);
          Object.assign(marks, parsed);
        }
      }

      Array.from(element.childNodes).forEach((child) => traverse(child, marks));

      // After processing children of block elements, finish the block
      if (["DIV", "P"].includes(el.tagName) && currentNodes.length > 0) {
        finishBlock();
      }
    }
  }

  traverse(div);
  finishBlock();

  return blocks.length > 0
    ? blocks
    : [{ type: "paragraph", content: [{ text: "" }] }];
}

function rgbToHex(rgb: string): string {
  // Already hex
  if (rgb.startsWith("#")) return rgb;

  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb;

  const r = Number.parseInt(match[1]);
  const g = Number.parseInt(match[2]);
  const b = Number.parseInt(match[3]);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Merge adjacent text nodes with same marks
export function normalizeBlock(content: TextNode[]): TextNode[] {
  if (content.length <= 1) return content;

  const normalized: TextNode[] = [];
  let current = content[0];

  for (let i = 1; i < content.length; i++) {
    const next = content[i];

    if (JSON.stringify(current.marks) === JSON.stringify(next.marks)) {
      current = { ...current, text: current.text + next.text };
    } else {
      normalized.push(current);
      current = next;
    }
  }

  normalized.push(current);
  return normalized;
}

export function normalizeRichText(value: RichTextValue): RichTextValue {
  return value.map((block) => ({
    ...block,
    content: normalizeBlock(block.content),
  }));
}

// Get total text position from block and offset within block
export function getAbsolutePosition(
  blocks: RichTextValue,
  blockIndex: number,
  offsetInBlock: number,
): number {
  let pos = 0;
  for (let i = 0; i < blockIndex; i++) {
    pos +=
      blocks[i].content.reduce((sum, node) => sum + node.text.length, 0) + 1; // +1 for newline
  }

  return pos + offsetInBlock;
}

// Get block index and offset from absolute position
export function getBlockPosition(
  blocks: RichTextValue,
  absolutePos: number,
): { blockIndex: number; offset: number } {
  let pos = 0;

  for (let i = 0; i < blocks.length; i++) {
    const blockLength = blocks[i].content.reduce(
      (sum, node) => sum + node.text.length,
      0,
    );

    if (pos + blockLength >= absolutePos) {
      return { blockIndex: i, offset: absolutePos - pos };
    }

    pos += blockLength + 1; // +1 for newline
  }

  // If we're past the end, return the last position
  const lastBlock = blocks[blocks.length - 1];
  const lastBlockLength = lastBlock.content.reduce(
    (sum, node) => sum + node.text.length,
    0,
  );

  return { blockIndex: blocks.length - 1, offset: lastBlockLength };
}

// Apply marks to a range within a single block
export function applyMarksToBlockRange(
  content: TextNode[],
  start: number,
  end: number,
  marks: Partial<TextMark>,
): TextNode[] {
  const result: TextNode[] = [];
  let currentPos = 0;

  for (const node of content) {
    const nodeEnd = currentPos + node.text.length;

    if (nodeEnd <= start || currentPos >= end) {
      result.push(node);
    } else if (currentPos >= start && nodeEnd <= end) {
      result.push({
        text: node.text,
        marks: { ...node.marks, ...marks },
      });
    } else {
      if (currentPos < start) {
        result.push({
          text: node.text.slice(0, start - currentPos),
          marks: node.marks,
        });
      }

      const selectionStart = Math.max(0, start - currentPos);
      const selectionEnd = Math.min(node.text.length, end - currentPos);

      result.push({
        text: node.text.slice(selectionStart, selectionEnd),
        marks: { ...node.marks, ...marks },
      });

      if (nodeEnd > end) {
        result.push({
          text: node.text.slice(end - currentPos),
          marks: node.marks,
        });
      }
    }

    currentPos = nodeEnd;
  }

  return normalizeBlock(result);
}

// Apply marks across multiple blocks
export function applyMarksToRange(
  value: RichTextValue,
  startBlock: number,
  startOffset: number,
  endBlock: number,
  endOffset: number,
  marks: Partial<TextMark>,
): RichTextValue {
  return value.map((block, index) => {
    if (index < startBlock || index > endBlock) {
      return block;
    }

    const blockLength = block.content.reduce(
      (sum, node) => sum + node.text.length,
      0,
    );

    const start = index === startBlock ? startOffset : 0;
    const end = index === endBlock ? endOffset : blockLength;

    return {
      ...block,
      content: applyMarksToBlockRange(block.content, start, end, marks),
    };
  });
}

// Remove mark from range
export function removeMarkFromRange(
  value: RichTextValue,
  startBlock: number,
  startOffset: number,
  endBlock: number,
  endOffset: number,
  markKey: keyof TextMark,
): RichTextValue {
  return value.map((block, index) => {
    if (index < startBlock || index > endBlock) {
      return block;
    }

    const blockLength = block.content.reduce(
      (sum, node) => sum + node.text.length,
      0,
    );

    const start = index === startBlock ? startOffset : 0;
    const end = index === endBlock ? endOffset : blockLength;

    const result: TextNode[] = [];
    let currentPos = 0;

    for (const node of block.content) {
      const nodeEnd = currentPos + node.text.length;

      if (nodeEnd <= start || currentPos >= end) {
        result.push(node);
      } else if (currentPos >= start && nodeEnd <= end) {
        const newMarks = { ...node.marks };
        delete newMarks[markKey];
        result.push({
          text: node.text,
          marks: Object.keys(newMarks).length > 0 ? newMarks : undefined,
        });
      } else {
        if (currentPos < start) {
          result.push({
            text: node.text.slice(0, start - currentPos),
            marks: node.marks,
          });
        }

        const selectionStart = Math.max(0, start - currentPos);
        const selectionEnd = Math.min(node.text.length, end - currentPos);

        const newMarks = { ...node.marks };
        delete newMarks[markKey];

        result.push({
          text: node.text.slice(selectionStart, selectionEnd),
          marks: Object.keys(newMarks).length > 0 ? newMarks : undefined,
        });

        if (nodeEnd > end) {
          result.push({
            text: node.text.slice(end - currentPos),
            marks: node.marks,
          });
        }
      }

      currentPos = nodeEnd;
    }

    return {
      ...block,
      content: normalizeBlock(result),
    };
  });
}

// Get marks in range
export function getMarksInRange(
  value: RichTextValue,
  startBlock: number,
  startOffset: number,
  endBlock: number,
  endOffset: number,
): {
  marks: Partial<TextMark>;
  hasMixed: Set<keyof TextMark>;
} {
  const marksFound: Array<Partial<TextMark>> = [];

  for (let blockIndex = startBlock; blockIndex <= endBlock; blockIndex++) {
    const block = value[blockIndex];
    const blockLength = block.content.reduce(
      (sum, node) => sum + node.text.length,
      0,
    );

    const start = blockIndex === startBlock ? startOffset : 0;
    const end = blockIndex === endBlock ? endOffset : blockLength;

    let currentPos = 0;
    for (const node of block.content) {
      const nodeEnd = currentPos + node.text.length;

      if (nodeEnd > start && currentPos < end) {
        marksFound.push(node.marks || {});
      }

      currentPos = nodeEnd;
    }
  }

  if (marksFound.length === 0) {
    return { marks: {}, hasMixed: new Set() };
  }

  const firstMarks = marksFound[0];
  const consistentMarks: Partial<TextMark> = {};
  const hasMixed = new Set<keyof TextMark>();

  const allMarkKeys = new Set<keyof TextMark>();
  marksFound.forEach((marks) => {
    Object.keys(marks).forEach((key) => allMarkKeys.add(key as keyof TextMark));
  });

  allMarkKeys.forEach((key) => {
    const firstValue = firstMarks[key];
    const allSame = marksFound.every((marks) => {
      const value = marks[key];
      return JSON.stringify(value) === JSON.stringify(firstValue);
    });

    if (allSame && firstValue !== undefined) {
      consistentMarks[key] = firstValue as any;
    } else if (!allSame) {
      const someHave = marksFound.some((marks) => marks[key] !== undefined);
      if (someHave) {
        hasMixed.add(key);
        if (typeof firstValue === "boolean") {
          consistentMarks[key] = true as any;
        }
      }
    }
  });

  return { marks: consistentMarks, hasMixed };
}

// Adjust font sizes in range
export function adjustFontSizesInRange(
  value: RichTextValue,
  startBlock: number,
  startOffset: number,
  endBlock: number,
  endOffset: number,
  delta: number,
): RichTextValue {
  return value.map((block, index) => {
    if (index < startBlock || index > endBlock) {
      return block;
    }

    const blockLength = block.content.reduce(
      (sum, node) => sum + node.text.length,
      0,
    );

    const start = index === startBlock ? startOffset : 0;
    const end = index === endBlock ? endOffset : blockLength;

    const result: TextNode[] = [];
    let currentPos = 0;

    for (const node of block.content) {
      const nodeEnd = currentPos + node.text.length;

      if (nodeEnd <= start || currentPos >= end) {
        result.push(node);
      } else if (currentPos >= start && nodeEnd <= end) {
        const currentSize =
          typeof node.marks?.fontSize === "number" ? node.marks?.fontSize : 16;

        const newSize = Math.max(8, Math.min(200, currentSize + delta));
        result.push({
          text: node.text,
          marks: { ...node.marks, fontSize: newSize },
        });
      } else {
        if (currentPos < start) {
          result.push({
            text: node.text.slice(0, start - currentPos),
            marks: node.marks,
          });
        }

        const selectionStart = Math.max(0, start - currentPos);
        const selectionEnd = Math.min(node.text.length, end - currentPos);

        const currentSize =
          typeof node.marks?.fontSize === "number" ? node.marks?.fontSize : 16;

        const newSize = Math.max(8, Math.min(200, currentSize + delta));

        result.push({
          text: node.text.slice(selectionStart, selectionEnd),
          marks: { ...node.marks, fontSize: newSize },
        });

        if (nodeEnd > end) {
          result.push({
            text: node.text.slice(end - currentPos),
            marks: node.marks,
          });
        }
      }

      currentPos = nodeEnd;
    }

    return {
      ...block,
      content: normalizeBlock(result),
    };
  });
}

// Adjust font weights in range
export function adjustFontWeightsInRange(
  value: RichTextValue,
  startBlock: number,
  startOffset: number,
  endBlock: number,
  endOffset: number,
  delta: number,
): RichTextValue {
  return value.map((block, index) => {
    if (index < startBlock || index > endBlock) {
      return block;
    }

    const blockLength = block.content.reduce(
      (sum, node) => sum + node.text.length,
      0,
    );

    const start = index === startBlock ? startOffset : 0;
    const end = index === endBlock ? endOffset : blockLength;

    const result: TextNode[] = [];
    let currentPos = 0;

    for (const node of block.content) {
      const nodeEnd = currentPos + node.text.length;

      if (nodeEnd <= start || currentPos >= end) {
        result.push(node);
      } else if (currentPos >= start && nodeEnd <= end) {
        const currentWeight =
          typeof node.marks?.fontWeight === "number"
            ? node.marks?.fontWeight
            : node.marks?.bold
              ? 700
              : 400;

        const newWeight = Math.max(
          100,
          Math.min(900, Math.round((currentWeight + delta) / 100) * 100),
        );

        const newMarks = { ...node.marks, fontWeight: newWeight };
        delete newMarks.bold;
        result.push({
          text: node.text,
          marks: newMarks,
        });
      } else {
        if (currentPos < start) {
          result.push({
            text: node.text.slice(0, start - currentPos),
            marks: node.marks,
          });
        }

        const selectionStart = Math.max(0, start - currentPos);
        const selectionEnd = Math.min(node.text.length, end - currentPos);

        const currentWeight =
          typeof node.marks?.fontWeight === "number"
            ? node.marks?.fontWeight
            : node.marks?.bold
              ? 700
              : 400;

        const newWeight = Math.max(
          100,
          Math.min(900, Math.round((currentWeight + delta) / 100) * 100),
        );

        const newMarks = { ...node.marks, fontWeight: newWeight };
        delete newMarks.bold;

        result.push({
          text: node.text.slice(selectionStart, selectionEnd),
          marks: newMarks,
        });

        if (nodeEnd > end) {
          result.push({
            text: node.text.slice(end - currentPos),
            marks: node.marks,
          });
        }
      }

      currentPos = nodeEnd;
    }

    return {
      ...block,
      content: normalizeBlock(result),
    };
  });
}

// Get selection positions from editor element and rich text value
export function getSelectionPositions(
  editorElement: HTMLElement,
  richTextValue: RichTextValue,
  defaultView: Window,
): {
  startPos: { blockIndex: number; offset: number };
  endPos: { blockIndex: number; offset: number };
} {
  const selection = defaultView.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return {
      startPos: { blockIndex: -1, offset: -1 },
      endPos: { blockIndex: -1, offset: -1 },
    };
  }

  const range = selection.getRangeAt(0);

  // Helper function to get text offset
  const getTextOffset = (
    root: Node,
    node: Node,
    offset: number,
    defaultView: Window,
  ): number => {
    let pos = 0;
    const walker = defaultView.document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
    );

    let currentNode = walker.nextNode();
    while (currentNode) {
      if (currentNode === node) {
        return pos + offset;
      }

      pos += currentNode.textContent?.length || 0;
      currentNode = walker.nextNode();
    }

    return pos;
  };

  const startOffset = getTextOffset(
    editorElement,
    range.startContainer,
    range.startOffset,
    defaultView,
  );

  const endOffset = getTextOffset(
    editorElement,
    range.endContainer,
    range.endOffset,
    defaultView,
  );

  const startPos = getBlockPosition(richTextValue, startOffset);
  const endPos = getBlockPosition(richTextValue, endOffset);

  return { startPos, endPos };
}
