import { ReaderBlock } from "@hacado/builder";
import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { AccordionItemInternal } from "./accordion-item";
import { AccordionItemReaderProps } from "./schema";
import { styles } from "./styles";

export const AccordionItem = ({
  props,
  style,
  block,
  animation,
  iconPosition,
  iconStyle,
  ...rest
}: AccordionItemReaderProps) => {
  const title = props?.title?.children || [];
  const content = props?.content?.children || [];
  const className = generateClassName();
  const base = block.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <div
        className={cn(
          "border border-gray-200 rounded-lg",
          className,
          base?.className,
        )}
        id={base?.id}
      >
        <AccordionItemInternal
          title={
            <>
              {title.map((child) => (
                <ReaderBlock key={child.id} block={child} {...rest} />
              ))}
            </>
          }
          content={
            <>
              {content.map((child) => (
                <ReaderBlock key={child.id} block={child} {...rest} />
              ))}
            </>
          }
          isOpen={props?.isOpen ?? false}
          animation={animation}
          iconPosition={iconPosition}
          iconStyle={iconStyle}
        />
      </div>
    </>
  );
};
