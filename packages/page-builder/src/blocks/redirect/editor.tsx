"use client";

import { useBlockEditor, useCurrentBlock } from "@hacado/builder";
import { EditorRedirect } from "./editor-redirect";
import { RedirectDefaultUrl, RedirectProps } from "./schema";

export const RedirectEditor = () => {
  const currentBlock = useCurrentBlock<RedirectProps>();
  const overlayProps = useBlockEditor(currentBlock.id);

  const url = currentBlock.data?.props?.url || RedirectDefaultUrl;

  return <EditorRedirect url={url} {...overlayProps} />;
};
