import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { StaticText } from "@hacado/rte-inline/reader";
import { cn } from "@hacado/ui";
import { InlineTextPropsDefaults, InlineTextReaderProps } from "./schema";
import { styles } from "./styles";

export const InlineText = ({ props, style, block }: InlineTextReaderProps) => {
  const text = props?.text ?? InlineTextPropsDefaults.props.text;
  const base = block.base;

  const className = generateClassName();
  const Element = "span";
  // const Element = props?.url ? "a" : "span";

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <StaticText
        value={text}
        className={cn(className, base?.className)}
        id={base?.id}
        inline={true}
      />
    </>
  );
};
