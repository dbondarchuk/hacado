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
          "emailBuilder.blocks.conditionalContainer.ifConditionIsCorrectFormat",

          {
            condition:
              condition ||
              t("emailBuilder.blocks.conditionalContainer.condition"),
          },
        )}
      </div>
      <EditorChildren blockId={currentBlock.id} property="props.then" />
      <div className="mb-2 text-muted-foreground text-xs w-full">
        {t("emailBuilder.blocks.conditionalContainer.otherwise")},
      </div>
      <EditorChildren blockId={currentBlock.id} property="props.otherwise" />
    </div>
  );
};
