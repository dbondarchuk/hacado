"use client";

import {
  BlockFilterRule,
  EditorChildren,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { LinkProps } from "./schema";
import { styles } from "./styles";
import { getDefaults } from "./styles.default";

const allowOnly: BlockFilterRule = {
  capabilities: ["inline"],
};

export const LinkEditor = ({ props, style }: LinkProps) => {
  const currentBlock = useCurrentBlock<LinkProps>();
  const base = currentBlock.base;
  const overlayProps = useBlockEditor(currentBlock.id);

  const className = useClassName();
  const defaults = getDefaults({ props, style }, true);

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        defaults={defaults}
        isEditor
      />
      <span
        className={cn(className, base?.className)}
        id={base?.id}
        {...overlayProps}
      >
        <EditorChildren
          blockId={currentBlock.id}
          property="props"
          allow={allowOnly}
        />
      </span>
    </>
  );
};
