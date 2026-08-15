"use client";

import {
  useBlockEditor,
  useCurrentBlock,
  useDispatchAction,
  useIsCurrentBlockOverlay,
  useIsSelectedBlock,
  usePortalContext,
} from "@hacado/builder";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import { PlateEditor, PlateStaticEditor } from "@hacado/rte";
import { cn, useDebounceCallback } from "@hacado/ui";
import { TextProps } from "./schema";
import { styles } from "./styles";
import { getDefaults } from "./styles.default";

export const TextEditor = ({ props, style }: TextProps) => {
  const currentBlock = useCurrentBlock<TextProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const value = currentBlock?.data?.props?.value;
  const dispatchAction = useDispatchAction();
  const isSelected = useIsSelectedBlock(currentBlock?.id);
  const isOverlay = useIsCurrentBlockOverlay();

  const shouldShowEditor = isSelected && !isOverlay;

  const onChange = useDebounceCallback(
    (value: any) => {
      dispatchAction({
        type: "set-block-data",
        value: {
          blockId: currentBlock.id,
          data: {
            ...currentBlock.data,
            props: {
              ...currentBlock.data?.props,
              value,
            },
          },
        },
      });
    },
    [dispatchAction, currentBlock],
    300,
  );

  const className = useClassName();
  const { document } = usePortalContext();
  const defaults = getDefaults({ props, style }, true);
  const base = currentBlock?.base;

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        defaults={defaults}
        isEditor
      />
      <div
        className={cn("w-full", className, base?.className)}
        id={base?.id}
        {...overlayProps}
      >
        {shouldShowEditor ? (
          <PlateEditor
            value={value ?? []}
            onChange={onChange}
            className={cn(
              "w-full bg-transparent border-0 focus-visible:ring-0 rounded-none h-auto p-0 border-none leading-normal md:leading-normal",
              className,
              base?.className,
            )}
            document={document}
          />
        ) : (
          <PlateStaticEditor value={value ?? []} />
        )}
      </div>
    </>
  );
};
