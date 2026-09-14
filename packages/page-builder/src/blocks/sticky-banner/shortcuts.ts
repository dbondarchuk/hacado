import {
  colorShortcut,
  fontFamilyShortcut,
  Shortcut,
} from "@hacado/page-builder-base";
import { AllStylesSchemas } from "@hacado/page-builder-base/style";

export const stickyBannerShortcuts: Shortcut<AllStylesSchemas>[] = [
  fontFamilyShortcut as Shortcut<AllStylesSchemas>,
  colorShortcut,
];
