"use client";

import type React from "react";
import { createContext, useCallback, useContext, useRef } from "react";
import type {
  RichTextValue,
  TextMark,
  VariableData,
} from "../lib/rich-text-types";
import {
  applyMarksToRange,
  getBlockPosition,
  getMarksInRange,
  normalizeRichText,
  removeMarkFromRange,
} from "../lib/rich-text-utils";
import type { RTEContextValue, SelectionRange } from "./types";

const RTEContext = createContext<RTEContextValue | null>(null);

export function useRTEContext(): RTEContextValue {
  const context = useContext(RTEContext);
  if (!context) {
    throw new Error("useRTEContext must be used within RTEProvider");
  }

  return context;
}

export interface RTEProviderProps {
  value: RichTextValue;
  onChange: (value: RichTextValue) => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
  defaultView: Window;
  documentElement: Document;
  variables?: VariableData;
  historyIndex: number;
  historyLength: number;
  onHistoryChange: (index: number) => void;
  disabledFeatures?: (keyof TextMark | "clearFormat" | "undo" | "redo")[];
  registerPopoverRef?: (element: HTMLElement | null) => () => void;
  children: React.ReactNode;
}

export function RTEProvider({
  value,
  onChange,
  editorRef,
  defaultView,
  documentElement,
  variables,
  historyIndex,
  historyLength,
  onHistoryChange,
  disabledFeatures,
  registerPopoverRef,
  children,
}: RTEProviderProps) {
  const savedSelectionRef = useRef<{ start: number; end: number } | null>(null);

  const getTextOffset = useCallback(
    (root: Node, node: Node, offset: number): number => {
      let pos = 0;
      const walker = documentElement.createTreeWalker(
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
    },
    [documentElement],
  );

  const getSelection = useCallback((): SelectionRange | null => {
    if (!editorRef.current) return null;

    const selection = defaultView.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const start = getTextOffset(
      editorRef.current,
      range.startContainer,
      range.startOffset,
    );

    const end = getTextOffset(
      editorRef.current,
      range.endContainer,
      range.endOffset,
    );

    const startPos = getBlockPosition(value, start);
    const endPos = getBlockPosition(value, end);

    if (startPos.blockIndex === -1 || endPos.blockIndex === -1) {
      return null;
    }

    return {
      start: startPos,
      end: endPos,
    };
  }, [editorRef, defaultView, getTextOffset, value]);

  const getActiveMarks = useCallback((): {
    marks: Partial<TextMark>;
    hasMixed: Set<keyof TextMark>;
  } => {
    const selection = getSelection();
    if (!selection) {
      return { marks: {}, hasMixed: new Set() };
    }

    return getMarksInRange(
      value,
      selection.start.blockIndex,
      selection.start.offset,
      selection.end.blockIndex,
      selection.end.offset,
    );
  }, [getSelection, value]);

  const applyFormat = useCallback(
    (
      type: keyof TextMark,
      formatValue?: string | number | boolean | "inherit",
    ) => {
      const selection = defaultView.getSelection();
      if (!selection || selection.rangeCount === 0 || !editorRef.current)
        return;

      const range = selection.getRangeAt(0);
      const start = getTextOffset(
        editorRef.current,
        range.startContainer,
        range.startOffset,
      );

      const end = getTextOffset(
        editorRef.current,
        range.endContainer,
        range.endOffset,
      );

      if (start === end) return;

      const startPos = getBlockPosition(value, start);
      const endPos = getBlockPosition(value, end);

      const activeMarks = getActiveMarks();
      let newValue: RichTextValue;

      if (formatValue === "inherit") {
        newValue = removeMarkFromRange(
          value,
          startPos.blockIndex,
          startPos.offset,
          endPos.blockIndex,
          endPos.offset,
          type,
        );
      } else if (typeof formatValue === "boolean") {
        if (activeMarks.marks[type]) {
          newValue = removeMarkFromRange(
            value,
            startPos.blockIndex,
            startPos.offset,
            endPos.blockIndex,
            endPos.offset,
            type,
          );
        } else {
          newValue = applyMarksToRange(
            value,
            startPos.blockIndex,
            startPos.offset,
            endPos.blockIndex,
            endPos.offset,
            { [type]: true },
          );
        }
      } else if (formatValue !== undefined) {
        newValue = applyMarksToRange(
          value,
          startPos.blockIndex,
          startPos.offset,
          endPos.blockIndex,
          endPos.offset,
          { [type]: formatValue },
        );
      } else {
        if (activeMarks.marks[type]) {
          newValue = removeMarkFromRange(
            value,
            startPos.blockIndex,
            startPos.offset,
            endPos.blockIndex,
            endPos.offset,
            type,
          );
        } else {
          newValue = applyMarksToRange(
            value,
            startPos.blockIndex,
            startPos.offset,
            endPos.blockIndex,
            endPos.offset,
            { [type]: true },
          );
        }
      }

      onChange(normalizeRichText(newValue));
    },
    [editorRef, defaultView, getTextOffset, value, getActiveMarks, onChange],
  );

  const clearFormat = useCallback(() => {
    const selection = defaultView.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;

    const range = selection.getRangeAt(0);
    const start = getTextOffset(
      editorRef.current,
      range.startContainer,
      range.startOffset,
    );

    const end = getTextOffset(
      editorRef.current,
      range.endContainer,
      range.endOffset,
    );

    if (start === end) return;

    const startPos = getBlockPosition(value, start);
    const endPos = getBlockPosition(value, end);

    const newValue = value.map((block, blockIndex) => {
      if (blockIndex < startPos.blockIndex || blockIndex > endPos.blockIndex) {
        return block;
      }

      const blockLength = block.content.reduce(
        (sum, node) => sum + node.text.length,
        0,
      );

      const rangeStart =
        blockIndex === startPos.blockIndex ? startPos.offset : 0;

      const rangeEnd =
        blockIndex === endPos.blockIndex ? endPos.offset : blockLength;

      const result: typeof block.content = [];
      let currentPos = 0;

      for (const node of block.content) {
        const nodeEnd = currentPos + node.text.length;

        if (nodeEnd <= rangeStart || currentPos >= rangeEnd) {
          result.push(node);
        } else if (currentPos >= rangeStart && nodeEnd <= rangeEnd) {
          result.push({ text: node.text });
        } else {
          if (currentPos < rangeStart) {
            result.push({
              text: node.text.slice(0, rangeStart - currentPos),
              marks: node.marks,
            });
          }

          const selectionStart = Math.max(0, rangeStart - currentPos);
          const selectionEnd = Math.min(
            node.text.length,
            rangeEnd - currentPos,
          );

          result.push({
            text: node.text.slice(selectionStart, selectionEnd),
          });

          if (nodeEnd > rangeEnd) {
            result.push({
              text: node.text.slice(rangeEnd - currentPos),
              marks: node.marks,
            });
          }
        }

        currentPos = nodeEnd;
      }

      return { ...block, content: result };
    });

    onChange(normalizeRichText(newValue));
  }, [editorRef, defaultView, getTextOffset, value, onChange]);

  const saveSelection = useCallback(() => {
    if (!editorRef.current) return;

    const selection = defaultView.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const start = getTextOffset(
      editorRef.current,
      range.startContainer,
      range.startOffset,
    );

    const end = getTextOffset(
      editorRef.current,
      range.endContainer,
      range.endOffset,
    );

    savedSelectionRef.current = { start, end };
  }, [editorRef, defaultView, getTextOffset]);

  const setRangeFromOffset = useCallback(
    (root: Node, range: Range, start: number, end: number) => {
      let pos = 0;
      const walker = documentElement.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
      );

      let startSet = false;
      let endSet = false;

      let currentNode = walker.nextNode();
      while (currentNode && !endSet) {
        const nodeLength = currentNode.textContent?.length || 0;

        if (!startSet && pos + nodeLength >= start) {
          range.setStart(currentNode, Math.min(start - pos, nodeLength));
          startSet = true;
        }

        if (startSet && pos + nodeLength >= end) {
          range.setEnd(currentNode, Math.min(end - pos, nodeLength));
          endSet = true;
        }

        pos += nodeLength;
        currentNode = walker.nextNode();
      }
    },
    [documentElement],
  );

  const restoreSelection = useCallback(() => {
    if (!editorRef.current || !savedSelectionRef.current)
      return Promise.resolve();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const sel = defaultView.getSelection();
        if (sel && editorRef.current && savedSelectionRef.current) {
          const newRange = documentElement.createRange();
          setRangeFromOffset(
            editorRef.current,
            newRange,
            savedSelectionRef.current.start,
            savedSelectionRef.current.end,
          );

          sel.removeAllRanges();
          sel.addRange(newRange);
        }

        resolve();
      }, 0);
    });
  }, [editorRef, defaultView, documentElement, setRangeFromOffset]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      onHistoryChange(newIndex);
    }
  }, [historyIndex, onHistoryChange]);

  const redo = useCallback(() => {
    if (historyIndex < historyLength - 1) {
      const newIndex = historyIndex + 1;
      onHistoryChange(newIndex);
    }
  }, [historyIndex, historyLength, onHistoryChange]);

  const contextValue: RTEContextValue = {
    applyFormat,
    getSelection,
    getActiveMarks,
    clearFormat,
    value,
    onChange,
    editorRef,
    defaultView,
    documentElement,
    variables,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < historyLength - 1,
    saveSelection,
    restoreSelection,
    disabledFeatures,
    registerPopoverRef,
  };

  return (
    <RTEContext.Provider value={contextValue}>{children}</RTEContext.Provider>
  );
}
