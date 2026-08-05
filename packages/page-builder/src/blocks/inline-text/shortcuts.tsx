import {
  backgroundColorShortcut,
  colorShortcut,
  fontFamilyShortcut,
  fontSizeShortcut,
  Shortcut,
  textAlignmentShortcut,
} from "@hacado/page-builder-base";
import { AllStylesSchemas } from "@hacado/page-builder-base/style";

export const inlineTextShortcuts: Shortcut<AllStylesSchemas>[] = [
  fontSizeShortcut as Shortcut<AllStylesSchemas>,
  textAlignmentShortcut as Shortcut<AllStylesSchemas>,
  backgroundColorShortcut,
  fontFamilyShortcut as Shortcut<AllStylesSchemas>,
  colorShortcut,
];
