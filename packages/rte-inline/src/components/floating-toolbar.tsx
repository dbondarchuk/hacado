"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  mergeRefs,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
} from "@timelish/ui";
import { Eraser, MoreHorizontal, Redo2, Undo2 } from "lucide-react";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { useRTEContext } from "../context/rte-context";
import type { TextMark } from "../lib/rich-text-types";
import { BackgroundColorToolbarButton } from "../plugins/backgroundColor/toolbar";
import { BoldToolbarButton } from "../plugins/bold/toolbar";
import { ColorToolbarButton } from "../plugins/color/toolbar";
import { FontFamilyToolbarButton } from "../plugins/fontFamily/toolbar";
import { FontSizeToolbarButton } from "../plugins/fontSize/toolbar";
import { FontWeightToolbarButton } from "../plugins/fontWeight/toolbar";
import { ItalicToolbarButton } from "../plugins/italic/toolbar";
import { LetterSpacingToolbarButton } from "../plugins/letterSpacing/toolbar";
import { LineHeightToolbarButton } from "../plugins/lineHeight/toolbar";
import { StrikethroughToolbarButton } from "../plugins/strikethrough/toolbar";
import { SubscriptToolbarButton } from "../plugins/subscript/toolbar";
import { SuperscriptToolbarButton } from "../plugins/superscript/toolbar";
import { TextTransformToolbarButton } from "../plugins/textTransform/toolbar";
import { UnderlineToolbarButton } from "../plugins/underline/toolbar";

interface FloatingToolbarProps {
  position: { top: number; left: number };
  documentElement?: Document;
}

export const FloatingToolbar = forwardRef<HTMLDivElement, FloatingToolbarProps>(
  ({ position, documentElement = document }, ref) => {
    const rteContext = useRTEContext();
    const t = useI18n("builder");
    const [adjustedPosition, setAdjustedPosition] = useState(position);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const [openPopover, setOpenPopover] = useState<string | null>(null);

    useEffect(() => {
      if (!toolbarRef.current) return;

      const toolbar = toolbarRef.current;
      const rect = toolbar.getBoundingClientRect();
      const viewportWidth =
        documentElement.defaultView?.innerWidth ?? window.innerWidth;
      const viewportHeight =
        documentElement.defaultView?.innerHeight ?? window.innerHeight;

      let x = position.left - rect.width / 2;
      let y = position.top;

      // Keep within viewport bounds
      if (x < 10) x = 10;
      if (x + rect.width > viewportWidth - 10)
        x = viewportWidth - rect.width - 10;

      // If toolbar would be above viewport, show it below
      if (y < 10) y = position.top + 60;

      setAdjustedPosition({ top: y, left: x });
    }, [position, toolbarRef.current]);

    const isDisabled = (
      feature: keyof TextMark | "clearFormat" | "undo" | "redo",
    ) => (rteContext.disabledFeatures || []).includes(feature as any);

    const handlePopoverContentRef = useCallback(
      (element: HTMLElement | null) => {
        if (rteContext.registerPopoverRef) {
          return rteContext.registerPopoverRef(element);
        }
      },
      [rteContext.registerPopoverRef],
    );

    return (
      <Toolbar
        ref={mergeRefs(ref, toolbarRef)}
        className="absolute z-[30] animate-in fade-in-0 zoom-in-95"
        style={{
          left: `${adjustedPosition.left}px`,
          top: `${adjustedPosition.top}px`,
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-lg">
          <ToolbarGroup>
            {!isDisabled("undo") && (
              <ToolbarButton
                size="sm"
                className="h-7 w-7 p-0"
                tooltip={t("rte.toolbar.undo")}
                onClick={rteContext.undo}
                disabled={!rteContext.canUndo}
              >
                <Undo2 className="h-3.5 w-3.5" />
              </ToolbarButton>
            )}

            {!isDisabled("redo") && (
              <ToolbarButton
                size="sm"
                className="h-7 w-7 p-0"
                onClick={rteContext.redo}
                disabled={!rteContext.canRedo}
                tooltip={t("rte.toolbar.redo")}
              >
                <Redo2 className="h-3.5 w-3.5" />
              </ToolbarButton>
            )}
          </ToolbarGroup>
          <ToolbarGroup>
            <FontSizeToolbarButton />
            <FontFamilyToolbarButton />
            <FontWeightToolbarButton />
          </ToolbarGroup>
          <ToolbarGroup>
            <ColorToolbarButton />
            <BackgroundColorToolbarButton />
          </ToolbarGroup>
          <ToolbarGroup>
            <BoldToolbarButton />
            <ItalicToolbarButton />
            <UnderlineToolbarButton />
          </ToolbarGroup>
          <ToolbarGroup>
            <DropdownMenu
              modal={false}
              open={openPopover === "more"}
              onOpenChange={(open) => setOpenPopover(open ? "more" : null)}
            >
              <DropdownMenuTrigger asChild>
                <ToolbarButton
                  size="sm"
                  className="h-7 w-7 p-0"
                  tooltip={t("rte.toolbar.moreOptions")}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </ToolbarButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent ref={handlePopoverContentRef}>
                <DropdownMenuGroup>
                  <StrikethroughToolbarButton />
                  <SuperscriptToolbarButton />
                  <SubscriptToolbarButton />
                </DropdownMenuGroup>
                <DropdownMenuGroup>
                  <LetterSpacingToolbarButton />
                  <TextTransformToolbarButton />
                  <LineHeightToolbarButton />
                </DropdownMenuGroup>
                {!isDisabled("clearFormat") && (
                  <DropdownMenuItem onClick={rteContext.clearFormat}>
                    <Eraser className="mr-2 h-3.5 w-3.5" />
                    {t("rte.toolbar.clearFormat")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </ToolbarGroup>
        </div>
      </Toolbar>
    );
  },
);
