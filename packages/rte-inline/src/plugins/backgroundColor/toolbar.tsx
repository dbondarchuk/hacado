"use client";

import { useI18n } from "@hacado/i18n/client";
import { Highlighter } from "lucide-react";
import { useCallback, useState } from "react";
import { ColorPickerButton } from "../../components/toolbar/color-picker";
import { useRTEContext } from "../../context/rte-context";

export function BackgroundColorToolbarButton() {
  const context = useRTEContext();
  const { marks: activeMarks } = context.getActiveMarks();
  const [openPopover, setOpenPopover] = useState(false);
  const t = useI18n("builder");

  const handlePopoverContentRef = useCallback(
    (element: HTMLElement | null) => {
      if (context.registerPopoverRef) {
        return context.registerPopoverRef(element);
      }
    },
    [context],
  );

  const handleChange = async (color: string) => {
    await context.restoreSelection();
    context.applyFormat("backgroundColor", color);
    setOpenPopover(false);
  };

  if (context.disabledFeatures?.includes("backgroundColor")) return null;
  return (
    <ColorPickerButton
      mark="backgroundColor"
      active={activeMarks.backgroundColor !== undefined}
      onChange={handleChange}
      open={openPopover}
      onClose={() => setOpenPopover(false)}
      onOpenChange={(open) => setOpenPopover(open)}
      icon={Highlighter}
      tooltip={t("rte.plugins.backgroundColor.toolbar")}
      contentRef={handlePopoverContentRef}
      color={activeMarks.backgroundColor}
    />
  );
}
