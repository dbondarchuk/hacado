import { colorShortcut, Shortcut } from "@hacado/page-builder-base";
import { MoveDiagonal2, Paintbrush2 } from "lucide-react";
import { IconStylesSchema } from "./styles";

export const iconShortcuts: Shortcut<IconStylesSchema>[] = [
  {
    label: "builder.pageBuilder.blocks.icon.size",
    icon: ({ className }) => <MoveDiagonal2 className={className} />,
    inputType: "combobox",
    options: [
      {
        label: "builder.pageBuilder.blocks.icon.sizes.small",
        value: "small",
        targetStyles: {
          width: { value: 1, unit: "rem" },
          height: { value: 1, unit: "rem" },
        },
      },
      {
        label: "builder.pageBuilder.blocks.icon.sizes.medium",
        value: "medium",
        targetStyles: {
          width: { value: 1.5, unit: "rem" },
          height: { value: 1.5, unit: "rem" },
        },
      },
      {
        label: "builder.pageBuilder.blocks.icon.sizes.large",
        value: "large",
        targetStyles: {
          width: { value: 2, unit: "rem" },
          height: { value: 2, unit: "rem" },
        },
      },
      {
        label: "builder.pageBuilder.blocks.icon.sizes.xlarge",
        value: "xlarge",
        targetStyles: {
          width: { value: 3, unit: "rem" },
          height: { value: 3, unit: "rem" },
        },
      },
      {
        label: "builder.pageBuilder.blocks.icon.sizes.xxlarge",
        value: "xxlarge",
        targetStyles: {
          width: { value: 4, unit: "rem" },
          height: { value: 4, unit: "rem" },
        },
      },
    ],
  },
  colorShortcut,
  {
    label: "builder.pageBuilder.shortcuts.fill",
    icon: ({ className }) => <Paintbrush2 className={className} />,
    inputType: "color",
    targetStyle: "fill",
  },
];
