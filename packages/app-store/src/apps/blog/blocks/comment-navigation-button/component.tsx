import { getI18nAsync } from "@hacado/i18n/server";
import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import {
  BlogCommentNavigationButtonProps,
  styles,
} from "./schema";

type BlogCommentNavigationButtonComponentProps = {
  direction: "prev" | "next";
  href: string;
  style: BlogCommentNavigationButtonProps["style"];
  blockBase?: { className?: string; id?: string };
};

export const BlogCommentNavigationButtonComponent = async ({
  direction,
  href,
  style,
  blockBase,
}: BlogCommentNavigationButtonComponentProps) => {
  const t = await getI18nAsync("app_blog_public");
  const className = generateClassName();
  const base = blockBase;

  const label =
    direction === "prev"
      ? t("block.commentsList.previous")
      : t("block.commentsList.next");

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <a href={href} className={cn(className, base?.className)} id={base?.id}>
        {label}
      </a>
    </>
  );
};
