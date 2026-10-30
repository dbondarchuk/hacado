import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui/cn";
import { PhraseCycleClient } from "./phrase-cycle.client";
import { PhraseCycleReaderProps } from "./schema";
import { styles } from "./styles";

export const PhraseCycleReader = ({
  props,
  style,
  block,
}: PhraseCycleReaderProps) => {
  const className = generateClassName();
  const base = block.base;
  const p = props ?? {};

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <PhraseCycleClient
        className={cn(className, base?.className)}
        id={base?.id}
        phrases={p.phrases ?? []}
        enterMotion={p.enterMotion ?? "fade-up"}
        exitMotion={p.exitMotion ?? "fade-up"}
        enterDurationMs={p.enterDurationMs ?? 450}
        exitDurationMs={p.exitDurationMs ?? 400}
        pauseAfterPhraseMs={p.pauseAfterPhraseMs ?? 1600}
      />
    </>
  );
};
