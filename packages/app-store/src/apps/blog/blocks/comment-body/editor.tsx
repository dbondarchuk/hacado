"use client";

import { useCurrentBlock, useEditorArgs } from "@hacado/builder/editor";
import { useBlockEditor } from "@hacado/builder/overlay";
import { useI18n } from "@hacado/i18n/client";
import { BlockStyle, useClassName } from "@hacado/page-builder-base/helpers";
import { cn } from "@hacado/ui/cn";
import {
  BlogPublicKeys,
  BlogPublicNamespace,
  blogPublicNamespace,
} from "../../translations/types";
import { blogCommentFixtures } from "../comment-fixtures";
import { BlogCommentBodyProps, styles } from "./schema";

export const BlogCommentBodyEditor = ({ style }: BlogCommentBodyProps) => {
  const currentBlock = useCurrentBlock<BlogCommentBodyProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const args = useEditorArgs();
  const t = useI18n<BlogPublicNamespace, BlogPublicKeys>(blogPublicNamespace);

  const body =
    args?.comment?.body ?? args?._item?.body ?? blogCommentFixtures[0]?.body;

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
      <p
        className={cn(className, "whitespace-pre-wrap", base?.className)}
        id={base?.id}
        {...overlayProps}
      >
        {body ?? t("notInBlogContext")}
      </p>
    </>
  );
};
