"use client";

import { useCurrentBlock } from "@hacado/builder/editor";
import { useBlockEditor } from "@hacado/builder/overlay";
import { EditorRedirect } from "./editor-redirect";
import { RedirectDefaultUrl, RedirectProps } from "./schema";

export const RedirectEditor = () => {
  const currentBlock = useCurrentBlock<RedirectProps>();
  const overlayProps = useBlockEditor(currentBlock.id);

  const url = currentBlock.data?.props?.url || RedirectDefaultUrl;

  return <EditorRedirect url={url} {...overlayProps} />;
};
