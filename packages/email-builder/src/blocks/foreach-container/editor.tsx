import {
  EditorChildren,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { ForeachContainerProps } from "./schema";

export const ForeachContainerEditor = ({ props }: ForeachContainerProps) => {
  const t = useI18n("builder");

  const currentBlock = useCurrentBlock<ForeachContainerProps>();
  const overlayProps = useBlockEditor(currentBlock.id);

  const value = currentBlock.data?.props?.value || "";

  return (
    <div className="w-full" {...overlayProps}>
      <div className="mb-2 text-muted-foreground text-xs w-full">
        {t.rich(
          "emailBuilder.blocks.foreachContainer.forEachItemInValueFormat",
          {
            item: () => <em>_item</em>,
            value: value || t("emailBuilder.blocks.foreachContainer.value"),
          },
        )}
      </div>
      <EditorChildren blockId={currentBlock.id} property="props" />
    </div>
  );
};
