import {
  backgroundColorShortcut,
  backgroundImageShortcut,
  backgroundVideoShortcut,
  colorShortcut,
  Shortcut,
} from "@hacado/page-builder-base";
import { AllStylesSchemas } from "@hacado/page-builder-base/style";
import { AlignVerticalSpaceBetween, Maximize } from "lucide-react";

export const fluidLayoutShortcuts: Shortcut<AllStylesSchemas>[] = [
  {
    label: "builder.pageBuilder.blocks.fluidLayout.shortcuts.padding",
    icon: AlignVerticalSpaceBetween,
    options: [
      {
        label: "builder.pageBuilder.blocks.fluidLayout.paddings.none",
        value: "none",
        targetStyles: {
          padding: {
            top: { value: 0, unit: "px" },
            bottom: { value: 0, unit: "px" },
            left: { value: 0, unit: "px" },
            right: { value: 0, unit: "px" },
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.fluidLayout.paddings.small",
        value: "small",
        targetStyles: {
          padding: {
            top: { value: 8, unit: "px" },
            bottom: { value: 8, unit: "px" },
            left: { value: 12, unit: "px" },
            right: { value: 12, unit: "px" },
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.fluidLayout.paddings.medium",
        value: "medium",
        targetStyles: {
          padding: {
            top: { value: 16, unit: "px" },
            bottom: { value: 16, unit: "px" },
            left: { value: 24, unit: "px" },
            right: { value: 24, unit: "px" },
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.fluidLayout.paddings.large",
        value: "large",
        targetStyles: {
          padding: {
            top: { value: 24, unit: "px" },
            bottom: { value: 24, unit: "px" },
            left: { value: 32, unit: "px" },
            right: { value: 32, unit: "px" },
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.fluidLayout.paddings.x-large",
        value: "x-large",
        targetStyles: {
          padding: {
            top: { value: 32, unit: "px" },
            bottom: { value: 32, unit: "px" },
            left: { value: 48, unit: "px" },
            right: { value: 48, unit: "px" },
          },
        },
      },
    ],
  },
  {
    label: "builder.pageBuilder.blocks.fluidLayout.shortcuts.width",
    icon: Maximize,
    options: [
      {
        label: "builder.pageBuilder.blocks.fluidLayout.widths.full",
        value: "full",
        targetStyles: {
          width: { value: 100, unit: "%" },
          maxWidth: undefined,
          margin: {
            top: "auto",
            right: "auto",
            bottom: "auto",
            left: "auto",
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.fluidLayout.widths.contained",
        value: "contained",
        targetStyles: {
          width: { value: 100, unit: "%" },
          maxWidth: {
            variants: [
              { value: { value: 100, unit: "%" }, breakpoint: [] },
              { value: { value: 640, unit: "px" }, breakpoint: ["sm"] },
              { value: { value: 768, unit: "px" }, breakpoint: ["md"] },
              { value: { value: 1024, unit: "px" }, breakpoint: ["lg"] },
              { value: { value: 1280, unit: "px" }, breakpoint: ["xl"] },
              { value: { value: 1536, unit: "px" }, breakpoint: ["2xl"] },
            ],
          },
          margin: {
            top: "auto",
            right: "auto",
            bottom: "auto",
            left: "auto",
          },
        },
      },
    ],
  },
  backgroundColorShortcut,
  backgroundImageShortcut as Shortcut<AllStylesSchemas>,
  backgroundVideoShortcut as unknown as Shortcut<AllStylesSchemas>,
  colorShortcut,
];
