"use client";

import {
  useBlockEditor,
  useCurrentBlock,
  useEditorArgs,
} from "@hacado/builder";
import { useClassName } from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { template } from "@hacado/utils";
import { Ref } from "react";
import { VideoProps, VideoPropsDefaults } from "./schema";
import { Video } from "./video";

export const VideoEditor = ({ props }: VideoProps) => {
  const currentBlock = useCurrentBlock<VideoProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const args = useEditorArgs();
  const className = useClassName();
  const base = currentBlock.base;
  const baseProps = {
    ...VideoPropsDefaults.props,
    ...(currentBlock.data?.props ?? {}),
    ...(props ?? {}),
  };
  const updatedProps = {
    ...baseProps,
    src: template(baseProps.src ?? "", args, true),
  };

  return (
    <Video
      src={updatedProps.src}
      poster={updatedProps.poster}
      controls={updatedProps.controls}
      autoplay={updatedProps.autoplay}
      loop={updatedProps.loop}
      muted={updatedProps.muted}
      preload={updatedProps.preload}
      ref={overlayProps.ref as Ref<HTMLVideoElement>}
      onClick={overlayProps.onClick}
      className={cn(className, base?.className)}
      id={base?.id}
    />
  );
};
