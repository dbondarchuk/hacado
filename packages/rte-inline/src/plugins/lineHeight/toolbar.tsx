"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@hacado/ui";
import { ArrowDownToLine } from "lucide-react";
import { useRTEContext } from "../../context/rte-context";

const LINE_HEIGHT_KEYS = [
  { key: "inherit", value: "inherit", preview: "" },
  { key: "tight", value: 1, preview: "1" },
  { key: "snug", value: 1.25, preview: "1.25" },
  { key: "normal", value: 1.5, preview: "1.5" },
  { key: "relaxed", value: 1.75, preview: "1.75" },
  { key: "loose", value: 2, preview: "2" },
];

export function LineHeightToolbarButton() {
  const context = useRTEContext();
  const { marks: activeMarks } = context.getActiveMarks();
  const t = useI18n("builder");

  const handleValueChange = async (value: string) => {
    await context.restoreSelection();
    const parsedValue =
      value === "inherit" ? "inherit" : Number.parseFloat(value);
    context.applyFormat("lineHeight", parsedValue);
  };

  if (context.disabledFeatures?.includes("lineHeight")) return null;
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <ArrowDownToLine className="mr-2 h-3.5 w-3.5" />
        {t("rte.plugins.lineHeight.toolbar")}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup
          value={activeMarks.lineHeight?.toString() ?? "inherit"}
          onValueChange={handleValueChange}
        >
          {LINE_HEIGHT_KEYS.map((lineHeight) => (
            <DropdownMenuRadioItem
              key={lineHeight.value}
              value={lineHeight.value?.toString()}
            >
              {t(`rte.plugins.lineHeight.options.${lineHeight.key}` as any)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
