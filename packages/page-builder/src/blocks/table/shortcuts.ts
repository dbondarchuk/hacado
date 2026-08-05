import {
  backgroundColorShortcut,
  colorShortcut,
  fontFamilyShortcut,
  fontSizeShortcut,
  Shortcut,
} from "@hacado/page-builder-base";
import { AllStylesSchemas } from "@hacado/page-builder-base/style";
import { AlignCenter } from "lucide-react";

export const tableCellAlignShortcut: Shortcut<AllStylesSchemas> = {
  label: "builder.pageBuilder.blocks.table.shortcuts.align",
  icon: AlignCenter,
  options: [
    {
      label: "builder.pageBuilder.blocks.table.align.start",
      value: "start",
      targetStyles: {
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        alignContent: "flex-start",
        justifyContent: "flex-start",
      },
    },
    {
      label: "builder.pageBuilder.blocks.table.align.center",
      value: "center",
      targetStyles: {
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignContent: "center",
        justifyContent: "center",
      },
    },
  ],
};

export const tableCellShortcuts: Shortcut<AllStylesSchemas>[] = [
  fontSizeShortcut as Shortcut<AllStylesSchemas>,
  backgroundColorShortcut,
  colorShortcut,
  fontFamilyShortcut as Shortcut<AllStylesSchemas>,
  tableCellAlignShortcut,
];

/** Block-level shortcuts when the table itself is selected (not a cell). */
export const tableBlockShortcuts: Shortcut<AllStylesSchemas>[] = [
  fontSizeShortcut as Shortcut<AllStylesSchemas>,
  backgroundColorShortcut,
  colorShortcut,
  fontFamilyShortcut as Shortcut<AllStylesSchemas>,
];

/** @deprecated Use tableCellShortcuts when a cell slot is selected. */
export const tableShortcuts = tableCellShortcuts;
