import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { BlogPostAuthorProps, styles } from "./schema";

type BlogPostAuthorComponentProps = {
  label: string;
  style: BlogPostAuthorProps["style"];
  blockBase?: { className?: string; id?: string };
  isEditor?: boolean;
  overlayProps?: Record<string, unknown>;
};

export const BlogPostAuthorComponent = ({
  label,
  style,
  blockBase,
  isEditor,
  overlayProps,
}: BlogPostAuthorComponentProps) => {
  const className = generateClassName();
  const base = blockBase;

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        isEditor={isEditor}
      />
      <span
        className={cn(className, base?.className)}
        id={base?.id}
        {...(isEditor ? overlayProps : {})}
      >
        {label}
      </span>
    </>
  );
};
