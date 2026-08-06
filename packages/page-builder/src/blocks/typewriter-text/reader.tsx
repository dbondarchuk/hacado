import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { TypewriterTextReaderProps } from "./schema";
import { styles } from "./styles";
import { TypewriterTextClient } from "./typewriter-text.client";

export const TypewriterTextReader = ({
  props,
  style,
  block,
}: TypewriterTextReaderProps) => {
  const className = generateClassName();
  const base = block.base;
  const p = props ?? {};

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <TypewriterTextClient
        className={cn(className, base?.className)}
        id={base?.id}
        phrases={p.phrases ?? []}
        typeDelayMs={p.typeDelayMs ?? 100}
        deleteDelayMs={p.deleteDelayMs ?? 50}
        pauseAfterPhraseMs={p.pauseAfterPhraseMs ?? 2000}
        showCursor={p.showCursor ?? true}
      />
    </>
  );
};
