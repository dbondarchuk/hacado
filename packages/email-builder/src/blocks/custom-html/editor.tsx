"use client";

import { useCurrentBlock } from "@hacado/builder/editor";
import { useBlockEditor } from "@hacado/builder/overlay";
import { CustomHTMLProps } from "./schema";

export const CustomHTMLEditor = () => {
  const currentBlock = useCurrentBlock<CustomHTMLProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const html = (currentBlock?.data?.props as any)?.html ?? "";
  const base = currentBlock?.base;

  return (
    <div
      className={base?.className}
      id={base?.id}
      {...overlayProps}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
