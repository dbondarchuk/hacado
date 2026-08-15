import { ReaderBlock } from "@hacado/builder";
import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { Button } from "./button";
import { ButtonReaderProps } from "./schema";
import { styles } from "./styles";
import { getDefaults } from "./styles.default";

export const ButtonReader = ({
  props,
  style,
  block,
  ...rest
}: ButtonReaderProps) => {
  const defaults = getDefaults({ props, style }, false);

  const className = generateClassName();
  const base = block.base;

  const { children, ...restProps } = props || {};

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        defaults={defaults}
      />
      <Button
        id={base?.id}
        className={cn("block", className, base?.className)}
        {...restProps}
      >
        {children?.map((child) => (
          <ReaderBlock key={child.id} {...rest} block={child} />
        ))}
      </Button>
    </>
  );
};
