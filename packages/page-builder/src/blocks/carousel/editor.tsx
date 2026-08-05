import {
  EditorChildren,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  cn,
} from "@hacado/ui";
import { memo } from "react";
import { CarouselProps, styles } from "./schema";

const CarouselItemWrapper = memo(
  ({ children }: { children: React.ReactNode }) => (
    <CarouselItem className="carousel-item pl-4">{children}</CarouselItem>
  ),
);

export const CarouselEditor = ({ style, props }: CarouselProps) => {
  const currentBlock = useCurrentBlock<CarouselProps>();
  const overlayProps = useBlockEditor(currentBlock.id);

  const className = useClassName();
  const base = currentBlock.base;

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={currentBlock.data?.style}
      />
      <Carousel
        id={base?.id}
        opts={{
          loop: !!currentBlock.data?.props.loop,
          align: "start",
        }}
        orientation={currentBlock.data?.props.orientation ?? undefined}
        {...overlayProps}
      >
        <CarouselContent className={cn("relative", className, base?.className)}>
          <EditorChildren
            blockId={currentBlock.id}
            property="props"
            childWrapper={CarouselItemWrapper}
          />
        </CarouselContent>
        <CarouselPrevious className="left-0" />
        <CarouselNext className="right-0" />
      </Carousel>
    </>
  );
};
