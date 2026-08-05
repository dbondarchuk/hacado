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
import { BlogPostTagProps, BlogPostTagPropsDefaults, styles } from "./schema";

export const BlogPostTagEditor = ({ props, style }: BlogPostTagProps) => {
  const currentBlock = useCurrentBlock<BlogPostTagProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const args = useEditorArgs();
  const t = useI18n<BlogPublicNamespace, BlogPublicKeys>(blogPublicNamespace);

  // Get tag from args.tag
  const tag = args?.tag;
  const showError = !tag;

  // Get blogListUrl from props
  const blogListUrl =
    props?.blogListUrl ?? BlogPostTagPropsDefaults.props.blogListUrl;

  // Generate href for editor preview
  let href = "#";
  if (!showError && tag) {
    if (blogListUrl) {
      href = `${blogListUrl}?tag=${encodeURIComponent(tag)}`;
    } else {
      href = `?tag=${encodeURIComponent(tag)}`;
    }
  }

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
      <a
        href={href}
        className={cn(className, base?.className)}
        id={base?.id}
        {...overlayProps}
        onClick={(e) => {
          e.preventDefault();
          overlayProps?.onClick?.(e);
        }}
      >
        {showError ? t("notInBlogTagContext") : tag}
      </a>
    </>
  );
};
