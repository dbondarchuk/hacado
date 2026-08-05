"use client";

import { BuilderKeys, useI18n } from "@hacado/i18n/client";
import { colors } from "@hacado/types";
import {
  Button,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ToolbarButton,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
} from "@hacado/ui";
import { Sketch } from "@uiw/react-color";
import { Plus, X } from "lucide-react";
import { useCallback, useState } from "react";
import {
  isCustomHexColor,
  readRecentColors,
  RECENT_COLOR_SLOTS,
  rememberRecentColor,
} from "./recent-colors";

export const PRESET_GRID_COLUMNS = 8;

export const COLOR_NAMES = colors;

export const COLORS: Record<
  (typeof COLOR_NAMES)[number],
  { label: BuilderKeys; value: string }
> = COLOR_NAMES.reduce(
  (map, color) => ({
    ...map,
    [color]: {
      label: `rte.colors.options.${color}` satisfies BuilderKeys,
      value: `hsl(var(--value-${color}-color))`,
    },
  }),
  {} as Record<
    (typeof COLOR_NAMES)[number],
    { label: BuilderKeys; value: string }
  >,
);

export const FIXED_PRESET_COLORS = [
  {
    value: "#ffffff",
    label: "rte.colors.options.white" satisfies BuilderKeys,
  },
  {
    value: "#000000",
    label: "rte.colors.options.black" satisfies BuilderKeys,
  },
  {
    value: "#2563eb",
    label: "rte.colors.options.blue" satisfies BuilderKeys,
  },
  {
    value: "#16a34a",
    label: "rte.colors.options.green" satisfies BuilderKeys,
  },
  // {
  //   value: "#eab308",
  //   label: "rte.colors.options.yellow" satisfies BuilderKeys,
  // },
] as const;

export interface ColorPickerButtonProps {
  mark: string;
  active?: boolean;
  onChange: (color: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose: () => void;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
  contentRef: (element: HTMLDivElement | null) => void;
  color: string | undefined;
}

function ColorSwatch({
  color,
  label,
  selected,
  onPick,
}: {
  color: string;
  label: BuilderKeys;
  selected: boolean;
  onPick: () => void;
}) {
  const t = useI18n("builder");
  return (
    <TooltipResponsive>
      <TooltipResponsiveTrigger>
        <button
          type="button"
          className={cn(
            "size-6 rounded border border-border transition-transform hover:scale-110",
            selected &&
              "ring-2 ring-primary ring-offset-1 ring-offset-background scale-105",
          )}
          style={{ backgroundColor: color }}
          onClick={onPick}
          aria-label={t(label)}
        />
      </TooltipResponsiveTrigger>
      <TooltipResponsiveContent>{t(label)}</TooltipResponsiveContent>
    </TooltipResponsive>
  );
}

function RecentColorPlaceholder() {
  const t = useI18n("builder");
  return (
    <TooltipResponsive>
      <TooltipResponsiveTrigger>
        <div
          className="size-6 rounded border border-dashed border-muted-foreground/50 flex items-center justify-center"
          aria-hidden
        >
          <Plus className="size-3 text-muted-foreground/70" strokeWidth={2} />
        </div>
      </TooltipResponsiveTrigger>
      <TooltipResponsiveContent>
        {t("rte.colors.recentEmpty")}
      </TooltipResponsiveContent>
    </TooltipResponsive>
  );
}

export const ColorPickerButton = ({
  mark,
  active,
  onChange,
  open,
  onOpenChange,
  onClose,
  icon: Icon,
  tooltip,
  contentRef,
  color: currentColor,
}: ColorPickerButtonProps) => {
  const t = useI18n("builder");
  const [recentColors, setRecentColors] = useState<string[]>(readRecentColors);

  const [sketchColor, setSketchColor] = useState<string | undefined>(
    currentColor,
  );

  const applyColor = useCallback(
    (next: string, options?: { rememberCustom?: boolean }) => {
      if (options?.rememberCustom && isCustomHexColor(next)) {
        setRecentColors(rememberRecentColor(next));
      }
      onChange(next);
    },
    [onChange],
  );

  const recentSlots = Array.from(
    { length: RECENT_COLOR_SLOTS },
    (_, i) => recentColors[i] ?? null,
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <ToolbarButton
          size="sm"
          className="h-7 w-7 p-0"
          tooltip={tooltip}
          pressed={active}
        >
          <Icon className="h-3.5 w-3.5" />
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverContent
        ref={contentRef}
        className="border-none w-min p-0 flex flex-col gap-2"
        align="start"
      >
        <Sketch
          color={sketchColor || undefined}
          disableAlpha
          onChange={(c) => {
            setSketchColor(c.hex);
          }}
          presetColors={false}
          className="!shadow-none"
        />
        <div className="px-1">
          <Button
            variant="outline"
            size="xs"
            className="w-full text-xs"
            disabled={!sketchColor || sketchColor === currentColor}
            onClick={() => {
              if (!sketchColor) return;
              applyColor(sketchColor, { rememberCustom: true });
            }}
          >
            {t("rte.common.apply")}
          </Button>
        </div>
        <div className="p-1 bg-card rounded-sm flex flex-col gap-2">
          <div
            className="grid gap-0.5 justify-items-center"
            style={{
              gridTemplateColumns: `repeat(${PRESET_GRID_COLUMNS}, minmax(0, 1.5rem))`,
            }}
          >
            <TooltipResponsive>
              <TooltipResponsiveTrigger>
                <button
                  className="size-6 rounded border border-dashed border-muted-foreground/50 flex items-center justify-center"
                  aria-label={t("rte.common.clear")}
                  onClick={() => applyColor("inherit")}
                >
                  <X
                    className="size-3 text-muted-foreground/70"
                    strokeWidth={2}
                  />
                </button>
              </TooltipResponsiveTrigger>
              <TooltipResponsiveContent>
                {t("rte.common.clear")}
              </TooltipResponsiveContent>
            </TooltipResponsive>
            {Object.values(COLORS).map(({ value: color, label }) => (
              <ColorSwatch
                key={color}
                color={color}
                label={label}
                selected={color === currentColor}
                onPick={() => applyColor(color)}
              />
            ))}
            {FIXED_PRESET_COLORS.map(({ value: color, label }) => (
              <ColorSwatch
                key={color}
                color={color}
                label={label}
                selected={color === currentColor}
                onPick={() => applyColor(color)}
              />
            ))}
            {recentSlots.map((color, index) =>
              color ? (
                <ColorSwatch
                  key={`recent-${color}`}
                  color={color}
                  label={"rte.colors.options.custom" satisfies BuilderKeys}
                  selected={color === currentColor}
                  onPick={() => applyColor(color)}
                />
              ) : (
                <RecentColorPlaceholder key={`recent-empty-${index}`} />
              ),
            )}
          </div>
          {/* <Button
            variant="outline"
            size="xs"
            className="w-full text-xs"
            onClick={() => {
              applyColor("inherit");
            }}
          >
            {t("rte.common.clear")}
          </Button> */}
        </div>
      </PopoverContent>
    </Popover>
  );
};
