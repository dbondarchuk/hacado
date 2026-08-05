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
import { CommentsPaginationContext } from "./comments-pagination-context";
import { BlogCommentsContainerProps, styles } from "./schema";

export const BlogCommentsContainerEditor = ({
  style,
  props,
}: BlogCommentsContainerProps) => {
  const currentBlock = useCurrentBlock<BlogCommentsContainerProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const existingArgs = useEditorArgs();
  const metadata = currentBlock?.metadata;
  const appId = metadata?.blogAppId;

  const className = useClassName();
  const base = currentBlock.base;

  const extendedArgs = useMemo(
    () => ({
      ...existingArgs,
      comments: blogCommentFixtures,
      totalComments: blogCommentFixtures.length,
      page: 1,
      commentsPerPage: props?.commentsPerPage ?? 10,
      blogAppId: appId ?? existingArgs?.blogAppId,
      blogCommentsConfig: {
        commentsEnabled: true,
        commentsPremoderation: true,
      },
    }),
    [existingArgs, appId, props?.commentsPerPage],
  );

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={currentBlock.data?.style}
      />
      <div className={className} id={base?.id} {...overlayProps}>
        <CommentsPaginationContext.Provider
          value={{
            page: 1,
            setPage: () => {},
            totalComments: blogCommentFixtures.length,
            commentsPerPage: props?.commentsPerPage ?? 10,
            comments: blogCommentFixtures,
            isLoading: false,
            refetch: () => {},
          }}
        >
          <EditorArgsContext.Provider value={extendedArgs}>
            <EditorChildren blockId={currentBlock.id} property="props" />
          </EditorArgsContext.Provider>
        </CommentsPaginationContext.Provider>
      </div>
    </>
  );
};
