"use client";

import { BuilderKeys, useI18n } from "@timelish/i18n/client";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  ToolbarButton,
} from "@timelish/ui";
import { Type } from "lucide-react";
import { useCallback } from "react";
import { useRTEContext } from "../../context/rte-context";

export const FONT_FAMILIES: {
  name: string;
  label: BuilderKeys;
  value: string;
}[] = [
  {
    name: "INHERIT",
    label: "rte.plugins.fontFamily.options.inherit",
    value: "inherit",
  },
  {
    name: "PRIMARY",
    label: "rte.plugins.fontFamily.options.primary",
    value: "var(--font-primary-value)",
  },
  {
    name: "SECONDARY",
    label: "rte.plugins.fontFamily.options.secondary",
    value: "var(--font-secondary-value)",
  },
  {
    name: "TERTIARY",
    label: "rte.plugins.fontFamily.options.tertiary",
    value: "var(--font-tertiary-value)",
  },
  {
    name: "MODERN_SANS",
    label: "rte.plugins.fontFamily.options.modernSans",
    value: '"Helvetica Neue", "Arial Nova", "Nimbus Sans", Arial, sans-serif',
  },
  {
    name: "BOOK_SANS",
    label: "rte.plugins.fontFamily.options.bookSans",
    value: 'Optima, Candara, "Noto Sans", source-sans-pro, sans-serif',
  },
  {
    name: "ORGANIC_SANS",
    label: "rte.plugins.fontFamily.options.organicSans",
    value:
      'Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", source-sans-pro, sans-serif',
  },
  {
    name: "GEOMETRIC_SANS",
    label: "rte.plugins.fontFamily.options.geometricSans",
    value:
      'Avenir, "Avenir Next LT Pro", Montserrat, Corbel, "URW Gothic", source-sans-pro, sans-serif',
  },
  {
    name: "HEAVY_SANS",
    label: "rte.plugins.fontFamily.options.heavySans",
    value:
      'Bahnschrift, "DIN Alternate", "Franklin Gothic Medium", "Nimbus Sans Narrow", sans-serif-condensed, sans-serif',
  },
  {
    name: "ROUNDED_SANS",
    label: "rte.plugins.fontFamily.options.roundedSans",
    value:
      'ui-rounded, "Hiragino Maru Gothic ProN", Quicksand, Comfortaa, Manjari, "Arial Rounded MT Bold", Calibri, source-sans-pro, sans-serif',
  },
  {
    name: "MODERN_SERIF",
    label: "rte.plugins.fontFamily.options.modernSerif",
    value: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif',
  },
  {
    name: "BOOK_SERIF",
    label: "rte.plugins.fontFamily.options.bookSerif",
    value:
      '"Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif',
  },
  {
    name: "MONOSPACE",
    label: "rte.plugins.fontFamily.options.monospace",
    value: '"Nimbus Mono PS", "Courier New", "Cutive Mono", monospace',
  },
];

export function FontFamilyToolbarButton() {
  const context = useRTEContext();
  const { marks: activeMarks } = context.getActiveMarks();

  const handleCheckedChange = async (value: string) => {
    await context.restoreSelection();
    context.applyFormat("fontFamily", value);
  };

  const t = useI18n("builder");
  const handlePopoverContentRef = useCallback(
    (element: HTMLElement | null) => {
      if (context.registerPopoverRef) {
        return context.registerPopoverRef(element);
      }
    },
    [context.registerPopoverRef],
  );

  if (context.disabledFeatures?.includes("fontFamily")) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          size="sm"
          className="h-7 w-7 p-0"
          tooltip={t("rte.plugins.fontFamily.toolbar")}
          pressed={
            !!activeMarks.fontFamily && activeMarks.fontFamily !== "inherit"
          }
        >
          <Type className="h-3.5 w-3.5" />
        </ToolbarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent ref={handlePopoverContentRef}>
        {FONT_FAMILIES.map((font) => (
          <DropdownMenuCheckboxItem
            key={font.value}
            checked={
              activeMarks.fontFamily === font.value ||
              (!activeMarks.fontFamily && font.value === "inherit")
            }
            onCheckedChange={() => handleCheckedChange(font.value)}
            style={font.value !== "inherit" ? { fontFamily: font.value } : {}}
          >
            {t.has(font.label as any) ? t(font.label as any) : font.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
