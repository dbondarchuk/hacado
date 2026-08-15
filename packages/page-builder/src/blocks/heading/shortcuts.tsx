import {
  backgroundColorShortcut,
  colorShortcut,
  fontFamilyShortcut,
  fontSizeShortcut,
  Shortcut,
  textAlignmentShortcut,
} from "@hacado/page-builder-base";
import { AllStylesSchemas } from "@hacado/page-builder-base/style";
import { TypeOutline } from "lucide-react";

export const headingShortcuts: Shortcut<AllStylesSchemas>[] = [
  {
    label: "builder.pageBuilder.blocks.heading.style",
    icon: ({ className }) => <TypeOutline className={className} />,
    options: [
      {
        label: "builder.pageBuilder.blocks.heading.styles.display",
        value: "display",
        targetStyles: {
          fontSize: {
            value: 3,
            unit: "rem",
          },
          fontWeight: "bold",
          textAlign: "center",
          margin: (prev) => ({
            top: prev?.top ?? "auto",
            bottom: { value: 1.5, unit: "rem" },
            left: prev?.left ?? "auto",
            right: prev?.right ?? "auto",
          }),
          padding: (prev) => ({
            top: { value: 2, unit: "rem" },
            bottom: { value: 2, unit: "rem" },
            left: prev?.left ?? { value: 0, unit: "rem" },
            right: prev?.right ?? { value: 0, unit: "rem" },
          }),
        },
      },
      {
        label: "builder.pageBuilder.blocks.heading.styles.title",
        value: "title",
        targetStyles: {
          fontSize: {
            value: 2,
            unit: "rem",
          },
          fontWeight: "bold",
          textAlign: "center",
          margin: (prev) => ({
            top: prev?.top ?? "auto",
            bottom: { value: 1, unit: "rem" },
            left: prev?.left ?? "auto",
            right: prev?.right ?? "auto",
          }),
          padding: (prev) => ({
            top: { value: 1, unit: "rem" },
            bottom: { value: 1, unit: "rem" },
            left: prev?.left ?? { value: 0, unit: "rem" },
            right: prev?.right ?? { value: 0, unit: "rem" },
          }),
        },
      },
      {
        label: "builder.pageBuilder.blocks.heading.styles.subtitle",
        value: "subtitle",
        targetStyles: {
          fontSize: {
            value: 1.25,
            unit: "rem",
          },
          fontWeight: "600",
          textAlign: "center",
          margin: (prev) => ({
            top: prev?.top ?? "auto",
            bottom: { value: 0.75, unit: "rem" },
            left: prev?.left ?? "auto",
            right: prev?.right ?? "auto",
          }),
          padding: (prev) => ({
            top: { value: 0.5, unit: "rem" },
            bottom: { value: 0.5, unit: "rem" },
            left: prev?.left ?? { value: 0, unit: "rem" },
            right: prev?.right ?? { value: 0, unit: "rem" },
          }),
        },
      },
      {
        label: "builder.pageBuilder.blocks.heading.styles.caption",
        value: "caption",
        targetStyles: {
          fontSize: {
            value: 0.875,
            unit: "rem",
          },
          fontWeight: "normal",
          textAlign: "center",
          margin: (prev) => ({
            top: prev?.top ?? "auto",
            bottom: { value: 0.5, unit: "rem" },
            left: prev?.left ?? "auto",
            right: prev?.right ?? "auto",
          }),
          padding: (prev) => ({
            top: { value: 0.25, unit: "rem" },
            bottom: { value: 0.25, unit: "rem" },
            left: prev?.left ?? { value: 0, unit: "rem" },
            right: prev?.right ?? { value: 0, unit: "rem" },
          }),
        },
      },
    ],
  },
  fontSizeShortcut as Shortcut<AllStylesSchemas>,
  textAlignmentShortcut as Shortcut<AllStylesSchemas>,
  backgroundColorShortcut,
  fontFamilyShortcut as Shortcut<AllStylesSchemas>,
  colorShortcut,
];
