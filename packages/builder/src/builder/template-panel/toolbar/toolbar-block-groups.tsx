"use client";

import { useI18n } from "@timelish/i18n/client";
import { ToolbarButton, ToolbarGroup } from "@timelish/ui";
import { ArrowDown, ArrowUp, ArrowUpFromLine, Copy, Trash } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import {
  useBlockDisableOptions,
  useBlockEditorDisableOptions,
  useBlockParentData,
  useDispatchAction,
  useDocument,
  useRootBlockId,
  useSelectedBlockId,
} from "../../../documents/editor/context";
import { getMoveBlockOutTarget } from "../../../documents/helpers/blocks";
import { usePortalContext } from "../portal-context";
import { ToolbarCopyPasteGroup } from "./toolbar-copy-paste-group";

export const ToolbarBlockGroups = () => {
  const t = useI18n("builder");
  const dispatchAction = useDispatchAction();
  const selectedBlockId = useSelectedBlockId();
  const rootBlockId = useRootBlockId();
  const document = useDocument();
  const disable = useBlockDisableOptions(selectedBlockId);
  const canDoBlockActions = selectedBlockId && selectedBlockId !== rootBlockId;
  const editorDisableOptions = useBlockEditorDisableOptions(selectedBlockId);
  const parentData = useBlockParentData(selectedBlockId);
  const parentInGrandparent = useBlockParentData(
    parentData?.parentBlockId ?? null,
  );
  const canMoveOut =
    !!canDoBlockActions &&
    !disable?.move &&
    !!parentInGrandparent?.parentBlockId;

  const isMac = useMemo(() => {
    return navigator.userAgent?.toLocaleLowerCase().includes("mac");
  }, []);

  const isMoveModifierKey = useCallback(
    (e: KeyboardEvent) => {
      return isMac ? e.altKey : e.ctrlKey;
    },
    [isMac],
  );

  const { document: portalDocument } = usePortalContext();

  const keyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
      if (!selectedBlockId) return;

      if (
        e.key === "ArrowUp" &&
        canDoBlockActions &&
        !disable?.move &&
        !editorDisableOptions?.keyboardShortcuts?.moveUp &&
        isMoveModifierKey(e)
      ) {
        dispatchAction({
          type: "move-block-up",
          value: {
            blockId: selectedBlockId,
          },
        });
        e.preventDefault();
        e.stopPropagation();
      } else if (
        e.key === "ArrowDown" &&
        canDoBlockActions &&
        !disable?.move &&
        !editorDisableOptions?.keyboardShortcuts?.moveDown &&
        isMoveModifierKey(e)
      ) {
        dispatchAction({
          type: "move-block-down",
          value: {
            blockId: selectedBlockId,
          },
        });
        e.preventDefault();
        e.stopPropagation();
      } else if (
        e.key === "Delete" &&
        canDoBlockActions &&
        !disable?.delete &&
        !editorDisableOptions?.keyboardShortcuts?.delete &&
        isMoveModifierKey(e)
      ) {
        dispatchAction({
          type: "delete-block",
          value: {
            blockId: selectedBlockId,
          },
        });
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [
      canDoBlockActions,
      dispatchAction,
      disable,
      isMoveModifierKey,
      selectedBlockId,
      editorDisableOptions,
    ],
  );

  useEffect(() => {
    portalDocument.defaultView?.addEventListener("keydown", keyboardShortcuts);
    return () => {
      portalDocument.defaultView?.removeEventListener(
        "keydown",
        keyboardShortcuts,
      );
    };
  }, [keyboardShortcuts, portalDocument]);

  const blockId = selectedBlockId ?? rootBlockId;
  return (
    <>
      <ToolbarGroup>
        <ToolbarButton
          tooltip={t("baseBuilder.builderToolbar.moveUp")}
          disabled={!canDoBlockActions || disable?.move}
          onClick={() =>
            dispatchAction({
              type: "move-block-up",
              value: {
                blockId,
              },
            })
          }
        >
          <ArrowUp />
        </ToolbarButton>
        <ToolbarButton
          tooltip={t("baseBuilder.builderToolbar.moveDown")}
          disabled={!canDoBlockActions || disable?.move}
          onClick={() =>
            dispatchAction({
              type: "move-block-down",
              value: {
                blockId,
              },
            })
          }
        >
          <ArrowDown />
        </ToolbarButton>
        <ToolbarButton
          tooltip={t("baseBuilder.builderToolbar.moveOut")}
          disabled={!canMoveOut}
          onClick={() => {
            const target = getMoveBlockOutTarget(document, blockId);
            if (!target) return;
            dispatchAction({
              type: "move-block",
              value: {
                blockId,
                ...target,
              },
            });
          }}
        >
          <ArrowUpFromLine />
        </ToolbarButton>
      </ToolbarGroup>
      <ToolbarCopyPasteGroup
        canDoBlockActions={!!canDoBlockActions}
        disableClone={!!disable?.clone}
      />
      <ToolbarGroup>
        <ToolbarButton
          tooltip={t("baseBuilder.builderToolbar.clone")}
          disabled={!canDoBlockActions || disable?.clone}
          onClick={() =>
            dispatchAction({
              type: "clone-block",
              value: {
                blockId,
              },
            })
          }
        >
          <Copy />
        </ToolbarButton>
        <ToolbarButton
          tooltip={t("baseBuilder.builderToolbar.delete")}
          disabled={!canDoBlockActions || disable?.delete}
          onClick={() => {
            dispatchAction({
              type: "delete-block",
              value: {
                blockId,
              },
            });
          }}
        >
          <Trash />
        </ToolbarButton>
      </ToolbarGroup>
    </>
  );
};
