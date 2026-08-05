import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  toolbarButtonVariants,
  ToolbarToggleGroup,
  ToolbarToggleItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@hacado/ui";
import { Sketch } from "@uiw/react-color";
import { VariantProps } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import React from "react";
import { AllKeys, useI18n } from "@hacado/i18n/client";
import { ShortcutWithColor } from "../../shortcuts";
import { BaseStyleDictionary, COLORS_LIST, getColorStyle } from "../../style";

export interface ColorShortcutToolbarItem {
  shortcut: ShortcutWithColor<BaseStyleDictionary>;
  currentColorValue: string | null;
  onValueChange: (value: string) => void;
  tooltip: AllKeys;
}

const ColorToolbarButton = React.forwardRef<
  React.ElementRef<typeof ToolbarToggleItem>,
  {
    isColorPickerOpen: boolean;
    setIsColorPickerOpen: (open: boolean) => void;
    shortcut: ColorShortcutToolbarItem;
    handleColorChange: (color: string) => void;
  } & Omit<
    React.ComponentPropsWithoutRef<typeof ToolbarToggleItem>,
    "asChild" | "value"
  > &
    VariantProps<typeof toolbarButtonVariants>
>(
  (
    {
      children,
      className,
      size,
      variant,
      isColorPickerOpen,
      setIsColorPickerOpen,
      shortcut,
      handleColorChange,
      ...props
    },
    ref,
  ) => {
    const t = useI18n();
    return (
      <Popover
        open={isColorPickerOpen}
        onOpenChange={setIsColorPickerOpen}
        modal
      >
        <ToolbarToggleGroup value="single" type="single">
          <ToolbarToggleItem
            className={cn("text-xs p-1 justify-between gap-1 pr-1")}
            value={""}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    {<shortcut.shortcut.icon />}
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t(shortcut.tooltip)}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-1/2" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent border-none p-0 h-full flex items-center"
                    ref={ref}
                    {...props}
                  >
                    <ChevronDown
                      className="size-3.5 text-muted-foreground"
                      data-icon
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {t("builder.pageBuilder.styleInputs.color.presets")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </ToolbarToggleItem>
        </ToolbarToggleGroup>
        {/* <ToolbarButton
            tooltip={t(shortcut.tooltip)}
            className="text-xs p-1"
            style={{
              backgroundColor: shortcut.currentColorValue || "transparent",
              border: shortcut.currentColorValue
                ? "1px solid var(--border)"
                : "1px dashed var(--border)",
            }}
          >
            
          </ToolbarButton> */}
        <PopoverContent className="bg-transparent border-none shadow-none w-fit">
          <Sketch
            color={shortcut.currentColorValue || undefined}
            disableAlpha
            onChange={(c) => {
              const color = `${c.hsl.h.toFixed(0)} ${c.hsl.s.toFixed(1)}% ${c.hsl.l.toFixed(1)}%`;
              handleColorChange(color);
            }}
          />
        </PopoverContent>
      </Popover>
    );
  },
);

// Specialized toolbar for color shortcuts
export const ColorShortcutToolbar = ({
  shortcut,
}: {
  shortcut: ColorShortcutToolbarItem;
}) => {
  const t = useI18n();
  const [isColorPickerOpen, setIsColorPickerOpen] = React.useState(false);
  const [isPresetOpen, setIsPresetOpen] = React.useState(false);

  const handleColorChange = (color: string) => {
    shortcut.onValueChange(color);
  };

  const handlePresetSelect = (preset: string) => {
    shortcut.onValueChange(preset);
    setIsPresetOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Color swatch button */}
        {/* Preset dropdown */}
        <DropdownMenu open={isPresetOpen} onOpenChange={setIsPresetOpen}>
          <DropdownMenuTrigger asChild>
            <ColorToolbarButton
              isColorPickerOpen={isColorPickerOpen}
              setIsColorPickerOpen={setIsColorPickerOpen}
              shortcut={shortcut}
              handleColorChange={handleColorChange}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-0" align="start">
            <DropdownMenuRadioGroup
              value={shortcut.currentColorValue || ""}
              onValueChange={handlePresetSelect}
            >
              {COLORS_LIST.map((color) => (
                <DropdownMenuRadioItem
                  key={color.key}
                  value={color.value}
                  className="min-w-[120px]"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded border"
                      style={{ backgroundColor: getColorStyle(color.value) }}
                    />
                    {t(
                      `builder.pageBuilder.styles.colors.${color.key}` as AllKeys,
                    )}
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

/**
 * Creates a specialized toolbar item for color shortcuts
 */
export const createColorToolbarItem = <T extends BaseStyleDictionary>(
  shortcut: ShortcutWithColor<T>,
  data: any,
  setData: (data: any) => void,
): ColorShortcutToolbarItem => {
  // Get current color value from the target style
  const currentStyle = data.style?.[shortcut.targetStyle]?.find(
    (s: any) => !s.breakpoint?.length && !s.state?.length,
  );

  const currentColorValue: string | null = currentStyle?.value || null;

  // Apply color value change
  const applyColorValue = (value: string) => {
    const newData = { ...data };
    const newStyles = { ...newData.style };

    if (newStyles[shortcut.targetStyle]) {
      // Update existing style variants
      const currentVariants = newStyles[shortcut.targetStyle];
      if (currentVariants && currentVariants.length > 0) {
        const updatedVariants = currentVariants.map((variant: any) => ({
          ...variant,
          value,
        }));
        newStyles[shortcut.targetStyle] = updatedVariants;
      }
    } else {
      // Create new style variant
      newStyles[shortcut.targetStyle] = [
        {
          breakpoint: [],
          state: [],
          value,
        },
      ];
    }

    newData.style = newStyles;
    setData(newData);
  };

  return {
    shortcut: shortcut as ShortcutWithColor<BaseStyleDictionary>,
    currentColorValue,
    onValueChange: applyColorValue,
    tooltip: shortcut.label,
  };
};
