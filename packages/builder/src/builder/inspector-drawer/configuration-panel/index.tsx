import { useI18n } from "@timelish/i18n/client";
import { useCallback, useMemo } from "react";
import {
  useBlock,
  useBlocks,
  useDispatchAction,
  useSelectedBlock,
  useSelectedSlot,
} from "../../../documents/editor/context";
import { BaseBlockProps } from "../../../documents/types";
import { BaseSidebarPanel } from "./input-panels/helpers/base-sidebar-panel";

function renderMessage(val: string) {
  return (
    <div className="m-3 p-1 border-dashed border border-secondary">
      <div className="text-secondary-foreground">{val}</div>
    </div>
  );
}

export const ConfigurationPanelTab = "block-configuration";

export const ConfigurationPanel: React.FC = () => {
  const selectedBlock = useSelectedBlock();
  const selectedSlot = useSelectedSlot();
  const slotParentBlock = useBlock(selectedSlot?.blockId ?? "");

  const inspectBlockId = selectedBlock?.id ?? selectedSlot?.blockId;
  const inspectBlockType = selectedBlock?.type ?? slotParentBlock?.type;

  const dispatchAction = useDispatchAction();

  const blocks = useBlocks();
  const tBuilder = useI18n("builder");
  const t = useI18n();

  const setBlock = useCallback(
    (data: any) => {
      if (!inspectBlockId) return;
      dispatchAction({
        type: "set-block-data",
        value: { blockId: inspectBlockId, data },
      });
    },
    [dispatchAction, inspectBlockId],
  );

  const setBase = useCallback(
    (base: BaseBlockProps) => {
      if (!inspectBlockId) return;
      dispatchAction({
        type: "set-block-base",
        value: { blockId: inspectBlockId, base },
      });
    },
    [dispatchAction, inspectBlockId],
  );

  const setMetadata = useCallback(
    (metadata: Record<string, any> | undefined) => {
      if (!inspectBlockId) return;
      dispatchAction({
        type: "set-block-metadata",
        value: { blockId: inspectBlockId, metadata },
      });
    },
    [dispatchAction, inspectBlockId],
  );

  const Panel = useMemo(
    () => (inspectBlockType ? blocks[inspectBlockType]?.Configuration : null),
    [blocks, inspectBlockType],
  );

  const inspectBlock = selectedBlock ?? slotParentBlock;

  if (!inspectBlockId || !Panel || !inspectBlock) {
    return renderMessage(
      tBuilder(
        "baseBuilder.inspector.configurationPanel.clickOnBlockToInspect",
      ),
    );
  }

  const { data, id, base, metadata } = inspectBlock;

  const panelTitle = selectedSlot
    ? `${t(blocks[inspectBlock.type].displayName)} · ${selectedSlot.slotKey}`
    : t(blocks[inspectBlock.type].displayName);

  return (
    <BaseSidebarPanel title={panelTitle}>
      <Panel
        data={data}
        setData={setBlock}
        key={selectedSlot ? `${id}-${selectedSlot.slotKey}` : id}
        base={base}
        onBaseChange={setBase}
        metadata={metadata}
        onMetadataChange={setMetadata}
        selectedSlot={selectedSlot}
      />
    </BaseSidebarPanel>
  );
};
