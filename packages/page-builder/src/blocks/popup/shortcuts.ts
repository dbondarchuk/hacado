import {
  colorShortcut,
  fontFamilyShortcut,
  Shortcut,
} from "@hacado/page-builder-base";
import { AllStylesSchemas } from "@hacado/page-builder-base/style";
import { Maximize } from "lucide-react";

export const popupShortcuts: Shortcut<AllStylesSchemas>[] = [
  {
    label: "builder.pageBuilder.blocks.popup.shortcuts.maxWidth.label",
    icon: Maximize,
    options: [
      {
        label:
          "builder.pageBuilder.blocks.popup.shortcuts.maxWidth.variants.small",
        value: "small",
        targetStyles: {
          maxWidth: {
            variants: [
              { value: { value: 20, unit: "rem" }, breakpoint: [] },
              { value: { value: 24, unit: "rem" }, breakpoint: ["sm"] },
              { value: { value: 28, unit: "rem" }, breakpoint: ["md"] },
              { value: { value: 32, unit: "rem" }, breakpoint: ["lg"] },
              { value: { value: 36, unit: "rem" }, breakpoint: ["xl"] },
              { value: { value: 40, unit: "rem" }, breakpoint: ["2xl"] },
            ],
          },
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.popup.shortcuts.maxWidth.variants.medium",
        value: "medium",
        targetStyles: {
          maxWidth: {
            variants: [
              { value: { value: 24, unit: "rem" }, breakpoint: [] },
              { value: { value: 32, unit: "rem" }, breakpoint: ["sm"] },
              { value: { value: 40, unit: "rem" }, breakpoint: ["md"] },
              { value: { value: 48, unit: "rem" }, breakpoint: ["lg"] },
              { value: { value: 56, unit: "rem" }, breakpoint: ["xl"] },
              { value: { value: 64, unit: "rem" }, breakpoint: ["2xl"] },
            ],
          },
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.popup.shortcuts.maxWidth.variants.large",
        value: "large",
        targetStyles: {
          maxWidth: {
            variants: [
              { value: { value: 30, unit: "rem" }, breakpoint: [] },
              { value: { value: 40, unit: "rem" }, breakpoint: ["sm"] },
              { value: { value: 50, unit: "rem" }, breakpoint: ["md"] },
              { value: { value: 60, unit: "rem" }, breakpoint: ["lg"] },
              { value: { value: 70, unit: "rem" }, breakpoint: ["xl"] },
              { value: { value: 80, unit: "rem" }, breakpoint: ["2xl"] },
            ],
          },
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.popup.shortcuts.maxWidth.variants.full",
        value: "full",
        targetStyles: {
          maxWidth: {
            variants: [
              { value: { value: 100, unit: "%" }, breakpoint: [] },
              { value: { value: 100, unit: "%" }, breakpoint: ["sm"] },
              { value: { value: 100, unit: "%" }, breakpoint: ["md"] },
              { value: { value: 100, unit: "%" }, breakpoint: ["lg"] },
              { value: { value: 100, unit: "%" }, breakpoint: ["xl"] },
              { value: { value: 100, unit: "%" }, breakpoint: ["2xl"] },
            ],
          },
        },
      },
    ],
  },
  fontFamilyShortcut as Shortcut<AllStylesSchemas>,
  colorShortcut,
];
