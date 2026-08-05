import {
  colorShortcut,
  fontFamilyShortcut,
  Shortcut,
} from "@hacado/page-builder-base";
import { AllStylesSchemas } from "@hacado/page-builder-base/style";
import { Move } from "lucide-react";
import { WaitlistAdminAllKeys } from "../../../translations/types";

export const bookingWithWaitlistShortcuts: Shortcut<AllStylesSchemas>[] = [
  {
    label:
      "app_waitlist_admin.block.shortcuts.gap.label" satisfies WaitlistAdminAllKeys,
    icon: Move,
    options: [
      {
        label:
          "app_waitlist_admin.block.shortcuts.gap.gaps.none" satisfies WaitlistAdminAllKeys,
        value: "none",
        targetStyles: {
          gap: { value: 0, unit: "rem" },
        },
      },
      {
        label:
          "app_waitlist_admin.block.shortcuts.gap.gaps.small" satisfies WaitlistAdminAllKeys,
        value: "small",
        targetStyles: {
          gap: { value: 0.25, unit: "rem" },
        },
      },
      {
        label:
          "app_waitlist_admin.block.shortcuts.gap.gaps.medium" satisfies WaitlistAdminAllKeys,
        value: "medium",
        targetStyles: {
          gap: { value: 1, unit: "rem" },
        },
      },
      {
        label:
          "app_waitlist_admin.block.shortcuts.gap.gaps.large" satisfies WaitlistAdminAllKeys,
        value: "large",
        targetStyles: {
          gap: { value: 2, unit: "rem" },
        },
      },
      {
        label:
          "app_waitlist_admin.block.shortcuts.gap.gaps.x-large" satisfies WaitlistAdminAllKeys,
        value: "x-large",
        targetStyles: {
          gap: { value: 4, unit: "rem" },
        },
      },
    ],
  },
  fontFamilyShortcut as Shortcut<AllStylesSchemas>,
  colorShortcut,
];
