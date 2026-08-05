import { useI18n } from "@hacado/i18n/client";
import { useCallback, useMemo } from "react";
import {
  useBlocks,
  useDispatchAction,
  useRootBlock,
} from "../../documents/editor/context";
import { BaseBlockProps } from "../../documents/types";
import { BaseSidebarPanel } from "./configuration-panel/input-panels/helpers/base-sidebar-panel";

export const StylesPanelTab = "styles";

export const StylesPanel: React.FC = () => {
  const block = useRootBlock();
  const dispatchAction = useDispatchAction();
  const tBuilder = useI18n("builder");
  const t = useI18n();

  if (!block) {
    return <p>{tBuilder("baseBuilder.inspector.stylesPanel.blockNotFound")}</p>;
  }

  const { data, type, base, metadata } = block;
  const blocks = useBlocks();
  const Panel = useMemo(
    () => blocks[block.type].Configuration,
    [block.type, blocks],
  );

  const setData = useCallback(
    (data: any) => {
      dispatchAction({
        type: "set-block-data",
        value: { blockId: block.id, data },
      });
    },
    [block.id, dispatchAction],
  );

  const setBase = useCallback(
    (base: BaseBlockProps) => {
      dispatchAction({
        type: "set-block-base",
        value: { blockId: block.id, base },
      });
    },
    [block.id, dispatchAction],
  );

  const setMetadata = useCallback(
    (metadata: Record<string, any> | undefined) => {
      dispatchAction({
        type: "set-block-metadata",
        value: { blockId: block.id, metadata },
      });
    },
    [dispatchAction, block.id],
  );

  return (
    <BaseSidebarPanel title={t(blocks[type].displayName)}>
      <Panel
        key="root"
        data={data}
        setData={setData}
        base={base}
        onBaseChange={setBase}
        metadata={metadata}
        onMetadataChange={setMetadata}
      />
    </BaseSidebarPanel>
  );
};
