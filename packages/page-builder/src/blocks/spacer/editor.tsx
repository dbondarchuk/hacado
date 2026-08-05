"use client";

import { useBlockEditor, useCurrentBlock } from "@hacado/builder";
import { useResizeBlockStyles } from "@hacado/page-builder-base";
import { SpacerProps } from "./schema";
import { Spacer } from "./spacer";

export const SpacerEditor = ({}) => {
  const currentBlock = useCurrentBlock<SpacerProps>();
  const resizeProps = useResizeBlockStyles();
  const overlayProps = useBlockEditor(currentBlock.id, resizeProps);

  return (
    <Spacer {...currentBlock.data} block={currentBlock} {...overlayProps} />
  );
};
