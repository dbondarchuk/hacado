"use client";

import { useClipboard } from "@hacado/ui";
import { useCallback, useMemo, useState } from "react";
import { TEditorBlock } from "./core";

export const useBlockClipboard = (document?: Document) => {
  const {
    clipboardText,
    copyToClipboard: copyToClipboardBase,
    isPasteSupported,
  } = useClipboard(document);

  const [lastCopiedBlock, setLastCopiedBlock] = useState<TEditorBlock | null>(
    null,
  );

  const hasBlockClipboard = useMemo(() => {
    if (!isPasteSupported) return !!lastCopiedBlock;
    return clipboardText?.startsWith("block:");
  }, [clipboardText, lastCopiedBlock, isPasteSupported]);

  const clipboardBlock = useMemo(() => {
    if (!hasBlockClipboard) return null;
    if (lastCopiedBlock) return lastCopiedBlock;
    return JSON.parse(clipboardText.slice(6)) as TEditorBlock;
  }, [hasBlockClipboard, clipboardText, lastCopiedBlock]);

  const copyToClipboard = useCallback(
    (block: TEditorBlock | null | undefined) => {
      if (block) {
        copyToClipboardBase(`block:${JSON.stringify(block)}`);
        setLastCopiedBlock(block);
      }
    },
    [copyToClipboardBase, setLastCopiedBlock],
  );

  return { hasBlockClipboard, copyToClipboard, clipboardBlock };
};
