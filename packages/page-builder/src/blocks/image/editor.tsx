"use client";

import {
  useBlockEditor,
  useCurrentBlock,
  useCurrentBlockId,
  useDispatchAction,
  useEditorArgs,
  useIsSelectedBlock,
} from "@hacado/builder";
import { useResizeBlockStyles } from "@hacado/page-builder-base";
import { template } from "@hacado/utils";
import { Ref, useCallback } from "react";
import { useAllowImageResize } from "./context";
import { Image } from "./reader";
import { ImagePositionEditor } from "./resizable-image";
import { ImageProps } from "./schema";

export const ImageEditor = ({ props, style }: ImageProps) => {
  const currentBlock = useCurrentBlock<ImageProps>();
  const currentBlockId = useCurrentBlockId();
  const onResize = useResizeBlockStyles();
  const isSelected = useIsSelectedBlock(currentBlockId);
  const allowResize = useAllowImageResize();
  const overlayProps = useBlockEditor(
    currentBlock.id,
    allowResize ? onResize : undefined,
  );

  const getUpdatedPosition = (
    currentBlockData: ImageProps,
    x: number,
    y: number,
  ) => {
    const newStyles = {
      ...(currentBlockData.style || {}),
    };

    newStyles.objectPosition =
      newStyles.objectPosition?.filter(
        (p) => !!p.breakpoint?.length || !!p.state?.length,
      ) || [];

    newStyles.objectPosition.push({
      value: {
        x,
        y,
      },
    });

    return newStyles;
  };

  const dispatchAction = useDispatchAction();

  const onPositionChange = useCallback(
    (x: number, y: number) => {
      dispatchAction({
        type: "set-block-data",
        value: {
          blockId: currentBlockId,
          data: {
            ...currentBlock.data,
            style: getUpdatedPosition(currentBlock.data, x, y),
          },
        },
      });
    },
    [dispatchAction, currentBlock],
  );

  const baseX = currentBlock.data?.style?.objectPosition?.find(
    (position) => !position.breakpoint?.length && !position.state?.length,
  )?.value.x;

  const baseY = currentBlock.data?.style?.objectPosition?.find(
    (position) => !position.breakpoint?.length && !position.state?.length,
  )?.value.y;

  const args = useEditorArgs();
  const updatedProps = {
    ...currentBlock.data?.props,
    src: template(currentBlock.data?.props?.src ?? "", args, true),
  };

  // const hasNonStaticPosition = currentBlock.data?.style?.position?.some(
  //   (position) => position.value === "absolute" || position.value === "fixed",
  // );

  return isSelected /*&& !hasNonStaticPosition*/ && allowResize ? (
    <ImagePositionEditor
      props={currentBlock.data ?? {}}
      onPositionChange={onPositionChange}
      initialX={baseX ?? 50}
      initialY={baseY ?? 50}
      ref={overlayProps.ref as Ref<HTMLImageElement>}
      onClick={overlayProps.onClick}
    />
  ) : (
    <Image
      isEditor
      props={updatedProps}
      style={style}
      block={currentBlock}
      ref={overlayProps.ref as Ref<HTMLImageElement>}
      onClick={overlayProps.onClick}
    />
  );
  // return (
  //   <Image
  //     props={updatedProps}
  //     style={style}
  //     block={currentBlock}
  //     ref={overlayProps.ref as Ref<HTMLImageElement>}
  //     onClick={overlayProps.onClick}
  //   />
  // );
};
