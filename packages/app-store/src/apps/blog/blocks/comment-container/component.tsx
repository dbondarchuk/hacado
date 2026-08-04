import { ReaderBlock } from "@timelish/builder";
import { I18nText } from "@timelish/i18n/components";
import {
  BlockStyle,
  generateClassName,
} from "@timelish/page-builder-base/reader";
import { cn } from "@timelish/ui";
import { BlogCommentPublic } from "../../models";
import { BlogPublicAllKeys } from "../../translations/types";
import { BlogCommentContainerReaderProps, styles } from "./schema";

type BlogCommentContainerComponentProps = {
  comment: BlogCommentPublic | null;
  error: BlogPublicAllKeys | null;
  children: BlogCommentContainerReaderProps["props"]["children"];
  style: BlogCommentContainerReaderProps["style"];
  blockBase?: { className?: string; id?: string };
  restProps: any;
  isEditor?: boolean;
  args?: Record<string, unknown>;
};

export const BlogCommentContainerComponent = ({
  comment,
  error,
  children,
  style,
  blockBase,
  restProps,
  isEditor,
  args,
}: BlogCommentContainerComponentProps) => {
  const className = generateClassName();
  const base = blockBase;

  const newArgs = {
    ...args,
    comment,
  };

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <div className={cn(className, base?.className)} id={base?.id}>
        {error ? (
          <I18nText text={error} />
        ) : (
          children
            .filter(Boolean)
            .map((child) => (
              <ReaderBlock
                key={child.id}
                {...restProps}
                block={child}
                args={newArgs}
                isEditor={isEditor}
              />
            ))
        )}
      </div>
    </>
  );
};
