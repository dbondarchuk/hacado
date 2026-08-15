"use client";

import {
  BlockFilterRule,
  EditorBlock,
  useBlockChildrenBlockIds,
  useBlockEditor,
  useCurrentBlock,
  useCurrentBlockId,
  useDispatchAction,
  usePortalContext,
} from "@hacado/builder";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { useCallback } from "react";
import { ImageProvider } from "../image/context";
import { BeforeAfterSlider } from "./before-after-slider";
import { NoImagesMessage } from "./no-images-message";
import { BeforeAfterProps } from "./schema";
import { styles } from "./styles";

const disable = {
  disableMove: true,
  disableDelete: true,
  disableClone: true,
  disableDrag: true,
};

const inlineAllowOnly: BlockFilterRule = {
  capabilities: ["inline"],
};

const containerAllowOnly: BlockFilterRule = {
  capabilities: ["container"],
};

export const BeforeAfterEditor = ({ props, style }: BeforeAfterProps) => {
  const currentBlock = useCurrentBlock<BeforeAfterProps>();
  const currentBlockId = useCurrentBlockId();
  const overlayProps = useBlockEditor(currentBlock.id);

  const dispatchAction = useDispatchAction();
  const beforeId = useBlockChildrenBlockIds(
    currentBlock.id,
    "props.before",
  )?.[0];
  const afterId = useBlockChildrenBlockIds(currentBlock.id, "props.after")?.[0];
  const beforeLabelId = useBlockChildrenBlockIds(
    currentBlock.id,
    "props.beforeLabel",
  )?.[0];
  const afterLabelId = useBlockChildrenBlockIds(
    currentBlock.id,
    "props.afterLabel",
  )?.[0];

  const { document } = usePortalContext();

  const updateProps = useCallback(
    (newProps: Partial<BeforeAfterProps["props"]>) => {
      dispatchAction({
        type: "set-block-data",
        value: {
          blockId: currentBlockId,
          data: {
            ...currentBlock.data,
            props: {
              ...currentBlock.data.props,
              ...newProps,
            },
          },
        },
      });
    },
    [dispatchAction, currentBlock, currentBlockId],
  );

  const { sliderPosition, showLabels, beforeLabel, afterLabel, orientation } =
    currentBlock.data?.props || {};

  if (!beforeId || !afterId) {
    return <NoImagesMessage />;
  }

  const className = useClassName();

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={currentBlock.data?.style}
      />
      <ImageProvider allowResize={false}>
        <div className="relative w-full h-full" {...overlayProps}>
          <BeforeAfterSlider
            className={cn(className, currentBlock.base?.className)}
            id={currentBlock.base?.id}
            sliderPosition={sliderPosition || 50}
            showLabels={!!showLabels}
            beforeLabel={
              <EditorBlock
                key={beforeLabelId}
                blockId={beforeLabelId}
                {...disable}
                index={0}
                parentBlockId={currentBlock.id}
                parentProperty="props.beforeLabel"
                allow={inlineAllowOnly}
              />
            }
            afterLabel={
              <EditorBlock
                key={afterLabelId}
                blockId={afterLabelId}
                {...disable}
                index={0}
                parentBlockId={currentBlock.id}
                parentProperty="props.afterLabel"
                allow={inlineAllowOnly}
              />
            }
            orientation={orientation || "horizontal"}
            document={document}
            before={
              <EditorBlock
                key={beforeId}
                blockId={beforeId}
                {...disable}
                index={0}
                parentBlockId={currentBlock.id}
                parentProperty="props.before"
                allow={containerAllowOnly}
              />
            }
            after={
              <EditorBlock
                key={afterId}
                blockId={afterId}
                {...disable}
                index={0}
                parentBlockId={currentBlock.id}
                parentProperty="props.after"
                allow={containerAllowOnly}
              />
            }
          />
        </div>
      </ImageProvider>
    </>
  );
};
