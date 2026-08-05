import {
  backgroundColorShortcut,
  backgroundImageShortcut,
  colorShortcut,
  fontFamilyShortcut,
  Shortcut,
} from "@hacado/page-builder-base";
import { AllStylesSchemas } from "@hacado/page-builder-base/style";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignVerticalSpaceBetween,
  Box,
  Grid3X3,
  Move,
} from "lucide-react";

export const gridContainerShortcuts: Shortcut<AllStylesSchemas>[] = [
  {
    label: "builder.pageBuilder.blocks.gridContainer.shortcuts.padding",
    icon: AlignVerticalSpaceBetween,
    options: [
      {
        label: "builder.pageBuilder.blocks.gridContainer.paddings.none",
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
        label: "builder.pageBuilder.blocks.gridContainer.paddings.small",
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
        label: "builder.pageBuilder.blocks.gridContainer.paddings.medium",
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
        label: "builder.pageBuilder.blocks.gridContainer.paddings.large",
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
        label: "builder.pageBuilder.blocks.gridContainer.paddings.x-large",
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
    label: "builder.pageBuilder.blocks.gridContainer.shortcuts.gap",
    icon: Move,
    inputType: "number-with-unit",
    targetStyle: "gap",
    // options: [
    //   {
    //     label: "builder.pageBuilder.blocks.gridContainer.gaps.none",
    //     value: "none",
    //     targetStyles: {
    //       gap: { value: 0, unit: "px" },
    //     },
    //   },
    //   {
    //     label: "builder.pageBuilder.blocks.gridContainer.gaps.small",
    //     value: "small",
    //     targetStyles: {
    //       gap: { value: 8, unit: "px" },
    //     },
    //   },
    //   {
    //     label: "builder.pageBuilder.blocks.gridContainer.gaps.medium",
    //     value: "medium",
    //     targetStyles: {
    //       gap: { value: 16, unit: "px" },
    //     },
    //   },
    //   {
    //     label: "builder.pageBuilder.blocks.gridContainer.gaps.large",
    //     value: "large",
    //     targetStyles: {
    //       gap: { value: 24, unit: "px" },
    //     },
    //   },
    //   {
    //     label: "builder.pageBuilder.blocks.gridContainer.gaps.xlarge",
    //     value: "xlarge",
    //     targetStyles: {
    //       gap: { value: 32, unit: "px" },
    //     },
    //   },
    //   {
    //     label: "builder.pageBuilder.blocks.gridContainer.gaps.xxlarge",
    //     value: "xxlarge",
    //     targetStyles: {
    //       gap: { value: 48, unit: "px" },
    //     },
    //   },
    // ],
  },
  {
    label:
      "builder.pageBuilder.blocks.gridContainer.shortcuts.gridTemplateColumns",
    icon: Grid3X3,
    options: [
      {
        label: "builder.pageBuilder.blocks.gridContainer.gridTemplates.autoFit",
        value: "autoFit",
        targetStyles: {
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.gridContainer.gridTemplates.autoFill",
        value: "autoFill",
        targetStyles: {
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.gridContainer.gridTemplates.twoColumns",
        value: "twoColumns",
        targetStyles: {
          gridTemplateColumns: "repeat(2, 1fr)",
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.gridContainer.gridTemplates.threeColumns",
        value: "threeColumns",
        targetStyles: {
          gridTemplateColumns: "repeat(3, 1fr)",
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.gridContainer.gridTemplates.fourColumns",
        value: "fourColumns",
        targetStyles: {
          gridTemplateColumns: "repeat(4, 1fr)",
        },
      },
      {
        label: "builder.pageBuilder.blocks.gridContainer.gridTemplates.sidebar",
        value: "sidebar",
        targetStyles: {
          gridTemplateColumns: "250px 1fr",
        },
      },
      {
        label: "builder.pageBuilder.blocks.gridContainer.gridTemplates.hero",
        value: "hero",
        targetStyles: {
          gridTemplateColumns: "1fr",
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.gridContainer.gridTemplates.asymmetric",
        value: "asymmetric",
        targetStyles: {
          gridTemplateColumns: "1fr 2fr 1fr",
        },
      },
      {
        label: "builder.pageBuilder.blocks.gridContainer.gridTemplates.mixed",
        value: "mixed",
        targetStyles: {
          gridTemplateColumns: "200px 1fr 150px",
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.gridContainer.gridTemplates.magazine",
        value: "magazine",
        targetStyles: {
          gridTemplateColumns: "2fr 1fr 1fr",
        },
      },
      {
        label: "builder.pageBuilder.blocks.gridContainer.gridTemplates.gallery",
        value: "gallery",
        targetStyles: {
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.gridContainer.gridTemplates.dashboard",
        value: "dashboard",
        targetStyles: {
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.gridContainer.gridTemplates.threeColumnWide",
        value: "threeColumnWide",
        targetStyles: {
          gridTemplateColumns: "1fr 2fr 1fr",
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.gridContainer.gridTemplates.fiveColumns",
        value: "fiveColumns",
        targetStyles: {
          gridTemplateColumns: "repeat(5, 1fr)",
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.gridContainer.gridTemplates.sixColumns",
        value: "sixColumns",
        targetStyles: {
          gridTemplateColumns: "repeat(6, 1fr)",
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.gridContainer.gridTemplates.twelveColumns",
        value: "twelveColumns",
        targetStyles: {
          gridTemplateColumns: "repeat(12, 1fr)",
        },
      },
    ],
  },
  {
    label: "builder.pageBuilder.blocks.gridContainer.shortcuts.justifyContent",
    icon: AlignCenterHorizontal,
    options: [
      {
        label: "builder.pageBuilder.blocks.gridContainer.justifyContents.start",
        value: "start",
        targetStyles: {
          justifyContent: "flex-start",
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.gridContainer.justifyContents.center",
        value: "center",
        targetStyles: {
          justifyContent: "center",
        },
      },
      {
        label: "builder.pageBuilder.blocks.gridContainer.justifyContents.end",
        value: "end",
        targetStyles: {
          justifyContent: "flex-end",
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.gridContainer.justifyContents.spaceBetween",
        value: "spaceBetween",
        targetStyles: {
          justifyContent: "space-between",
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.gridContainer.justifyContents.spaceAround",
        value: "spaceAround",
        targetStyles: {
          justifyContent: "space-around",
        },
      },
      {
        label:
          "builder.pageBuilder.blocks.gridContainer.justifyContents.spaceEvenly",
        value: "spaceEvenly",
        targetStyles: {
          justifyContent: "space-evenly",
        },
      },
    ],
  },
  {
    label: "builder.pageBuilder.blocks.gridContainer.shortcuts.alignItems",
    icon: AlignCenterVertical,
    options: [
      {
        label: "builder.pageBuilder.blocks.gridContainer.alignItemses.start",
        value: "start",
        targetStyles: {
          alignItems: "flex-start",
        },
      },
      {
        label: "builder.pageBuilder.blocks.gridContainer.alignItemses.center",
        value: "center",
        targetStyles: {
          alignItems: "center",
        },
      },
      {
        label: "builder.pageBuilder.blocks.gridContainer.alignItemses.end",
        value: "end",
        targetStyles: {
          alignItems: "flex-end",
        },
      },
      {
        label: "builder.pageBuilder.blocks.gridContainer.alignItemses.stretch",
        value: "stretch",
        targetStyles: {
          alignItems: "stretch",
        },
      },
      {
        label: "builder.pageBuilder.blocks.gridContainer.alignItemses.baseline",
        value: "baseline",
        targetStyles: {
          alignItems: "baseline",
        },
      },
    ],
  },
  {
    label: "builder.pageBuilder.blocks.gridContainer.shortcuts.style",
    icon: Box,
    options: [
      {
        label: "builder.pageBuilder.blocks.gridContainer.styles.plain",
        value: "plain",
        targetStyles: {
          backgroundColor: undefined,
          borderColor: undefined,
          borderRadius: undefined,
        },
      },
      {
        label: "builder.pageBuilder.blocks.gridContainer.styles.card",
        value: "card",
        targetStyles: {
          backgroundColor: "var(--value-card-color)",
          borderColor: "var(--value-border-color)",
          borderRadius: { value: 0.5, unit: "rem" },
        },
      },
      {
        label: "builder.pageBuilder.blocks.gridContainer.styles.paper",
        value: "paper",
        targetStyles: {
          backgroundColor: "var(--value-background-color)",
          borderColor: "var(--value-border-color)",
          borderRadius: { value: 0.25, unit: "rem" },
        },
      },
      {
        label: "builder.pageBuilder.blocks.gridContainer.styles.rounded",
        value: "rounded",
        targetStyles: {
          backgroundColor: "var(--value-muted-color)",
          borderColor: undefined,
          borderRadius: { value: 0.75, unit: "rem" },
        },
      },
      {
        label: "builder.pageBuilder.blocks.gridContainer.styles.bordered",
        value: "bordered",
        targetStyles: {
          backgroundColor: undefined,
          borderColor: "var(--value-border-color)",
          borderRadius: { value: 0.375, unit: "rem" },
        },
      },
    ],
  },
  backgroundColorShortcut,
  backgroundImageShortcut as Shortcut<AllStylesSchemas>,
  colorShortcut,
  fontFamilyShortcut as Shortcut<AllStylesSchemas>,
];
