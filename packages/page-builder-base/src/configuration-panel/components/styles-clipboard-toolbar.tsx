"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  Button,
  toast,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@timelish/ui";
import { ClipboardCopy, ClipboardPaste } from "lucide-react";
import { useCallback } from "react";
import { StyleValue } from "../../style/css-renderer";
import { useStylesClipboard } from "../../style/styles-clipboard";
import { BaseStyleDictionary, StyleDictionary } from "../../style/types";

interface StylesClipboardToolbarProps<T extends BaseStyleDictionary> {
  styles: StyleValue<T>;
  onStylesChange: (styles: StyleValue<T>) => void;
  availableStyles: StyleDictionary<T>;
}

export const StylesClipboardToolbar = <T extends BaseStyleDictionary>({
  styles,
  onStylesChange,
  availableStyles,
}: StylesClipboardToolbarProps<T>) => {
  const t = useI18n("builder");
  const { hasCopiedStyles, copyStyles, getPasteableStyles } =
    useStylesClipboard();

  const handleCopy = useCallback(() => {
    copyStyles(styles);
    toast.success(t("pageBuilder.styles.copyStylesSuccess"));
  }, [copyStyles, styles, t]);

  const handlePaste = useCallback(() => {
    const pasteableStyles = getPasteableStyles(availableStyles);
    const pastedCount = Object.keys(pasteableStyles).length;

    if (pastedCount === 0) {
      toast.error(t("pageBuilder.styles.pasteStylesNoCompatible"));
      return;
    }

    onStylesChange({
      ...styles,
      ...pasteableStyles,
    });
    toast.success(
      t("pageBuilder.styles.pasteStylesSuccess", { count: pastedCount }),
    );
  }, [availableStyles, getPasteableStyles, onStylesChange, styles, t]);

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            aria-label={t("pageBuilder.styles.copyStyles")}
          >
            <ClipboardCopy className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("pageBuilder.styles.copyStyles")}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePaste}
            disabled={!hasCopiedStyles}
            aria-label={t("pageBuilder.styles.pasteStyles")}
          >
            <ClipboardPaste className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {hasCopiedStyles
            ? t("pageBuilder.styles.pasteStyles")
            : t("pageBuilder.styles.pasteStylesEmpty")}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
