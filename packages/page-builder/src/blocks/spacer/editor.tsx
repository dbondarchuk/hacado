"use client";

import { useCurrentBlock } from "@hacado/builder/editor";
import { useBlockEditor } from "@hacado/builder/overlay";
import { useResizeBlockStyles } from "@hacado/page-builder-base/helpers";
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
