import {
  backgroundColorShortcut,
  colorShortcut,
  fontFamilyShortcut,
  fontSizeShortcut,
  Shortcut,
  textAlignmentShortcut,
} from "@hacado/page-builder-base";
import { AllStylesSchemas, COLORS } from "@hacado/page-builder-base/style";
import { Bold, Space, TypeOutline } from "lucide-react";

export const textShortcuts: Shortcut<AllStylesSchemas>[] = [
  fontSizeShortcut as Shortcut<AllStylesSchemas>,
  {
    label: "builder.pageBuilder.blocks.text.shortcuts.weight",
    icon: ({ className }) => <Bold className={className} />,
    options: [
      {
        label: "builder.pageBuilder.blocks.text.weights.light",
        value: "light",
        targetStyles: {
          fontWeight: "300",
        },
      },
      {
        label: "builder.pageBuilder.blocks.text.weights.normal",
        value: "normal",
        targetStyles: {
          fontWeight: "normal",
        },
      },
      {
        label: "builder.pageBuilder.blocks.text.weights.medium",
        value: "medium",
        targetStyles: {
          fontWeight: "500",
        },
      },
      {
        label: "builder.pageBuilder.blocks.text.weights.bold",
        value: "bold",
        targetStyles: {
          fontWeight: "bold",
        },
      },
    ],
  },
  textAlignmentShortcut as Shortcut<AllStylesSchemas>,
  {
    label: "builder.pageBuilder.blocks.text.shortcuts.style",
    icon: ({ className }) => <TypeOutline className={className} />,
    options: [
      {
        label: "builder.pageBuilder.blocks.text.styles.body",
        value: "body",
        targetStyles: {
          fontSize: { value: 1, unit: "rem" },
          fontWeight: "normal",
          lineHeight: { value: 1.6, unit: "rem" },
          color: COLORS["foreground"].value,
        },
      },
      {
        label: "builder.pageBuilder.blocks.text.styles.lead",
        value: "lead",
        targetStyles: {
          fontSize: { value: 1.125, unit: "rem" },
          fontWeight: "normal",
          lineHeight: { value: 1.7, unit: "rem" },
          color: COLORS["muted-foreground"].value,
        },
      },
      {
        label: "builder.pageBuilder.blocks.text.styles.caption",
        value: "caption",
        targetStyles: {
          fontSize: { value: 0.875, unit: "rem" },
          fontWeight: "normal",
          lineHeight: { value: 1.4, unit: "rem" },
          color: COLORS["muted-foreground"].value,
          textTransform: "uppercase",
          letterSpacing: { value: 0.05, unit: "rem" },
        },
      },
      {
        label: "builder.pageBuilder.blocks.text.styles.quote",
        value: "quote",
        targetStyles: {
          fontSize: { value: 1.125, unit: "rem" },
          fontWeight: "500",
          lineHeight: { value: 1.6, unit: "rem" },
          padding: (prev) => ({
            top: prev?.top ?? { value: 1, unit: "rem" },
            bottom: prev?.bottom ?? { value: 1, unit: "rem" },
            left: { value: 1.5, unit: "rem" },
            right: prev?.right ?? { value: 0, unit: "rem" },
          }),
          // borderLeft: { value: 4, unit: "px" },
          // borderLeftColor: "var(--primary)",
          // borderLeftStyle: "solid",
        },
      },
    ],
  },
  {
    label: "builder.pageBuilder.blocks.text.shortcuts.spacing",
    icon: ({ className }) => <Space className={className} />,
    options: [
      {
        label: "builder.pageBuilder.blocks.text.spacings.compact",
        value: "compact",
        targetStyles: {
          padding: {
            top: { value: 0.5, unit: "rem" },
            bottom: { value: 0.5, unit: "rem" },
            left: { value: 0.75, unit: "rem" },
            right: { value: 0.75, unit: "rem" },
          },
          margin: {
            top: { value: 0.25, unit: "rem" },
            bottom: { value: 0.25, unit: "rem" },
            left: "auto",
            right: "auto",
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.text.spacings.comfortable",
        value: "comfortable",
        targetStyles: {
          padding: {
            top: { value: 1, unit: "rem" },
            bottom: { value: 1, unit: "rem" },
            left: { value: 1.5, unit: "rem" },
            right: { value: 1.5, unit: "rem" },
          },
          margin: {
            top: { value: 0.5, unit: "rem" },
            bottom: { value: 0.5, unit: "rem" },
            left: "auto",
            right: "auto",
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.text.spacings.loose",
        value: "loose",
        targetStyles: {
          padding: {
            top: { value: 1.5, unit: "rem" },
            bottom: { value: 1.5, unit: "rem" },
            left: { value: 2, unit: "rem" },
            right: { value: 2, unit: "rem" },
          },
          margin: {
            top: { value: 1, unit: "rem" },
            bottom: { value: 1, unit: "rem" },
            left: "auto",
            right: "auto",
          },
        },
      },
    ],
  },
  backgroundColorShortcut,
  fontFamilyShortcut as Shortcut<AllStylesSchemas>,
  colorShortcut,
];
