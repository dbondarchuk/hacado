import { ReaderBlock } from "@hacado/builder";
import {
  BackgroundVideoLayer,
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { PageHeroReaderProps } from "./schema";
import { styles } from "./styles";

export const PageHeroReader = ({
  props,
  style,
  block,
  ...rest
}: PageHeroReaderProps) => {
  const title = props?.title?.children || [];
  const subtitle = props?.subtitle?.children || [];
  const buttons = props?.buttons?.children || [];
  const className = generateClassName();
  const base = block.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <section className={cn(className, base?.className)} id={base?.id}>
        <BackgroundVideoLayer style={style} />
        {title.map((child) => (
          <ReaderBlock key={child.id} {...rest} block={child} />
        ))}
        {subtitle.map((child) => (
          <ReaderBlock key={child.id} {...rest} block={child} />
        ))}
        {buttons.map((child) => (
          <ReaderBlock key={child.id} {...rest} block={child} />
        ))}
      </section>
    </>
  );
};
