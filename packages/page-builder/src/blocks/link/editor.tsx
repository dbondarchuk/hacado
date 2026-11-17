"use client";

import { EditorChildren } from "@hacado/builder/blocks";
import { useCurrentBlock } from "@hacado/builder/editor";
import { useBlockEditor } from "@hacado/builder/overlay";
import { BlockStyle, useClassName } from "@hacado/page-builder-base/helpers";
import { cn } from "@hacado/ui/cn";
import { INLINE_CHILDREN_ALLOW } from "../child-allow";
import { LinkProps } from "./schema";
import { styles } from "./styles";
import { getDefaults } from "./styles.default";

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
          allow={INLINE_CHILDREN_ALLOW}
        />
      </span>
    </>
  );
};
