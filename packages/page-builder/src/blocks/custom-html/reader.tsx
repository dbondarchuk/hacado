import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { CustomHTMLReaderProps } from "./schema";
import { styles } from "./styles";
import { getDefaults } from "./styles.default";

export const CustomHTML = ({ props, style, block }: CustomHTMLReaderProps) => {
  const defaults = getDefaults({ props, style }, false);

  const className = generateClassName();
  const base = block.base;

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        defaults={defaults}
      />
      <div
        className={cn(className, base?.className)}
        id={base?.id}
        dangerouslySetInnerHTML={{ __html: props?.html ?? "" }}
      />
    </>
  );
};
