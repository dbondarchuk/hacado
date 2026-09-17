"use client";

import { useBlockEditor, useCurrentBlock } from "@hacado/builder";
import { useClassName } from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { Ref } from "react";
import { YouTubeVideoProps, YouTubeVideoPropsDefaults } from "./schema";
import { YouTubeVideo } from "./youtube-video";

export const YouTubeVideoEditor: React.FC<YouTubeVideoProps> = ({ props }) => {
  const currentBlock = useCurrentBlock<YouTubeVideoProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const className = useClassName();
  const base = currentBlock.base;
  const updatedProps = {
    ...YouTubeVideoPropsDefaults.props,
    ...(currentBlock.data?.props ?? {}),
    ...(props ?? {}),
  };

  return (
    <YouTubeVideo
      youtubeUrl={updatedProps.youtubeUrl}
      autoplay={updatedProps.autoplay}
      controls={updatedProps.controls}
      loop={updatedProps.loop}
      muted={updatedProps.muted}
      showInfo={updatedProps.showInfo}
      rel={updatedProps.rel}
      modestbranding={updatedProps.modestbranding}
      start={updatedProps.start}
      end={updatedProps.end}
      privacy={updatedProps.privacy}
      disableEvents
      ref={overlayProps.ref as Ref<HTMLDivElement>}
      onClick={overlayProps.onClick}
      className={cn(className, base?.className)}
      id={base?.id}
    />
  );
};
