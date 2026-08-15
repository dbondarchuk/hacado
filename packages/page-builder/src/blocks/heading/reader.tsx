import { ReaderBlock } from "@hacado/builder";
import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { DefaultHeadingLevel, HeadingReaderProps } from "./schema";
import { styles } from "./styles";
import { getDefaults } from "./styles.default";

export const Heading = ({
  props,
  style,
  block,
  ...rest
}: HeadingReaderProps) => {
  const level = props?.level ?? DefaultHeadingLevel;
  const defaults = getDefaults(level);
  const children = props?.children ?? [];

  const className = generateClassName();
  const Element = level;
  const base = block.base;

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        defaults={defaults}
      />
      <Element className={cn(className, base?.className)} id={base?.id}>
        {children.map((child) => (
          <ReaderBlock key={child.id} {...rest} block={child} />
        ))}
      </Element>
    </>
  );
};
