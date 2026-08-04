"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@timelish/ui";
import { CaseSensitive } from "lucide-react";
import { useRTEContext } from "../../context/rte-context";

const TEXT_TRANSFORM_KEYS = [
  { key: "inherit", value: "inherit" },
  { key: "none", value: "none" },
  { key: "uppercase", value: "uppercase" },
  { key: "lowercase", value: "lowercase" },
  { key: "capitalize", value: "capitalize" },
];

export function TextTransformToolbarButton() {
  const context = useRTEContext();
  const { marks: activeMarks } = context.getActiveMarks();
  const t = useI18n("builder");

  const handleValueChange = async (value: string) => {
    await context.restoreSelection();
    context.applyFormat("textTransform", value);
  };

  if (context.disabledFeatures?.includes("textTransform")) return null;
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <CaseSensitive className="mr-2 h-3.5 w-3.5" />
        {t("rte.plugins.textTransform.toolbar")}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup
          value={activeMarks.textTransform ?? "inherit"}
          onValueChange={handleValueChange}
        >
          {TEXT_TRANSFORM_KEYS.map((transform) => (
            <DropdownMenuRadioItem
              key={transform.value}
              value={transform.value}
            >
              {t(`rte.plugins.textTransform.options.${transform.key}` as any)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
