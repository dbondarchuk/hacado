"use client";

import { useI18n } from "@timelish/i18n/client";
import { ToolbarButton, ToolbarGroup } from "@timelish/ui";
import { Redo2, Undo2 } from "lucide-react";
import { useCallback, useEffect } from "react";
import {
  useBlockEditorDisableOptions,
  useCanRedoHistory,
  useCanUndoHistory,
  useRedoHistory,
  useSelectedBlockId,
  useUndoHistory,
} from "../../../documents/editor/context";
import { isUndoRedo } from "../../../documents/helpers/is-undo-redo";
import { usePortalContext } from "../portal-context";

export const ToolbarHistoryGroup = () => {
  const t = useI18n("builder");
  const canUndo = useCanUndoHistory();
  const canRedo = useCanRedoHistory();
  const undoHistory = useUndoHistory();
  const redoHistory = useRedoHistory();
  const { document: portalDocument } = usePortalContext();

  const selectedBlockId = useSelectedBlockId();
  const editorDisableOptions = useBlockEditorDisableOptions(selectedBlockId);

  const undoRedo = useCallback(
    (e: KeyboardEvent) => {
      if (editorDisableOptions?.keyboardShortcuts?.undoRedo) {
        return;
      }

      if (isUndoRedo(e) === "undo" && canUndo) {
        undoHistory();
        e.preventDefault();
        e.stopPropagation();
      } else if (isUndoRedo(e) === "redo" && canRedo) {
        redoHistory();
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [canUndo, canRedo, undoHistory, redoHistory, editorDisableOptions],
  );

  useEffect(() => {
    portalDocument.defaultView?.addEventListener("keydown", undoRedo);
    return () => {
      portalDocument.defaultView?.removeEventListener("keydown", undoRedo);
    };
  }, [undoRedo, portalDocument]);

  return (
    <ToolbarGroup>
      <ToolbarButton
        tooltip={t("baseBuilder.builderToolbar.undo")}
        disabled={!canUndo}
        onClick={() => undoHistory()}
      >
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton
        tooltip={t("baseBuilder.builderToolbar.redo")}
        disabled={!canRedo}
        onClick={() => redoHistory()}
      >
        <Redo2 />
      </ToolbarButton>
    </ToolbarGroup>
  );
};
