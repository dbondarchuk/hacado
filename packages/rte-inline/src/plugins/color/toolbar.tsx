"use client";

import { useI18n } from "@hacado/i18n/client";
import { Palette } from "lucide-react";
import { useCallback, useState } from "react";
import { ColorPickerButton } from "../../components/toolbar/color-picker";
import { useRTEContext } from "../../context/rte-context";

export function ColorToolbarButton() {
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
    context.applyFormat("color", color);
    setOpenPopover(false);
  };

  if (context.disabledFeatures?.includes("color")) return null;
  return (
    <ColorPickerButton
      mark="color"
      active={activeMarks.color !== undefined}
      onChange={handleChange}
      open={openPopover}
      onClose={() => setOpenPopover(false)}
      onOpenChange={(open) => setOpenPopover(open)}
      icon={Palette}
      tooltip={t("rte.plugins.color.toolbar")}
      contentRef={handlePopoverContentRef}
      color={activeMarks.color}
    />
  );
}
