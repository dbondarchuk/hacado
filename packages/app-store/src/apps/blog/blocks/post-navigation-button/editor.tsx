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
  BlogPostNavigationButtonProps,
  BlogPostNavigationButtonPropsDefaults,
  styles,
} from "./schema";

export const BlogPostNavigationButtonEditor = ({
  props,
  style,
}: BlogPostNavigationButtonProps) => {
  const currentBlock = useCurrentBlock<BlogPostNavigationButtonProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const t = useI18n<BlogPublicNamespace, BlogPublicKeys>(blogPublicNamespace);

  const direction =
    props?.direction ?? BlogPostNavigationButtonPropsDefaults.props.direction;

  const buttonText =
    direction === "prev"
      ? t("block.postsList.previous" satisfies BlogPublicKeys)
      : t("block.postsList.next" satisfies BlogPublicKeys);

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
        href="#"
        className={cn(className, base?.className)}
        id={base?.id}
        {...overlayProps}
        onClick={(e) => {
          e.preventDefault();
          overlayProps?.onClick?.(e);
        }}
      >
        {buttonText}
      </a>
    </>
  );
};
