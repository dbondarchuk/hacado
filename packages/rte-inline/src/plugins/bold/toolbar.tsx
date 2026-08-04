"use client";

import { useI18n } from "@timelish/i18n/client";
import { ToolbarButton } from "@timelish/ui";
import { Bold } from "lucide-react";
import { useRTEContext } from "../../context/rte-context";

export function BoldToolbarButton() {
  const context = useRTEContext();
  const { marks: activeMarks, hasMixed } = context.getActiveMarks();
  const t = useI18n("builder");

  const isBoldActive =
    activeMarks.bold || activeMarks.fontWeight === 700 || hasMixed.has("bold");

  const handleClick = async () => {
    await context.restoreSelection();
    context.applyFormat("fontWeight", isBoldActive ? "inherit" : 700);
  };

  if (context.disabledFeatures?.includes("bold")) return null;
  return (
    <ToolbarButton
      size="sm"
      className="h-7 w-7 p-0"
      onClick={handleClick}
      pressed={isBoldActive}
      tooltip={t("rte.plugins.bold.toolbar")}
    >
      <Bold className="h-3.5 w-3.5" />
    </ToolbarButton>
  );
}
