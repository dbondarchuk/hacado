"use client";

import { useCurrentBlock } from "@hacado/builder/editor";
import { useBlockEditor } from "@hacado/builder/overlay";
import {
  BlockStyle,
  useClassName,
  useResizeBlockStyles,
} from "@hacado/page-builder-base/helpers";
import { cn } from "@hacado/ui/cn";
import { Icon } from "@hacado/ui/icon";
import { Ref } from "react";
import { IconProps } from "./schema";
import { styles } from "./styles";
import { getDefaults } from "./styles.default";

export const IconEditor = ({ props, style }: IconProps) => {
  const currentBlock = useCurrentBlock<IconProps>();
  const onResize = useResizeBlockStyles();
  const overlayProps = useBlockEditor(currentBlock.id, onResize);

  const iconName = (currentBlock?.data?.props as any)?.icon ?? "star";
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

      <Icon
        name={iconName}
        className={cn(className, base?.className)}
        id={base?.id}
        onClick={overlayProps.onClick}
        ref={overlayProps.ref as Ref<SVGSVGElement>}
      />
    </>
  );
};
