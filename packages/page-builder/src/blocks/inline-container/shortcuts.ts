import {
  backgroundColorShortcut,
  backgroundImageShortcut,
  colorShortcut,
  fontFamilyShortcut,
  fontSizeShortcut,
  Shortcut,
  textAlignmentShortcut,
} from "@hacado/page-builder-base";
import { AllStylesSchemas } from "@hacado/page-builder-base/style";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  ArrowRight,
  Move,
  WrapText,
} from "lucide-react";

export const inlineContainerShortcuts: Shortcut<AllStylesSchemas>[] = [
  {
    label: "builder.pageBuilder.blocks.container.shortcuts.gap",
    icon: Move,
    options: [
      {
        label: "builder.pageBuilder.blocks.container.gaps.none",
        value: "none",
        targetStyles: {
          gap: { value: 0, unit: "rem" },
        },
      },
      {
        label: "builder.pageBuilder.blocks.container.gaps.small",
        value: "small",
        targetStyles: {
          gap: { value: 0.25, unit: "rem" },
        },
      },
      {
        label: "builder.pageBuilder.blocks.container.gaps.medium",
        value: "medium",
        targetStyles: {
          gap: { value: 0.5, unit: "rem" },
        },
      },
      {
        label: "builder.pageBuilder.blocks.container.gaps.large",
        value: "large",
        targetStyles: {
          gap: { value: 1, unit: "rem" },
        },
      },
      {
        label: "builder.pageBuilder.blocks.container.gaps.x-large",
        value: "x-large",
        targetStyles: {
          gap: { value: 1.5, unit: "rem" },
        },
      },
    ],
  },
  {
    label: "builder.pageBuilder.blocks.container.shortcuts.flexDirection",
    icon: ArrowRight,
    options: [
      {
        label: "builder.pageBuilder.blocks.container.flexDirections.row",
        value: "row",
        targetStyles: {
          flexDirection: "row",
        },
      },
      {
        label: "builder.pageBuilder.blocks.container.flexDirections.column",
        value: "column",
        targetStyles: {
          flexDirection: "column",
        },
      },
      {
        label: "builder.pageBuilder.blocks.container.flexDirections.rowReverse",
        value: "row-reverse",
        targetStyles: {
          flexDirection: "row-reverse",
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.container.flexDirections.columnReverse",
        value: "column-reverse",
        targetStyles: {
          flexDirection: "column-reverse",
        },
      },
    ],
  },
  {
    label: "builder.pageBuilder.blocks.container.shortcuts.flexWrap",
    icon: WrapText,
    options: [
      {
        label: "builder.pageBuilder.blocks.container.flexWraps.nowrap",
        value: "nowrap",
        targetStyles: {
          flexWrap: "nowrap",
          display: "flex",
        },
      },
      {
        label: "builder.pageBuilder.blocks.container.flexWraps.wrap",
        value: "wrap",
        targetStyles: {
          flexWrap: "wrap",
          display: "flex",
        },
      },
      {
        label: "builder.pageBuilder.blocks.container.flexWraps.wrapReverse",
        value: "wrap-reverse",
        targetStyles: {
          flexWrap: "wrap-reverse",
          display: "flex",
        },
      },
    ],
  },
  {
    label: "builder.pageBuilder.blocks.container.shortcuts.justifyContent",
    icon: AlignCenterHorizontal,
    options: [
      {
        label: "builder.pageBuilder.blocks.container.justifyContents.start",
        value: "flex-start",
        targetStyles: {
          justifyContent: "flex-start",
          display: "flex",
        },
      },
      {
        label: "builder.pageBuilder.blocks.container.justifyContents.center",
        value: "center",
        targetStyles: {
          justifyContent: "center",
          display: "flex",
        },
      },
      {
        label: "builder.pageBuilder.blocks.container.justifyContents.end",
        value: "flex-end",
        targetStyles: {
          justifyContent: "flex-end",
          display: "flex",
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.container.justifyContents.spaceBetween",
        value: "space-between",
        targetStyles: {
          justifyContent: "space-between",
          display: "flex",
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.container.justifyContents.spaceAround",
        value: "space-around",
        targetStyles: {
          justifyContent: "space-around",
          display: "flex",
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.container.justifyContents.spaceEvenly",
        value: "space-evenly",
        targetStyles: {
          justifyContent: "space-evenly",
          display: "flex",
        },
      },
    ],
  },
  {
    label: "builder.pageBuilder.blocks.container.shortcuts.alignItems",
    icon: AlignCenterVertical,
    options: [
      {
        label: "builder.pageBuilder.blocks.container.alignItemses.start",
        value: "flex-start",
        targetStyles: {
          alignItems: "flex-start",
          display: "flex",
        },
      },
      {
        label: "builder.pageBuilder.blocks.container.alignItemses.center",
        value: "center",
        targetStyles: {
          alignItems: "center",
          display: "flex",
        },
      },
      {
        label: "builder.pageBuilder.blocks.container.alignItemses.end",
        value: "flex-end",
        targetStyles: {
          alignItems: "flex-end",
          display: "flex",
        },
      },
      {
        label: "builder.pageBuilder.blocks.container.alignItemses.stretch",
        value: "stretch",
        targetStyles: {
          alignItems: "stretch",
          display: "flex",
        },
      },
      {
        label: "builder.pageBuilder.blocks.container.alignItemses.baseline",
        value: "baseline",
        targetStyles: {
          alignItems: "baseline",
          display: "flex",
        },
      },
    ],
  },

  fontSizeShortcut as Shortcut<AllStylesSchemas>,
  textAlignmentShortcut as Shortcut<AllStylesSchemas>,
  backgroundColorShortcut,
  backgroundImageShortcut as Shortcut<AllStylesSchemas>,
  fontFamilyShortcut as Shortcut<AllStylesSchemas>,
  colorShortcut,
];
