"use client";

import {
  EditorBlock,
  useBlockChildrenBlockIds,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { X } from "lucide-react";
import { StickyBannerProps } from "./schema";
import { styles } from "./styles";

const disable = {
  disableMove: true,
  disableDelete: true,
  disableClone: true,
  disableDrag: true,
};

export const StickyBannerEditor = ({ props, style }: StickyBannerProps) => {
  const currentBlock = useCurrentBlock<StickyBannerProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const contentId = useBlockChildrenBlockIds(
    currentBlock.id,
    "props.content",
  )?.[0];
  const showCloseButton = props?.showCloseButton ?? true;
  const position = props?.position ?? "bottom";
  const className = useClassName();
  const base = currentBlock.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <div
        className="relative bg-muted flex flex-col grow w-full"
        {...overlayProps}
      >
        <div
          className={cn("relative w-full", className, base?.className)}
          id={base?.id}
        >
          {showCloseButton && (
            <div
              className={cn(
                "absolute right-6 z-10 flex size-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm pointer-events-none",
                position === "bottom"
                  ? "top-0 -translate-y-1/2"
                  : "bottom-0 translate-y-1/2",
              )}
            >
              <X className="size-3.5" />
              <span className="sr-only">Close</span>
            </div>
          )}
          {!!contentId && (
            <EditorBlock
              blockId={contentId}
              {...disable}
              index={0}
              parentBlockId={currentBlock.id}
              parentProperty="content"
            />
          )}
        </div>
      </div>
    </>
  );
};
