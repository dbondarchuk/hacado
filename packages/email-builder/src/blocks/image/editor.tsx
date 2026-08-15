"use client";

import {
  useBlockEditor,
  useCurrentBlock,
  useCurrentBlockId,
  useDispatchAction,
  useEditorArgs,
  useIsSelectedBlock,
} from "@hacado/builder";
import { templateSafeWithError } from "@hacado/utils";
import { Ref, useCallback } from "react";
import { Image } from "./image";
import { ResizableImage } from "./resizable-image";
import { ImageProps, ImagePropsDefaults } from "./schema";
import { getWrapperStyles } from "./styles";

export const ImageEditor = ({ props, style }: ImageProps) => {
  const args = useEditorArgs();
  const url = props?.url
    ? templateSafeWithError(props.url, args, true)
    : undefined;

  const currentBlock = useCurrentBlock<ImageProps>();
  const currentBlockId = useCurrentBlockId();
  const isSelected = useIsSelectedBlock(currentBlockId);

  const dispatchAction = useDispatchAction();
  const onDimensionsChange = useCallback(
    (width: number, height: number) => {
      dispatchAction({
        type: "set-block-data",
        value: {
          blockId: currentBlockId,
          data: {
            ...currentBlock.data,
            props: {
              ...currentBlock.data?.props,
              width,
              height,
            },
          },
        },
      });
    },
    [dispatchAction, currentBlock],
  );

  const onPositionChange = useCallback(
    (x: number, y: number) => {
      dispatchAction({
        type: "set-block-data",
        value: {
          blockId: currentBlockId,
          data: {
            ...currentBlock.data,
            props: {
              ...currentBlock.data?.props,
              x,
              y,
            },
          },
        },
      });
    },
    [dispatchAction, currentBlock],
  );

  const overlayProps = useBlockEditor(currentBlock.id, onDimensionsChange);

  return isSelected ? (
    <ResizableImage
      src={url || ""}
      alt={currentBlock.data?.props?.alt ?? undefined}
      wrapperStyles={getWrapperStyles({ style: currentBlock.data?.style })}
      onPositionChange={onPositionChange}
      width={currentBlock.data?.props?.width ?? undefined}
      height={currentBlock.data?.props?.height ?? undefined}
      initialX={currentBlock.data?.props?.x ?? ImagePropsDefaults.props.x}
      initialY={currentBlock.data?.props?.y ?? ImagePropsDefaults.props.y}
      ref={overlayProps.ref as Ref<HTMLImageElement>}
      onClick={overlayProps.onClick}
    />
  ) : (
    <Image
      props={props}
      style={style}
      ref={overlayProps.ref as Ref<HTMLImageElement>}
      onClick={overlayProps.onClick}
    />
  );
};
