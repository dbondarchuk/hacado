import {
  backgroundColorShortcut,
  colorShortcut,
  fontFamilyShortcut,
  fontSizeShortcut,
  Shortcut,
} from "@hacado/page-builder-base";
import { AllStylesSchemas, COLORS } from "@hacado/page-builder-base/style";
import {
  AlignLeft,
  MoveDiagonal2,
  MoveHorizontal,
  Palette,
  SquareRoundCorner,
} from "lucide-react";

export const buttonShortcuts: Shortcut<AllStylesSchemas>[] = [
  {
    label: "builder.pageBuilder.blocks.button.variant",
    icon: ({ className }) => <Palette className={className} />,
    options: [
      {
        label: "builder.pageBuilder.blocks.button.variants.primary",
        value: "primary",
        targetStyles: {
          backgroundColor: COLORS["primary"].value,
          color: COLORS["primary-foreground"].value,
          borderStyle: "none",
          filter: {
            variants: [
              {
                value: "brightness(0.9)",
                state: [
                  { state: "hover", target: { type: "self" } },
                  { state: "focus", target: { type: "self" } },
                  { state: "active", target: { type: "self" } },
                ],
              },
            ],
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.button.variants.secondary",
        value: "secondary",
        targetStyles: {
          backgroundColor: COLORS["secondary"].value,
          color: COLORS["secondary-foreground"].value,
          borderStyle: "none",
          filter: {
            variants: [
              {
                value: "brightness(0.9)",
                state: [
                  { state: "hover", target: { type: "self" } },
                  { state: "focus", target: { type: "self" } },
                  { state: "active", target: { type: "self" } },
                ],
              },
            ],
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.button.variants.destructive",
        value: "destructive",
        targetStyles: {
          backgroundColor: COLORS["destructive"].value,
          color: COLORS["destructive-foreground"].value,
          borderStyle: "none",
          filter: {
            variants: [
              {
                value: "brightness(0.9)",
                state: [
                  { state: "hover", target: { type: "self" } },
                  { state: "focus", target: { type: "self" } },
                  { state: "active", target: { type: "self" } },
                ],
              },
            ],
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.button.variants.muted",
        value: "muted",
        targetStyles: {
          backgroundColor: COLORS["muted"].value,
          color: COLORS["muted-foreground"].value,
          borderStyle: "none",
          filter: {
            variants: [
              {
                value: "brightness(0.9)",
                state: [
                  { state: "hover", target: { type: "self" } },
                  { state: "focus", target: { type: "self" } },
                  { state: "active", target: { type: "self" } },
                ],
              },
            ],
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.button.variants.ghost",
        value: "ghost",
        targetStyles: {
          backgroundColor: {
            variants: [
              {
                value: "transparent",
              },
              {
                value: COLORS["secondary"].value,
                state: [
                  { state: "hover", target: { type: "self" } },
                  { state: "focus", target: { type: "self" } },
                  { state: "active", target: { type: "self" } },
                ],
              },
            ],
          },
          filter: {
            variants: [
              {
                value: "none",
                state: [
                  { state: "hover", target: { type: "self" } },
                  { state: "focus", target: { type: "self" } },
                  { state: "active", target: { type: "self" } },
                ],
              },
            ],
          },
          color: {
            variants: [
              {
                value: COLORS["primary-foreground"].value,
              },
              {
                value: COLORS["secondary-foreground"].value,
                state: [
                  { state: "hover", target: { type: "self" } },
                  { state: "focus", target: { type: "self" } },
                  { state: "active", target: { type: "self" } },
                ],
              },
            ],
          },
          borderStyle: "none",
        },
      },
    ],
  },
  {
    label: "builder.pageBuilder.blocks.button.width",
    icon: ({ className }) => <MoveHorizontal className={className} />,
    options: [
      {
        label: "builder.pageBuilder.blocks.button.widths.auto",
        value: "auto",
        targetStyles: {
          width: "max-content",
        },
      },
      {
        label: "builder.pageBuilder.blocks.button.widths.full",
        value: "full",
        targetStyles: {
          width: {
            value: 100,
            unit: "%",
          },
        },
      },
    ],
  },
  {
    label: "builder.pageBuilder.blocks.button.size",
    icon: ({ className }) => <MoveDiagonal2 className={className} />,
    options: [
      {
        label: "builder.pageBuilder.blocks.button.sizes.x-small",
        value: "x-small",
        targetStyles: {
          padding: {
            top: { value: 0.25, unit: "rem" },
            right: { value: 0.5, unit: "rem" },
            bottom: { value: 0.25, unit: "rem" },
            left: { value: 0.5, unit: "rem" },
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.button.sizes.small",
        value: "small",
        targetStyles: {
          padding: {
            top: { value: 0.5, unit: "rem" },
            right: { value: 1, unit: "rem" },
            bottom: { value: 0.5, unit: "rem" },
            left: { value: 1, unit: "rem" },
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.button.sizes.medium",
        value: "medium",
        targetStyles: {
          padding: {
            top: { value: 0.75, unit: "rem" },
            right: { value: 1.5, unit: "rem" },
            bottom: { value: 0.75, unit: "rem" },
            left: { value: 1.5, unit: "rem" },
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.button.sizes.large",
        value: "large",
        targetStyles: {
          padding: {
            top: { value: 2, unit: "rem" },
            right: { value: 3, unit: "rem" },
            bottom: { value: 2, unit: "rem" },
            left: { value: 3, unit: "rem" },
          },
        },
      },
    ],
  },
  {
    label: "builder.pageBuilder.blocks.button.style",
    icon: ({ className }) => <SquareRoundCorner className={className} />,
    options: [
      {
        label: "builder.pageBuilder.blocks.button.styles.rectangle",
        value: "rectangle",
        targetStyles: {
          borderRadius: {
            value: 0,
            unit: "px",
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.button.styles.rounded",
        value: "rounded",
        targetStyles: {
          borderRadius: {
            value: 10,
            unit: "px",
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.button.styles.pill",
        value: "pill",
        targetStyles: {
          borderRadius: {
            value: 64,
            unit: "px",
          },
        },
      },
    ],
  },
  {
    label: "builder.pageBuilder.blocks.button.alignment",
    icon: ({ className }) => <AlignLeft className={className} />,
    options: [
      {
        label: "builder.pageBuilder.blocks.button.alignments.left",
        value: "left",
        targetStyles: {
          display: "inline",
          margin: (prev) => ({
            top: prev?.top ?? "auto",
            right: {
              value: 0,
              unit: "rem",
            },
            bottom: prev?.bottom ?? "auto",
            left: {
              value: 0,
              unit: "rem",
            },
          }),
        },
      },
      {
        label: "builder.pageBuilder.blocks.button.alignments.center",
        value: "center",
        targetStyles: {
          display: "block",
          margin: (prev) => ({
            top: prev?.top ?? "auto",
            right: "auto",
            bottom: prev?.bottom ?? "auto",
            left: "auto",
          }),
        },
      },
    ],
  },
  fontSizeShortcut as Shortcut<AllStylesSchemas>,
  backgroundColorShortcut,
  fontFamilyShortcut as Shortcut<AllStylesSchemas>,
  colorShortcut,
];
