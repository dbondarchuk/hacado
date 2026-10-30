"use client";

import { useCurrentBlock } from "@hacado/builder/editor";
import { useBlockEditor } from "@hacado/builder/overlay";
import { BlockStyle, useClassName } from "@hacado/page-builder-base/helpers";
import { cn } from "@hacado/ui";
import { PhraseCycleClient } from "./phrase-cycle.client";
import { PhraseCycleProps } from "./schema";
import { styles } from "./styles";

export function PhraseCycleEditor({ props, style }: PhraseCycleProps) {
  const currentBlock = useCurrentBlock<PhraseCycleProps>();
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
      <PhraseCycleClient
        className={cn(className, base?.className)}
        id={base?.id}
        phrases={props.phrases ?? []}
        enterMotion={props.enterMotion ?? "fade-up"}
        exitMotion={props.exitMotion ?? "fade-up"}
        enterDurationMs={props.enterDurationMs ?? 450}
        exitDurationMs={props.exitDurationMs ?? 400}
        pauseAfterPhraseMs={props.pauseAfterPhraseMs ?? 1600}
        {...overlayProps}
      />
    </>
  );
}
