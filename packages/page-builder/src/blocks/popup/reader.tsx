import { Popup } from "./popup";
import { PopupReaderProps } from "./schema";

import { ReaderBlock } from "@hacado/builder";
import {
  BlockStyle,
  generateClassName,
  ReplaceOriginalColors,
} from "@hacado/page-builder-base/reader";
import {
  cn,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ScrollArea,
} from "@hacado/ui";
import { styles } from "./styles";

export const PopupReader = ({
  props,
  style,
  block,
  isEditor,
  ...rest
}: PopupReaderProps) => {
  const title = props?.title?.children || [];
  const subtitle = props?.subtitle?.children || [];
  const buttons = props?.buttons?.children || [];
  const content = props?.content?.children || [];
  const overlay = props?.overlay;
  const noClose = props?.noClose;
  const className = generateClassName();
  const base = block.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <Popup
        blockId={block.id}
        show={props.show}
        isEditor={isEditor}
        id={base?.id}
        className={cn(className, base?.className)}
        overlay={overlay}
        noClose={noClose}
      >
        <ReplaceOriginalColors />
        <DialogHeader>
          <DialogTitle>
            {title.map((child) => (
              <ReaderBlock key={child.id} {...rest} block={child} />
            ))}
          </DialogTitle>
          <DialogDescription>
            {subtitle.map((child) => (
              <ReaderBlock key={child.id} {...rest} block={child} />
            ))}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70svh]">
          {content.map((child) => (
            <ReaderBlock key={child.id} block={child} {...rest} />
          ))}
        </ScrollArea>
        <DialogFooter>
          {buttons.map((child) => (
            <ReaderBlock key={child.id} block={child} {...rest} />
          ))}
        </DialogFooter>
      </Popup>
    </>
  );
};
