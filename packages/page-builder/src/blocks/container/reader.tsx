import { ReaderBlock } from "@hacado/builder";
import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { ContainerReaderProps, styles } from "./schema";

export const ContainerReader = ({
  style,
  props,
  block,
  ...rest
}: ContainerReaderProps) => {
  const children = props?.children ?? [];

  const className = generateClassName();
  const base = block.base;
  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <div className={cn(className, base?.className)} id={base?.id}>
        {children.map((child) => (
          <ReaderBlock key={child.id} {...rest} block={child} />
        ))}
      </div>
    </>
  );
};
