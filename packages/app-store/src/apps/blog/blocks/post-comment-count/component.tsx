import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { BlogPostCommentCountProps, styles } from "./schema";

type BlogPostCommentCountComponentProps = {
  label: string;
  style: BlogPostCommentCountProps["style"];
  blockBase?: { className?: string; id?: string };
  isEditor?: boolean;
  overlayProps?: Record<string, unknown>;
};

export const BlogPostCommentCountComponent = ({
  label,
  style,
  blockBase,
  isEditor,
  overlayProps,
}: BlogPostCommentCountComponentProps) => {
  const className = generateClassName();

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        isEditor={isEditor}
      />
      <span
        className={cn(className, blockBase?.className)}
        id={blockBase?.id}
        {...(isEditor ? overlayProps : {})}
      >
        {label}
      </span>
    </>
  );
};
