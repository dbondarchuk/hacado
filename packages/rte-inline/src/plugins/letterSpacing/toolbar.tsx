"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@hacado/ui";
import { Space } from "lucide-react";
import { useRTEContext } from "../../context/rte-context";

const LETTER_SPACING_KEYS = [
  { key: "inherit", value: "inherit" },
  { key: "tight", value: "tight" },
  { key: "normal", value: "normal" },
  { key: "wide", value: "wide" },
];

export function LetterSpacingToolbarButton() {
  const context = useRTEContext();
  const { marks: activeMarks } = context.getActiveMarks();
  const t = useI18n("builder");

  const handleValueChange = async (value: string) => {
    await context.restoreSelection();
    context.applyFormat("letterSpacing", value);
  };

  if (context.disabledFeatures?.includes("letterSpacing")) return null;
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Space className="mr-2 h-3.5 w-3.5" />
        {t("rte.plugins.letterSpacing.toolbar")}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup
          value={activeMarks.letterSpacing ?? "inherit"}
          onValueChange={handleValueChange}
        >
          {LETTER_SPACING_KEYS.map((spacing) => (
            <DropdownMenuRadioItem key={spacing.value} value={spacing.value}>
              {t(`rte.plugins.letterSpacing.options.${spacing.key}` as any)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
