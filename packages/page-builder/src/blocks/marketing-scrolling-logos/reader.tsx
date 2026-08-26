import { ReaderBlock } from "@hacado/builder";
import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { MarketingScrollingLogosReaderProps } from "./schema";
import { styles } from "./styles";

export const MarketingScrollingLogosReader = ({
  style,
  props,
  block,
  ...rest
}: MarketingScrollingLogosReaderProps) => {
  const items = props?.items?.children ?? [];
  const screenReaderText = props?.screenReaderText ?? "";
  const className = generateClassName();
  const base = block.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <section className={cn(className, base?.className)} id={base?.id}>
        <div className="overflow-hidden scroll-logos-container">
          {screenReaderText ? (
            <p className="sr-only">{screenReaderText}</p>
          ) : null}

          {items.length > 0 ? (
            <div className="hidden flex-wrap justify-center gap-4">
              {items.map((child: any) => (
                <ReaderBlock key={child.id} {...rest} block={child} />
              ))}
            </div>
          ) : null}

          <div
            className={cn("relative -mx-6 overflow-hidden sm:-mx-8")}
            aria-hidden={true}
          >
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-24"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-24"
              aria-hidden
            />
            <div
              className={cn(
                "flex gap-4 py-1",
                "w-max animate-marquee-scroll will-change-transform",
              )}
            >
              {items.map((child: any) => (
                <ReaderBlock key={child.id} {...rest} block={child} />
              ))}
              {items.map((child: any) => (
                <ReaderBlock
                  key={`${child.id}-marquee-dup`}
                  {...rest}
                  block={child}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
