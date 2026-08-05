import { getI18nAsync } from "@hacado/i18n/server";
import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { BlogPostNavigationButtonProps, styles } from "./schema";

type BlogPostNavigationButtonComponentProps = {
  direction: "prev" | "next";
  href: string;
  className?: string;
  id?: string;
  style: BlogPostNavigationButtonProps["style"];
  blockBase?: { className?: string; id?: string };
};

export const BlogPostNavigationButtonComponent = async ({
  direction,
  href,
  className: propClassName,
  id: propId,
  style,
  blockBase,
}: BlogPostNavigationButtonComponentProps) => {
  const className = generateClassName();
  const base = blockBase;

  const t = await getI18nAsync("app_blog_public");
  const buttonText =
    direction === "prev"
      ? t("block.postsList.previous")
      : t("block.postsList.next");

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <a
        href={href}
        className={cn(className, propClassName, base?.className)}
        id={propId || base?.id}
      >
        {buttonText}
      </a>
    </>
  );
};
