import { ReaderBlock } from "@hacado/builder";
import {
  BackgroundVideoLayer,
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { InlineContainerReaderProps, styles } from "./schema";

export const InlineContainerReader = ({
  style,
  props,
  block,
  ...rest
}: InlineContainerReaderProps) => {
  const children = props?.children ?? [];

  const className = generateClassName();
  const base = block.base;
  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <span className={cn(className, base?.className)} id={base?.id}>
        <BackgroundVideoLayer style={style} />
        {children.map((child) => (
          <ReaderBlock key={child.id} {...rest} block={child} />
        ))}
      </span>
    </>
  );
};
