"use client";

import {
  EditorChildren,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { MarketingFeaturesShowcaseProps } from "./schema";
import { styles } from "./styles";

const allowFeature: { type: string[] } = {
  type: ["MarketingFeatureItem"],
};

export const MarketingFeaturesShowcaseEditor = ({
  props,
  style,
}: MarketingFeaturesShowcaseProps) => {
  const currentBlock = useCurrentBlock<MarketingFeaturesShowcaseProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const className = useClassName();
  const base = currentBlock?.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <section
        className={cn(
          "marketing-features-showcase",
          className,
          base?.className,
        )}
        id={base?.id}
        {...overlayProps}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 marketing-features-showcase-row">
          <EditorChildren
            blockId={currentBlock.id}
            property="props.features"
            allow={allowFeature}
          />
        </div>
      </section>
    </>
  );
};
