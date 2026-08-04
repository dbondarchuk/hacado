"use client";

import { useI18n } from "@timelish/i18n/client";
import { DropdownMenuCheckboxItem } from "@timelish/ui";
import { Superscript } from "lucide-react";
import { useRTEContext } from "../../context/rte-context";

export function SuperscriptToolbarButton() {
  const context = useRTEContext();
  const { marks: activeMarks, hasMixed } = context.getActiveMarks();
  const t = useI18n("builder");

  const handleCheckedChange = async (checked: boolean) => {
    await context.restoreSelection();
    context.applyFormat("superscript", checked);
  };

  if (context.disabledFeatures?.includes("superscript")) return null;
  return (
    <DropdownMenuCheckboxItem
      checked={
        activeMarks.superscript !== undefined || hasMixed.has("superscript")
      }
      onCheckedChange={handleCheckedChange}
    >
      <Superscript className="mr-2 h-3.5 w-3.5" />
      {t("rte.plugins.superscript.toolbar")}
    </DropdownMenuCheckboxItem>
  );
}
