"use client";

import {
  useBlockEditor,
  useCurrentBlock,
  useEditorArgs,
} from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { useMemo } from "react";
import {
  BlogPublicKeys,
  BlogPublicNamespace,
  blogPublicNamespace,
} from "../../translations/types";
import { getFormatPreview } from "./formats";
import {
  BlogPostAuthorProps,
  BlogPostAuthorPropsDefaults,
  styles,
} from "./schema";

export const BlogPostAuthorEditor = ({ props, style }: BlogPostAuthorProps) => {
  const currentBlock = useCurrentBlock<BlogPostAuthorProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const args = useEditorArgs();
  const t = useI18n<BlogPublicNamespace, BlogPublicKeys>(blogPublicNamespace);

  const className = useClassName();
  const base = currentBlock?.base;

  const format =
    currentBlock?.data?.props?.format ??
    BlogPostAuthorPropsDefaults.props.format;

  const label = useMemo(() => {
    if (!args?.post) {
      return t("notInBlogContext");
    }

    return getFormatPreview(format, t);
  }, [args?.post, format, t]);

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
        {label}
      </span>
    </>
  );
};
