import { Video } from "lucide-react";
import * as z from "zod";
import { ShortcutWithAssetSelector } from "../types";

export const backgroundVideoShortcut: ShortcutWithAssetSelector<{
  backgroundVideo: z.ZodType<any, any>;
}> = {
  label: "builder.pageBuilder.shortcuts.backgroundVideo",
  icon: Video,
  inputType: "asset-selector",
  targetStyle: "backgroundVideo",
  styleValue: {
    get: (style: any) => {
      if (style && typeof style === "object" && style?.src) {
        return style.src || null;
      }
      return null;
    },
    set: {
      backgroundVideo: (value, prev) => {
        return {
          ...(typeof prev === "object" && prev ? prev : {}),
          src: value,
        };
      },
    },
  },
  assetSelectorConfig: {
    accept: "video/*",
    fullUrl: false,
    placeholder: "Select a video...",
  },
} satisfies ShortcutWithAssetSelector<{ backgroundVideo: z.ZodType<any, any> }>;
