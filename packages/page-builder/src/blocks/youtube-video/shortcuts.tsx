import { Shortcut } from "@hacado/page-builder-base";
import { AlignLeft, Film, Play, Volume2 } from "lucide-react";
import { YouTubeVideoStylesSchema } from "./styles";

export const youtubeVideoShortcuts: Shortcut<YouTubeVideoStylesSchema>[] = [
  {
    label: "builder.pageBuilder.blocks.youtubeVideo.aspectRatio",
    icon: ({ className }) => <Film className={className} />,
    options: [
      {
        label: "16:9" as any,
        value: "16:9",
        targetStyles: {
          position: "relative",
          width: {
            value: 100,
            unit: "%",
          },
          padding: (prev) => ({
            top: prev?.top ?? { value: 0, unit: "px" },
            right: prev?.right ?? { value: 0, unit: "px" },
            left: prev?.left ?? { value: 0, unit: "px" },
            bottom: {
              value: 56.25, // 9/16 * 100
              unit: "%",
            },
          }),
          height: {
            value: 0,
            unit: "px",
          },
        },
      },
      {
        label: "4:3" as any,
        value: "4:3",
        targetStyles: {
          position: "relative",
          width: {
            value: 100,
            unit: "%",
          },
          padding: (prev) => ({
            top: prev?.top ?? { value: 0, unit: "px" },
            right: prev?.right ?? { value: 0, unit: "px" },
            left: prev?.left ?? { value: 0, unit: "px" },
            bottom: {
              value: 75, // 3/4 * 100
              unit: "%",
            },
          }),
          height: {
            value: 0,
            unit: "px",
          },
        },
      },
      {
        label: "1:1" as any,
        value: "1:1",
        targetStyles: {
          position: "relative",
          width: {
            value: 100,
            unit: "%",
          },
          padding: (prev) => ({
            top: prev?.top ?? { value: 0, unit: "px" },
            right: prev?.right ?? { value: 0, unit: "px" },
            left: prev?.left ?? { value: 0, unit: "px" },
            bottom: {
              value: 100, // 1/1 * 100
              unit: "%",
            },
          }),
          height: {
            value: 0,
            unit: "px",
          },
        },
      },
      {
        label: "21:9" as any,
        value: "21:9",
        targetStyles: {
          position: "relative",
          width: {
            value: 100,
            unit: "%",
          },
          padding: (prev) => ({
            top: prev?.top ?? { value: 0, unit: "px" },
            right: prev?.right ?? { value: 0, unit: "px" },
            left: prev?.left ?? { value: 0, unit: "px" },
            bottom: {
              value: 42.86, // 9/21 * 100
              unit: "%",
            },
          }),
          height: {
            value: 0,
            unit: "px",
          },
        },
      },
    ],
  },
  {
    label: "builder.pageBuilder.blocks.youtubeVideo.alignment",
    icon: ({ className }) => <AlignLeft className={className} />,
    options: [
      {
        label: "builder.pageBuilder.blocks.video.alignments.standard",
        value: "standard",
        targetStyles: {
          display: "inline-block",
          margin: (prev) => ({
            top: prev?.top ?? "auto",
            bottom: prev?.bottom ?? "auto",
            left: {
              value: 0,
              unit: "px",
            },
            right: {
              value: 0,
              unit: "px",
            },
          }),
        },
      },
      {
        label: "builder.pageBuilder.blocks.video.alignments.center",
        value: "center",
        targetStyles: {
          display: "block",
          margin: (prev) => ({
            top: prev?.top ?? "auto",
            bottom: prev?.bottom ?? "auto",
            left: "auto",
            right: "auto",
          }),
        },
      },
    ],
  },
  {
    label: "builder.pageBuilder.blocks.youtubeVideo.playback",
    icon: ({ className }) => <Play className={className} />,
    options: [
      {
        label: "builder.pageBuilder.blocks.video.playbackOptions.standard",
        value: "standard",
        targetStyles: {},
        targetProps: {
          controls: true,
          autoplay: false,
          loop: false,
          muted: false,
        },
      },
      {
        label: "builder.pageBuilder.blocks.video.playbackOptions.autoplay",
        value: "autoplay",
        targetStyles: {},
        targetProps: {
          controls: true,
          autoplay: true,
          loop: false,
          muted: true,
        },
      },
      {
        label: "builder.pageBuilder.blocks.video.playbackOptions.loop",
        value: "loop",
        targetStyles: {},
        targetProps: {
          controls: true,
          autoplay: false,
          loop: true,
          muted: false,
        },
      },
      {
        label: "builder.pageBuilder.blocks.video.playbackOptions.background",
        value: "background",
        targetStyles: {},
        targetProps: {
          controls: false,
          autoplay: true,
          loop: true,
          muted: true,
        },
      },
    ],
  },
  {
    label: "builder.pageBuilder.blocks.youtubeVideo.audio",
    icon: ({ className }) => <Volume2 className={className} />,
    options: [
      {
        label: "builder.pageBuilder.blocks.video.audioOptions.withSound",
        value: "withSound",
        targetStyles: {},
        targetProps: {
          muted: false,
        },
      },
      {
        label: "builder.pageBuilder.blocks.video.audioOptions.muted",
        value: "muted",
        targetStyles: {},
        targetProps: {
          muted: true,
        },
      },
    ],
  },
];
