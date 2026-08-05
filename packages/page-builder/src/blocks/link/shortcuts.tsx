import {
  backgroundColorShortcut,
  colorShortcut,
  fontFamilyShortcut,
  fontSizeShortcut,
  Shortcut,
  textAlignmentShortcut,
} from "@hacado/page-builder-base";
import { AllStylesSchemas, COLORS } from "@hacado/page-builder-base/style";
import { Link } from "lucide-react";

export const linkShortcuts: Shortcut<AllStylesSchemas>[] = [
  {
    label: "builder.pageBuilder.blocks.link.style",
    icon: ({ className }) => <Link className={className} />,
    options: [
      {
        label: "builder.pageBuilder.blocks.link.styles.default",
        value: "default",
        targetStyles: {
          backgroundColor: undefined,
          color: undefined,
          textDecoration: "underline",
          fontSize: {
            value: 1,
            unit: "rem",
          },
          fontWeight: "normal",
          textAlign: "left",
          display: "inline",
          width: "max-content",
        },
      },
      {
        label: "builder.pageBuilder.blocks.link.styles.button",
        value: "button",
        targetStyles: {
          color: {
            value: COLORS["foreground"].value,
          },
          backgroundColor: {
            value: COLORS["primary"].value,
          },
          textDecoration: "none",
          fontSize: {
            value: 1,
            unit: "rem",
          },
          fontWeight: "normal",
          textAlign: "center",
          display: "inline-block",
          width: "max-content",
          padding: {
            top: { value: 0.75, unit: "rem" },
            right: { value: 1.5, unit: "rem" },
            bottom: { value: 0.75, unit: "rem" },
            left: { value: 1.5, unit: "rem" },
          },
          borderRadius: {
            value: 10,
            unit: "px",
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.link.styles.minimal",
        value: "minimal",
        targetStyles: {
          color: undefined,
          backgroundColor: undefined,
          textDecoration: "none",
          fontSize: {
            value: 0.875,
            unit: "rem",
          },
          fontWeight: "normal",
          textAlign: "left",
          display: "inline",
          width: "max-content",
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
