import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { forwardRef } from "react";
import { ImageLightbox } from "./image-lightbox";
import { ImageReaderProps } from "./schema";
import { styles } from "./styles";
import { getDefaults } from "./styles.default";

export const Image = forwardRef<
  HTMLImageElement | HTMLAnchorElement,
  Pick<ImageReaderProps, "style" | "props" | "block"> & {
    onClick?: (e: React.MouseEvent) => void;
    isEditor?: boolean;
  }
>(({ style, props, block, onClick, isEditor }, ref) => {
  const linkHref = props?.linkHref;

  const className = generateClassName();
  const base = block.base;
  const imageElement = (
    <ImageLightbox
      alt={props?.alt ?? ""}
      src={props?.src ?? ""}
      className={cn(className, base?.className)}
      id={base?.id}
      ref={!linkHref ? (ref as any) : undefined}
      onClick={onClick}
    />
  );

  const element =
    isEditor || !linkHref ? (
      imageElement
    ) : (
      <a
        href={linkHref}
        style={{ textDecoration: "none", display: "block" }}
        ref={ref as any}
      >
        {imageElement}
      </a>
    );

  const defaults = getDefaults({ props, style }, false);

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        defaults={defaults}
        isEditor={false}
      />
      {element}
    </>
  );
});
