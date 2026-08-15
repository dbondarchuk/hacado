"use client";

import {
  BlockFilterRule,
  EditorEmbeddedSlot,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import {
  BlockStyle,
  ReplaceOriginalColors,
  useClassName,
} from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { MarketingFeatureItemProps } from "./schema";
import { styles } from "./styles";

const allowHeading: BlockFilterRule = { capabilities: ["heading"] };

export const MarketingFeatureItemEditor = ({
  props,
  style,
}: MarketingFeatureItemProps) => {
  const currentBlock = useCurrentBlock<MarketingFeatureItemProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const className = useClassName();
  const base = currentBlock?.base;
  const parentBlockId = currentBlock.id;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <ReplaceOriginalColors />
      <div
        className={cn(
          "flex flex-col gap-4 rounded-2xl border border-border bg-card p-6",
          className,
          base?.className,
        )}
        id={base?.id}
        {...overlayProps}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-xl transition-colors",
              "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
            )}
          >
            <EditorEmbeddedSlot
              parentBlockId={parentBlockId}
              childrenProperty="props.cardIcon"
              slotKey="cardIcon"
              maxChildren={1}
              className="flex h-full w-full items-center justify-center"
            />
          </div>
          <EditorEmbeddedSlot
            parentBlockId={parentBlockId}
            childrenProperty="props.title"
            slotKey="title"
            maxChildren={1}
            allow={allowHeading}
          />
          <EditorEmbeddedSlot
            parentBlockId={parentBlockId}
            childrenProperty="props.description"
            slotKey="description"
            maxChildren={1}
          />
        </div>
        <div className="space-y-3 border-t border-muted pt-3">
          <EditorEmbeddedSlot
            parentBlockId={parentBlockId}
            childrenProperty="props.detailHeadline"
            slotKey="detailHeadline"
            maxChildren={1}
            allow={allowHeading}
          />
          <EditorEmbeddedSlot
            parentBlockId={parentBlockId}
            childrenProperty="props.detailBullets"
            slotKey="detailBullets"
            maxChildren={1}
          />
        </div>
      </div>
    </>
  );
};
