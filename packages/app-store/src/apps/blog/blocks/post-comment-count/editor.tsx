"use client";

import { useCurrentBlock, useEditorArgs } from "@hacado/builder/editor";
import { useBlockEditor } from "@hacado/builder/overlay";
import { BlogPostCommentCountEditorWrapper } from "./editor-wrapper";
import { BlogPostCommentCountProps } from "./schema";

export const BlogPostCommentCountEditor = ({
  props,
  style,
}: BlogPostCommentCountProps) => {
  const currentBlock = useCurrentBlock<BlogPostCommentCountProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const args = useEditorArgs();

  return (
    <BlogPostCommentCountEditorWrapper
      props={currentBlock?.data?.props ?? props}
      style={style}
      blockBase={currentBlock?.base}
      args={args}
      overlayProps={overlayProps}
    />
  );
};
