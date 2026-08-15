"use client";

import {
  useBlockEditor,
  useCurrentBlock,
  useEditorArgs,
} from "@hacado/builder";
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
