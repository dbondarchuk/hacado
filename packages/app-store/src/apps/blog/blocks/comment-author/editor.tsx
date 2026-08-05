"use client";

import {
  useBlockEditor,
  useCurrentBlock,
  useEditorArgs,
} from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import {
  BlogPublicKeys,
  BlogPublicNamespace,
  blogPublicNamespace,
} from "../../translations/types";
import { blogCommentFixtures } from "../comment-fixtures";
import { BlogCommentAuthorProps, styles } from "./schema";

export const BlogCommentAuthorEditor = ({ style }: BlogCommentAuthorProps) => {
  const currentBlock = useCurrentBlock<BlogCommentAuthorProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const args = useEditorArgs();
  const t = useI18n<BlogPublicNamespace, BlogPublicKeys>(blogPublicNamespace);

  const authorName =
    args?.comment?.authorName ??
    args?._item?.authorName ??
    blogCommentFixtures[0]?.authorName;

  const className = useClassName();
  const base = currentBlock?.base;

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        isEditor
      />
      <span
        className={cn(className, base?.className)}
        id={base?.id}
        {...overlayProps}
      >
        {authorName ?? t("notInBlogContext")}
      </span>
    </>
  );
};
