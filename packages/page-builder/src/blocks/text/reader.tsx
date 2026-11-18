import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { normalizePlateBodyValue } from "@hacado/rte/plate-value";
import { PlateStaticEditor } from "@hacado/rte/static";
import { cn } from "@hacado/ui/cn";
import { TextReaderProps } from "./schema";
import { styles } from "./styles";
import { getDefaults } from "./styles.default";

export const TextReader = ({ props, style, block }: TextReaderProps) => {
  const value = normalizePlateBodyValue(props?.value);
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
      <div className={cn(className, base?.className)} id={base?.id}>
        <PlateStaticEditor value={value} />
      </div>
    </>
  );
};
