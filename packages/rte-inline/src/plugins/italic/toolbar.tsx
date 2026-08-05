"use client";

import { useI18n } from "@hacado/i18n/client";
import { ToolbarButton } from "@hacado/ui";
import { Italic } from "lucide-react";
import { useRTEContext } from "../../context/rte-context";

export function ItalicToolbarButton() {
  const context = useRTEContext();
  const { marks: activeMarks } = context.getActiveMarks();
  const t = useI18n("builder");

  const handleClick = async () => {
    await context.restoreSelection();
    context.applyFormat("italic");
  };

  if (context.disabledFeatures?.includes("italic")) return null;
  return (
    <ToolbarButton
      size="sm"
      className="h-7 w-7 p-0"
      onClick={handleClick}
      pressed={activeMarks.italic !== undefined}
      tooltip={t("rte.plugins.italic.toolbar")}
    >
      <Italic className="h-3.5 w-3.5" />
    </ToolbarButton>
  );
}
