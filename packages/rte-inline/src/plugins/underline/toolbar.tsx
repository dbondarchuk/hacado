"use client";

import { useI18n } from "@timelish/i18n/client";
import { ToolbarButton } from "@timelish/ui";
import { Underline } from "lucide-react";
import { useRTEContext } from "../../context/rte-context";

export function UnderlineToolbarButton() {
  const context = useRTEContext();
  const { marks: activeMarks } = context.getActiveMarks();
  const t = useI18n("builder");

  const handleClick = async () => {
    await context.restoreSelection();
    context.applyFormat("underline");
  };

  if (context.disabledFeatures?.includes("underline")) return null;
  return (
    <ToolbarButton
      size="sm"
      className="h-7 w-7 p-0"
      onClick={handleClick}
      pressed={activeMarks.underline !== undefined}
      tooltip={t("rte.plugins.underline.toolbar")}
    >
      <Underline className="h-3.5 w-3.5" />
    </ToolbarButton>
  );
}
