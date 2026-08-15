"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
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

type BlogCommentNavigationButtonEditorWrapperProps = {
  props: BlogCommentNavigationButtonProps["props"];
  style: BlogCommentNavigationButtonProps["style"];
  blockBase?: { className?: string; id?: string };
};

export const BlogCommentNavigationButtonEditorWrapper = ({
  props,
  style,
  blockBase,
}: BlogCommentNavigationButtonEditorWrapperProps) => {
  const t = useI18n<BlogPublicNamespace, BlogPublicKeys>(blogPublicNamespace);
  const direction =
    props?.direction ??
    BlogCommentNavigationButtonPropsDefaults.props.direction;

  const buttonText =
    direction === "prev"
      ? t("block.commentsList.previous" satisfies BlogPublicKeys)
      : t("block.commentsList.next" satisfies BlogPublicKeys);

  const className = generateClassName();
  const base = blockBase;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <button
        type="button"
        className={cn(className, base?.className)}
        id={base?.id}
        onClick={(e) => e.preventDefault()}
      >
        {buttonText}
      </button>
    </>
  );
};
