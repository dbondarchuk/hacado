import { ReaderBlock } from "@hacado/builder";
import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { AccordionClient } from "./accordion.client";
import { getInitialOpenItemIds } from "./open-state";
import { AccordionReaderProps } from "./schema";
import { styles } from "./styles";

export const Accordion = ({
  props,
  style,
  block,
  ...rest
}: AccordionReaderProps) => {
  const children = props?.children ?? [];
  const className = generateClassName();
  const base = block.base;

  const { animation, iconPosition, iconStyle } = props;
  const allowMultipleOpen = props?.allowMultipleOpen ?? false;
  const defaultOpenFirst = props?.defaultOpenFirst ?? false;
  const initialOpenItemIds = getInitialOpenItemIds(
    children,
    allowMultipleOpen,
    defaultOpenFirst,
  );

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <AccordionClient
        className={cn(className, base?.className)}
        id={base?.id}
        allowMultipleOpen={allowMultipleOpen}
        initialOpenItemIds={initialOpenItemIds}
        animation={animation}
        iconPosition={iconPosition}
        iconStyle={iconStyle}
      >
        {children.map((child: any) => (
          <ReaderBlock key={child.id} block={child} {...rest} />
        ))}
      </AccordionClient>
    </>
  );
};
