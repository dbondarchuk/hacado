import {
  EditorArgsContext,
  EditorChildren,
  EditorReaderChildrenBlock,
  evaluate,
  useBlockEditor,
  useCurrentBlock,
  useEditorArgs,
  useIsSelectedBlock,
} from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { useMemo } from "react";
import { ForeachContainerProps, styles } from "./schema";
import { sliceForeachArray } from "./utils";

const ADDITIONAL_RENDERERS = 2;

export const ForeachContainerEditor = ({ props }: ForeachContainerProps) => {
  const t = useI18n("builder");
  const currentBlock = useCurrentBlock<ForeachContainerProps>();
  const isSelected = useIsSelectedBlock(currentBlock.id);
  const overlayProps = useBlockEditor(currentBlock.id);
  const value = currentBlock.data?.props?.value || "";

  const itemName = currentBlock.data?.props?.itemName || "_item";
  const className = useClassName();
  const base = currentBlock.base;

  const args = useEditorArgs();

  const extendedArgs = useMemo(() => {
    let array: any[] = [];
    try {
      array = evaluate(value, args);
    } catch (e) {
      console.error("Error evaluating value", e);
      array = [];
    }

    const items = Array.isArray(array)
      ? sliceForeachArray(
          array,
          currentBlock.data?.props?.skip,
          currentBlock.data?.props?.take,
        )
      : [];

    return {
      ...args,
      [itemName]: items[0],
    };
  }, [
    args,
    itemName,
    value,
    currentBlock.data?.props?.skip,
    currentBlock.data?.props?.take,
  ]);

  const take = currentBlock.data?.props?.take;
  const additionalRenderers =
    take !== undefined
      ? Math.max(0, Math.min(ADDITIONAL_RENDERERS, take - 1))
      : ADDITIONAL_RENDERERS;

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={currentBlock.data?.style}
      />
      <div
        className={cn("relative", className, base?.className)}
        id={base?.id}
        {...overlayProps}
      >
        <div
          className={cn(
            "absolute -bottom-6 left-0 z-10 bg-muted p-1 rounded-md text-muted-foreground text-xs",
            isSelected ? "absolute" : "hidden",
          )}
        >
          {t.rich(
            "pageBuilder.blocks.foreachContainer.forEachItemInValueFormat",
            {
              item: () => <em>{itemName}</em>,
              value: () => <em>{value || "value"}</em>,
            },
          )}
        </div>
        <EditorArgsContext.Provider value={extendedArgs}>
          <EditorChildren blockId={currentBlock.id} property="props" />
          {Array.from({ length: additionalRenderers }).map((_, index) => (
            <EditorReaderChildrenBlock
              key={index}
              blockId={currentBlock.id}
              property="props"
            />
          ))}
        </EditorArgsContext.Provider>
      </div>
    </>
  );
};
