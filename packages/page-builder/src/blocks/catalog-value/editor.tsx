"use client";

import { useBlockEditor, useCurrentBlock } from "@hacado/builder";
import { useResizeBlockStyles } from "@hacado/page-builder-base";
import { CatalogValueClient } from "./client-value";
import { CatalogValueProps } from "./schema";

export const CatalogValueEditor = ({ style }: CatalogValueProps) => {
  const currentBlock = useCurrentBlock<CatalogValueProps>();
  const onResize = useResizeBlockStyles();
  const overlayProps = useBlockEditor(currentBlock.id, onResize);

  return (
    <CatalogValueClient
      props={currentBlock?.data?.props}
      style={currentBlock?.data?.style ?? style}
      blockBase={currentBlock?.base}
      isEditor
      overlayProps={overlayProps}
    />
  );
};
