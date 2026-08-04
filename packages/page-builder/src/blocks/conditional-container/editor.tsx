import {
  EditorChildren,
  useBlockEditor,
  useCurrentBlock,
} from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { ConditionalContainerProps } from "./schema";

export const ConditionalContainerEditor = ({
  props,
}: ConditionalContainerProps) => {
  const t = useI18n("builder");

  const currentBlock = useCurrentBlock<ConditionalContainerProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const condition = currentBlock.data?.props?.condition || "";

  return (
    <div className="w-full" {...overlayProps}>
      <div className="mb-2 text-muted-foreground text-xs w-full">
        {t.rich(
          "pageBuilder.blocks.conditionalContainer.ifConditionIsCorrectFormat",
          {
            condition: () => (
              <em className="font-bold">
                {condition ||
                  t("pageBuilder.blocks.conditionalContainer.value")}
              </em>
            ),
          },
        )}
      </div>
      <div className="w-full">
        <EditorChildren blockId={currentBlock.id} property="props.then" />
      </div>
      <div className="mb-2 text-muted-foreground text-xs w-full">
        {t("pageBuilder.blocks.conditionalContainer.otherwise")}
      </div>
      <div className="w-full">
        <EditorChildren blockId={currentBlock.id} property="props.otherwise" />
      </div>
    </div>
  );
};
