"use client";

import { useI18n } from "@timelish/i18n/client";
import { DropdownMenuCheckboxItem } from "@timelish/ui";
import { Strikethrough } from "lucide-react";
import { useRTEContext } from "../../context/rte-context";

export function StrikethroughToolbarButton() {
  const context = useRTEContext();
  const { marks: activeMarks, hasMixed } = context.getActiveMarks();
  const t = useI18n("builder");

  const handleCheckedChange = async (checked: boolean) => {
    await context.restoreSelection();
    context.applyFormat("strikethrough", checked);
  };

  if (context.disabledFeatures?.includes("strikethrough")) return null;
  return (
    <DropdownMenuCheckboxItem
      checked={
        activeMarks.strikethrough !== undefined || hasMixed.has("strikethrough")
      }
      onCheckedChange={handleCheckedChange}
    >
      <Strikethrough className="mr-2 h-3.5 w-3.5" />
      {t("rte.plugins.strikethrough.toolbar")}
    </DropdownMenuCheckboxItem>
  );
}
