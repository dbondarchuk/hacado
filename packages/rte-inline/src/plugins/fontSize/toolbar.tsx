"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  ScrollArea,
  ToolbarButton,
  useDebounceCallback,
} from "@hacado/ui";
import { Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRTEContext } from "../../context/rte-context";
import {
  adjustFontSizesInRange,
  normalizeRichText,
} from "../../lib/rich-text-utils";

const COMMON_FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];

export function FontSizeToolbarButton() {
  const {
    getActiveMarks,
    restoreSelection,
    applyFormat,
    getSelection,
    disabledFeatures,
    value,
    onChange,
    editorRef,
    registerPopoverRef,
  } = useRTEContext();
  const { marks: activeMarks, hasMixed } = getActiveMarks();
  const t = useI18n("builder");

  const [fontSizeInput, setFontSizeInput] = useState<string>("");
  const shouldNotClosePopoverRef = useRef(false);

  useEffect(() => {
    if (hasMixed.has("fontSize")) {
      setFontSizeInput("");
    } else if (activeMarks.fontSize && activeMarks.fontSize !== "inherit") {
      setFontSizeInput(activeMarks.fontSize.toString());
    } else {
      setFontSizeInput("");
    }
  }, [activeMarks.fontSize, hasMixed]);

  const handleFontSizeInputOnChange = useDebounceCallback(
    async (value: number) => {
      await restoreSelection();
      applyFormat("fontSize", value);
    },
    [restoreSelection, applyFormat],
    500,
  );

  const handleFontSizeInputChange = (value: string) => {
    setFontSizeInput(value);
    const parsed = Number.parseInt(value);
    if (!Number.isNaN(parsed) && parsed > 0) {
      shouldNotClosePopoverRef.current = true;
      handleFontSizeInputOnChange(parsed);
    }
  };

  const handleFontSizeInputKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const current = activeMarks.fontSize;
      if (typeof current === "number") {
        await restoreSelection();
        applyFormat("fontSize", current + 1);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const current = activeMarks.fontSize;
      if (typeof current === "number") {
        await restoreSelection();
        applyFormat("fontSize", current - 1);
      }
    }
  };

  const handleFontSizeAdjust = async (delta: number) => {
    await restoreSelection();
    const selection = getSelection();
    if (!selection || !editorRef?.current) return;

    const newValue = adjustFontSizesInRange(
      value,
      selection.start.blockIndex,
      selection.start.offset,
      selection.end.blockIndex,
      selection.end.offset,
      delta,
    );

    onChange(normalizeRichText(newValue));
  };

  const handlePopoverContentRef = useCallback(
    (element: HTMLElement | null) => {
      if (registerPopoverRef) {
        return registerPopoverRef(element);
      }
    },
    [registerPopoverRef],
  );

  if (disabledFeatures?.includes("fontSize")) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          size="sm"
          className="h-7 px-2 text-xs font-mono"
          tooltip={t("rte.plugins.fontSize.toolbar")}
        >
          {hasMixed.has("fontSize") || !fontSizeInput ? (
            <span className="text-muted-foreground">
              {t("rte.common.size")}
            </span>
          ) : (
            `${fontSizeInput}px`
          )}
        </ToolbarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent ref={handlePopoverContentRef}>
        <div className="mb-2 flex items-center gap-1">
          <Button
            variant="outline"
            size="xs"
            className="h-5 w-5 p-0 bg-transparent"
            onClick={async (e) => {
              handleFontSizeAdjust(-1);
              e.preventDefault();
              e.stopPropagation();
              shouldNotClosePopoverRef.current = true;
            }}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="number"
            min={8}
            max={72}
            step={1}
            h="sm"
            value={fontSizeInput}
            onChange={(e) => {
              e.stopPropagation();
              handleFontSizeInputChange(e.target.value);
            }}
            onKeyDown={handleFontSizeInputKeyDown}
            placeholder={
              hasMixed.has("fontSize")
                ? t("rte.common.mixed")
                : t("rte.common.size")
            }
            className="h-7 w-16 flex-1 text-center text-xs"
          />
          <Button
            variant="outline"
            size="xs"
            className="h-5 w-5 p-0 bg-transparent"
            onClick={async (e) => {
              handleFontSizeAdjust(1);
              e.preventDefault();
              e.stopPropagation();
              shouldNotClosePopoverRef.current = true;
            }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-56">
          <DropdownMenuItem
            onClick={async () => {
              await restoreSelection();
              applyFormat("fontSize", "inherit");
            }}
          >
            {t("rte.plugins.fontSize.options.inherit")}
          </DropdownMenuItem>
          {COMMON_FONT_SIZES.map((size) => (
            <DropdownMenuItem
              key={size}
              onClick={async () => {
                await restoreSelection();
                applyFormat("fontSize", size);
              }}
            >
              {t.has(`rte.plugins.fontSize.options.${size}px` as any)
                ? t(`rte.plugins.fontSize.options.${size}px` as any)
                : `${size}px`}
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
