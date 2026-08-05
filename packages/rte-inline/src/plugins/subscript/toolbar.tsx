"use client";

import { useI18n } from "@hacado/i18n/client";
import { DropdownMenuCheckboxItem } from "@hacado/ui";
import { Subscript } from "lucide-react";
import { useRTEContext } from "../../context/rte-context";

export function SubscriptToolbarButton() {
  const context = useRTEContext();
  const { marks: activeMarks, hasMixed } = context.getActiveMarks();
  const t = useI18n("builder");

  const handleCheckedChange = async (checked: boolean) => {
    await context.restoreSelection();
    context.applyFormat("subscript", checked);
  };

  if (context.disabledFeatures?.includes("subscript")) return null;
  return (
    <DropdownMenuCheckboxItem
      checked={activeMarks.subscript !== undefined || hasMixed.has("subscript")}
      onCheckedChange={handleCheckedChange}
    >
      <Subscript className="mr-2 h-3.5 w-3.5" />
      {t("rte.plugins.subscript.toolbar")}
    </DropdownMenuCheckboxItem>
  );
}
