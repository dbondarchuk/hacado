"use client";

import {
  useBlockEditor,
  useCurrentBlock,
  useEditorArgs,
} from "@hacado/builder";
import { template } from "@hacado/utils";
import { Ref } from "react";
import { Video } from "./reader";
import { VideoProps, VideoPropsDefaults } from "./schema";

export const VideoEditor = ({ props, style }: VideoProps) => {
  const currentBlock = useCurrentBlock<VideoProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const args = useEditorArgs();

  const baseProps = {
    ...VideoPropsDefaults.props,
    ...(currentBlock.data?.props ?? {}),
  };
  const updatedProps = {
    ...baseProps,
    src: template(baseProps.src ?? "", args, true),
  };
  return (
    <Video
      props={updatedProps}
      style={style}
      block={currentBlock}
      ref={overlayProps.ref as Ref<HTMLVideoElement>}
      onClick={overlayProps.onClick}
    />
  );
};
