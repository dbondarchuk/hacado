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
  BlogPostNavigationButtonProps,
  BlogPostNavigationButtonPropsDefaults,
  styles,
} from "./schema";

type BlogPostNavigationButtonEditorWrapperProps = {
  props: BlogPostNavigationButtonProps["props"];
  style: BlogPostNavigationButtonProps["style"];
  blockBase?: { className?: string; id?: string };
};

export const BlogPostNavigationButtonEditorWrapper = ({
  props,
  style,
  blockBase,
}: BlogPostNavigationButtonEditorWrapperProps) => {
  const t = useI18n<BlogPublicNamespace, BlogPublicKeys>(blogPublicNamespace);
  const direction =
    props?.direction ?? BlogPostNavigationButtonPropsDefaults.props.direction;

  const buttonText =
    direction === "prev"
      ? t("block.postsList.previous" satisfies BlogPublicKeys)
      : t("block.postsList.next" satisfies BlogPublicKeys);

  const className = generateClassName();
  const base = blockBase;

  // In editor, always show with a placeholder href
  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <a
        href="#"
        className={cn(className, base?.className)}
        id={base?.id}
        onClick={(e) => e.preventDefault()}
      >
        {buttonText}
      </a>
    </>
  );
};
