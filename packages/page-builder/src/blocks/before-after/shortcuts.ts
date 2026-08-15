import { Shortcut } from "@hacado/page-builder-base";
import { AllStylesSchemas } from "@hacado/page-builder-base/style";
import { Proportions, RotateCcw } from "lucide-react";

export const beforeAfterShortcuts: Shortcut<AllStylesSchemas>[] = [
  {
    label:
      "builder.pageBuilder.blocks.beforeAfterSlider.shortcuts.aspectRatio.label",
    icon: Proportions,
    options: [
      {
        label:
          "pageBuilder.blocks.beforeAfterSlider.shortcuts.aspectRatio.square",
        value: "square",
        targetStyles: {
          aspectRatio: { x: 1, y: 1 },
        },
      },
      {
        label:
          "pageBuilder.blocks.beforeAfterSlider.shortcuts.aspectRatio.landscape",
        value: "landscape",
        targetStyles: {
          aspectRatio: { x: 4, y: 3 },
        },
      },
      {
        label:
          "pageBuilder.blocks.beforeAfterSlider.shortcuts.aspectRatio.portrait",
        value: "portrait",
        targetStyles: {
          aspectRatio: { x: 3, y: 4 },
        },
      },
      {
        label:
          "pageBuilder.blocks.beforeAfterSlider.shortcuts.aspectRatio.widescreen",
        value: "widescreen",
        targetStyles: {
          aspectRatio: { x: 16, y: 9 },
        },
      },
      {
        label:
          "pageBuilder.blocks.beforeAfterSlider.shortcuts.aspectRatio.mobile",
        value: "mobile",
        targetStyles: {
          aspectRatio: { x: 9, y: 16 },
        },
      },
    ],
  },
  {
    label:
      "builder.pageBuilder.blocks.beforeAfterSlider.shortcuts.orientation.label",
    icon: RotateCcw,
    options: [
      {
        label:
          "pageBuilder.blocks.beforeAfterSlider.shortcuts.orientation.horizontal",
        value: "horizontal",
        targetStyles: {},
        targetProps: {
          orientation: "horizontal",
        },
      },
      {
        label:
          "pageBuilder.blocks.beforeAfterSlider.shortcuts.orientation.vertical",
        value: "vertical",
        targetStyles: {},
        targetProps: {
          orientation: "vertical",
        },
      },
    ],
  },
];
