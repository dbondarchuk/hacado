"use client";

import { useBlockEditor, useCurrentBlock } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { BlockStyle, useClassName } from "@timelish/page-builder-base";
import { cn } from "@timelish/ui";
import {
  BlogPublicKeys,
  BlogPublicNamespace,
  blogPublicNamespace,
} from "../../translations/types";
import {
  BlogCommentNavigationButtonProps,
  BlogCommentNavigationButtonPropsDefaults,
  styles,
} from "./schema";

export const BlogCommentNavigationButtonEditor = ({
  props,
  style,
}: BlogCommentNavigationButtonProps) => {
  const currentBlock = useCurrentBlock<BlogCommentNavigationButtonProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const t = useI18n<BlogPublicNamespace, BlogPublicKeys>(blogPublicNamespace);

  const direction =
    props?.direction ??
    BlogCommentNavigationButtonPropsDefaults.props.direction;

  const buttonText =
    direction === "prev"
      ? t("block.commentsList.previous" satisfies BlogPublicKeys)
      : t("block.commentsList.next" satisfies BlogPublicKeys);

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
      <button
        type="button"
        className={cn(className, base?.className)}
        id={base?.id}
        {...overlayProps}
        onClick={(e) => {
          e.preventDefault();
          overlayProps?.onClick?.(e);
        }}
      >
        {buttonText}
      </button>
    </>
  );
};
