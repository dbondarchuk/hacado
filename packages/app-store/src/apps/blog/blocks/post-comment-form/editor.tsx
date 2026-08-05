"use client";

import {
  useBlockEditor,
  useCurrentBlock,
  useEditorArgs,
} from "@hacado/builder";
import { BlogPostCommentFormEditorWrapper } from "./editor-wrapper";
import { BlogPostCommentFormProps } from "./schema";

export const BlogPostCommentFormEditor = ({
  props,
  style,
}: BlogPostCommentFormProps) => {
  const currentBlock = useCurrentBlock<BlogPostCommentFormProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const args = useEditorArgs();
  const appId =
    (currentBlock?.metadata as { blogAppId?: string })?.blogAppId ??
    (args as { blogAppId?: string })?.blogAppId;

  return (
    <BlogPostCommentFormEditorWrapper
      props={currentBlock?.data?.props ?? props}
      style={style}
      blockBase={currentBlock?.base}
      args={args}
      appId={appId}
      overlayProps={overlayProps}
    />
  );
};
