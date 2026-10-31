"use client";

import { useCurrentBlock } from "@hacado/builder/editor";
import { useBlockEditor } from "@hacado/builder/overlay";
import { BlockStyle, useClassName } from "@hacado/page-builder-base/helpers";
import { cn } from "@hacado/ui/cn";
import { TypewriterTextProps } from "./schema";
import { styles } from "./styles";
import { TypewriterTextClient } from "./typewriter-text.client";

export function TypewriterTextEditor({ props, style }: TypewriterTextProps) {
  const currentBlock = useCurrentBlock<TypewriterTextProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const className = useClassName();
  const base = currentBlock?.base;

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        isEditor
      />
      <TypewriterTextClient
        className={cn(className, base?.className)}
        id={base?.id}
        phrases={props.phrases ?? []}
        typeDelayMs={props.typeDelayMs ?? 100}
        deleteDelayMs={props.deleteDelayMs ?? 50}
        pauseAfterPhraseMs={props.pauseAfterPhraseMs ?? 2000}
        showCursor={props.showCursor ?? true}
        {...overlayProps}
      />
    </>
  );
}
