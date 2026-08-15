import {
  colorShortcut,
  fontFamilyShortcut,
  Shortcut,
} from "@hacado/page-builder-base";
import { AllStylesSchemas } from "@hacado/page-builder-base/style";

export const bookingShortcuts: Shortcut<AllStylesSchemas>[] = [
  fontFamilyShortcut as Shortcut<AllStylesSchemas>,
  colorShortcut,
];
