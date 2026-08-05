"use client";

import {
  EditorArgsContext,
  EditorChildren,
  useBlockEditor,
  useCurrentBlock,
  useEditorArgs,
} from "@hacado/builder";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import { useMemo } from "react";
import { blogCommentFixtures } from "../comment-fixtures";
import { BlogCommentContainerProps, styles } from "./schema";

export const BlogCommentContainerEditor = ({
  style,
  props,
}: BlogCommentContainerProps) => {
  const currentBlock = useCurrentBlock<BlogCommentContainerProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const existingArgs = useEditorArgs();

  const className = useClassName();
  const base = currentBlock.base;

  const comment =
    (existingArgs?.comment as (typeof blogCommentFixtures)[0]) ??
    (existingArgs?._item as (typeof blogCommentFixtures)[0]) ??
    blogCommentFixtures[0];

  const extendedArgs = useMemo(
    () => ({
      ...existingArgs,
      comment,
    }),
    [existingArgs, comment],
  );

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={currentBlock.data?.style}
      />
      <div className={className} id={base?.id} {...overlayProps}>
        <EditorArgsContext.Provider value={extendedArgs}>
          <EditorChildren blockId={currentBlock.id} property="props" />
        </EditorArgsContext.Provider>
      </div>
    </>
  );
};
