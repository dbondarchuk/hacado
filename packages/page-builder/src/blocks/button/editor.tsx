"use client";

import {
  BlockFilterRule,
  EditorChildren,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import {
  BlockStyle,
  useClassName,
  useResizeBlockStyles,
} from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { ButtonProps } from "./schema";
import { styles } from "./styles";
import { getDefaults } from "./styles.default";

const disable = {
  disableMove: true,
  disableDelete: true,
  disableClone: true,
  disableDrag: true,
};

const allowOnly: BlockFilterRule = {
  capabilities: ["inline"],
};

export const ButtonEditor = ({ props, style }: ButtonProps) => {
  const currentBlock = useCurrentBlock<ButtonProps>();
  const onResize = useResizeBlockStyles();
  const overlayProps = useBlockEditor(currentBlock.id, onResize);

  const base = currentBlock.base;

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
