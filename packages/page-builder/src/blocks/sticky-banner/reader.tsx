import { ReaderBlock } from "@hacado/builder";
import {
  BlockStyle,
  generateClassName,
  ReplaceOriginalColors,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { StickyBannerReaderProps } from "./schema";
import { StickyBanner } from "./sticky-banner";
import { styles } from "./styles";

export const StickyBannerReader = ({
  props,
  style,
  block,
  isEditor,
  ...rest
}: StickyBannerReaderProps) => {
  const content = props?.content?.children || [];
  const showCloseButton = props?.showCloseButton ?? true;
  const className = generateClassName();
  const base = block.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <StickyBanner
        blockId={block.id}
        show={props.show}
        position={props.position}
        showCloseButton={showCloseButton}
        isEditor={isEditor}
        id={base?.id}
        className={cn(className, base?.className)}
      >
        <ReplaceOriginalColors />
        {content.map((child) => (
          <ReaderBlock key={child.id} block={child} {...rest} />
        ))}
      </StickyBanner>
    </>
  );
};
