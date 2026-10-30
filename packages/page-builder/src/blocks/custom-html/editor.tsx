"use client";

import { useCurrentBlock } from "@hacado/builder/editor";
import { useBlockEditor } from "@hacado/builder/overlay";
import { BlockStyle, useClassName } from "@hacado/page-builder-base/helpers";
import { cn } from "@hacado/ui";
import { CustomHTMLProps } from "./schema";
import { styles } from "./styles";
import { getDefaults } from "./styles.default";

export const CustomHTMLEditor = ({ props, style }: CustomHTMLProps) => {
  const currentBlock = useCurrentBlock<CustomHTMLProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const html = (currentBlock?.data?.props as any)?.html ?? "";
  const base = currentBlock?.base;

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

      <div
        className={cn(className, base?.className)}
        id={base?.id}
        {...overlayProps}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
};
