"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  ToolbarButton,
} from "@timelish/ui";
import { TypeOutline } from "lucide-react";
import { useCallback } from "react";
import { useRTEContext } from "../../context/rte-context";

const FONT_WEIGHT_KEYS = [
  { key: "inherit", value: "inherit", preview: "" },
  { key: "thin", value: 100, preview: "100" },
  { key: "extraLight", value: 200, preview: "200" },
  { key: "light", value: 300, preview: "300" },
  { key: "regular", value: 400, preview: "400" },
  { key: "medium", value: 500, preview: "500" },
  { key: "semiBold", value: 600, preview: "600" },
  { key: "bold", value: 700, preview: "700" },
  { key: "extraBold", value: 800, preview: "800" },
  { key: "black", value: 900, preview: "900" },
];

export function FontWeightToolbarButton() {
  const context = useRTEContext();
  const { marks: activeMarks } = context.getActiveMarks();
  const t = useI18n("builder");

  const currentFontWeight = activeMarks.fontWeight || "inherit";

  const handleCheckedChange = async (
    checked: boolean,
    value: number | "inherit",
  ) => {
    await context.restoreSelection();
    if (checked) {
      context.applyFormat("fontWeight", value);
    } else {
      context.applyFormat("fontWeight", "inherit");
    }
  };

  const handlePopoverContentRef = useCallback(
    (element: HTMLElement | null) => {
      if (context.registerPopoverRef) {
        return context.registerPopoverRef(element);
      }
    },
    [context.registerPopoverRef],
  );

  if (context.disabledFeatures?.includes("fontWeight")) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          size="sm"
          className="h-7 w-7 p-0"
          tooltip={t("rte.plugins.fontWeight.toolbar")}
          pressed={currentFontWeight !== "inherit"}
        >
          <TypeOutline className="h-3.5 w-3.5" />
        </ToolbarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent ref={handlePopoverContentRef}>
        {FONT_WEIGHT_KEYS.map((weight) => (
          <DropdownMenuCheckboxItem
            key={weight.value}
            checked={currentFontWeight === weight.value}
            onCheckedChange={(checked) => {
              if (
                typeof weight.value === "number" ||
                weight.value === "inherit"
              ) {
                handleCheckedChange(checked, weight.value);
              }
            }}
          >
            <span>
              {t(`rte.plugins.fontWeight.options.${weight.key}` as any)}
              {weight.preview && (
                <span className="ml-1 text-muted-foreground text-xs">
                  ({weight.preview})
                </span>
              )}
            </span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
