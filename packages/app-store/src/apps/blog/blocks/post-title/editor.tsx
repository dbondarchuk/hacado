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
import { BlogPostTitleProps, styles } from "./schema";

export const BlogPostTitleEditor = ({ props, style }: BlogPostTitleProps) => {
  const currentBlock = useCurrentBlock<BlogPostTitleProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const args = useEditorArgs();
  const t = useI18n<BlogPublicNamespace, BlogPublicKeys>(blogPublicNamespace);

  // Get title from args.post.title
  const title = args?.post?.title;
  const showError = !title;

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
        {showError ? t("notInBlogContext") : title}
      </span>
    </>
  );
};
