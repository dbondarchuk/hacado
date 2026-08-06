"use client";

import { ToolbarGroup } from "@hacado/ui";
import { useCallback, useMemo } from "react";
import {
  useBlock,
  useBlocks,
  useDispatchAction,
  useRootBlock,
  useRootBlockId,
  useRootBlockType,
  useSelectedBlock,
  useSelectedSlot,
} from "../../../documents/editor/context";
import { useSelectedSlotStyleHandlers } from "../../inspector-drawer/slot-styles-panel";

export const ToolbarBlockToolbarGroup = () => {
  const selectedBlock = useSelectedBlock();
  const selectedSlot = useSelectedSlot();
  const slotParentBlock = useBlock(selectedSlot?.blockId ?? "");
  const { styles: slotStyles, setStyles: setSlotStyles } =
    useSelectedSlotStyleHandlers();
  const rootBlockId = useRootBlockId();
  const rootBlock = useRootBlock();
  const inspectBlock = selectedBlock ?? slotParentBlock ?? rootBlock;
  const dispatchAction = useDispatchAction();
  const rootBlockType = useRootBlockType();
  const blocks = useBlocks();

  const blockType = inspectBlock?.type || rootBlockType;
  const blockId = inspectBlock?.id || rootBlockId;

  const BlockToolbar = useMemo(
    () => blocks[blockType]?.Toolbar,
    [blocks, blockType],
  );

  const setBlockData = useCallback(
    (data: any) => {
      dispatchAction({
        type: "set-block-data",
        value: { blockId, data },
      });
    },
    [dispatchAction, blockId],
  );

  const setMetadata = useCallback(
    (metadata: Record<string, any> | undefined) => {
      dispatchAction({
        type: "set-block-metadata",
        value: { blockId, metadata },
      });
    },
    [dispatchAction, blockId],
  );

  const toolbarData = useMemo(() => {
    const data = inspectBlock?.data ?? {};
    if (selectedSlot) {
      return { ...data, style: slotStyles };
    }
    return data;
  }, [inspectBlock?.data, selectedSlot, slotStyles]);

  const setToolbarData = useCallback(
    (data: unknown) => {
      if (selectedSlot) {
        setSlotStyles(
          (data as { style?: Record<string, unknown> }).style ?? {},
        );
        return;
      }
      setBlockData(data);
    },
    [selectedSlot, setSlotStyles, setBlockData],
  );

  if (!BlockToolbar) {
    return null;
  }

  return (
    <ToolbarGroup>
      {BlockToolbar && (
        <BlockToolbar
          data={toolbarData}
          setData={setToolbarData}
          base={inspectBlock?.base}
          metadata={inspectBlock?.metadata}
          onMetadataChange={setMetadata}
          selectedSlot={selectedSlot}
          onBaseChange={(base) => {
            dispatchAction({
              type: "set-block-base",
              value: { blockId: inspectBlock!.id, base },
            });
          }}
        />
      )}
    </ToolbarGroup>
  );
};
