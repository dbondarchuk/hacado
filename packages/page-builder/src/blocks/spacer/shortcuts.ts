import { backgroundColorShortcut, Shortcut } from "@hacado/page-builder-base";
import { AllStylesSchemas } from "@hacado/page-builder-base/style";
import { Ruler } from "lucide-react";

export const spacerShortcuts: Shortcut<AllStylesSchemas>[] = [
  {
    label: "builder.pageBuilder.blocks.spacer.shortcuts.height",
    icon: Ruler,
    options: [
      {
        label: "builder.pageBuilder.blocks.spacer.heights.tiny",
        value: "tiny",
        targetStyles: {
          height: { value: 1, unit: "rem" },
        },
      },
      {
        label: "builder.pageBuilder.blocks.spacer.heights.small",
        value: "small",
        targetStyles: {
          height: { value: 2, unit: "rem" },
        },
      },
      {
        label: "builder.pageBuilder.blocks.spacer.heights.medium",
        value: "medium",
        targetStyles: {
          height: { value: 3, unit: "rem" },
        },
      },
      {
        label: "builder.pageBuilder.blocks.spacer.heights.large",
        value: "large",
        targetStyles: {
          height: { value: 4, unit: "rem" },
        },
      },
      {
        label: "builder.pageBuilder.blocks.spacer.heights.x-large",
        value: "x-large",
        targetStyles: {
          height: { value: 8, unit: "rem" },
        },
      },
      {
        label: "builder.pageBuilder.blocks.spacer.heights.huge",
        value: "huge",
        targetStyles: {
          height: { value: 16, unit: "rem" },
        },
      },
    ],
  },
  backgroundColorShortcut as Shortcut<AllStylesSchemas>,
];
