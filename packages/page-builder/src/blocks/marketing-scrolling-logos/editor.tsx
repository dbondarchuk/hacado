"use client";

import {
  EditorChildren,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { MarketingScrollingLogosProps } from "./schema";
import { styles } from "./styles";

export const MarketingScrollingLogosEditor = ({
  props,
  style,
}: MarketingScrollingLogosProps) => {
  const currentBlock = useCurrentBlock<MarketingScrollingLogosProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const className = useClassName();
  const base = currentBlock?.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <section
        className={cn(className, base?.className)}
        id={base?.id}
        {...overlayProps}
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex gap-4 overflow-x-auto border border-dashed border-muted rounded-lg p-4">
            <EditorChildren blockId={currentBlock.id} property="props.items" />
          </div>
        </div>
      </section>
    </>
  );
};
