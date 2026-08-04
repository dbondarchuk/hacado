"use client";

import {
  useBlockEditor,
  useCurrentBlock,
  useDispatchAction,
  useEditorArgs,
  useIsSelectedBlock,
  usePortalContext,
  useSetSelectedBlockId,
} from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import {
  BlockStyle,
  useClassName,
  useResizeBlockStyles,
} from "@timelish/page-builder-base";
import { EditableText, RichTextValue } from "@timelish/rte-inline";
import { cn, useDebounceCallback } from "@timelish/ui";
import { useCallback, useRef } from "react";
import { InlineTextProps } from "./schema";
import { styles } from "./styles";

export function InlineTextEditor({ props, style }: InlineTextProps) {
  const t = useI18n("builder");
  const ref = useRef<HTMLInputElement>(null);
  const args = useEditorArgs();
  const currentBlock = useCurrentBlock<InlineTextProps>();
  const value = currentBlock?.data?.props?.text;
  const dispatchAction = useDispatchAction();
  const setSelectedBlockId = useSetSelectedBlockId();
  const onResize = useResizeBlockStyles();
  // const setRef = useSetCurrentBlockRef();
  const overlayProps = useBlockEditor(currentBlock.id, onResize);

  const { document } = usePortalContext();

  const isSelected = useIsSelectedBlock(currentBlock?.id);

  const sanitizeConf = {
    allowedTags: [],
    allowedAttributes: {},
  };

  const onChange = useDebounceCallback(
    (value: RichTextValue) => {
      dispatchAction({
        type: "set-block-data",
        value: {
          blockId: currentBlock.id,
          data: {
            ...currentBlock.data,
            props: {
              ...currentBlock.data?.props,
              text: value,
            },
          },
        },
      });
    },
    [currentBlock, dispatchAction],
    300,
  );

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    const { key } = e;
    if (key === "Enter") {
      e.preventDefault();
      ref?.current?.blur();
      setSelectedBlockId(null);
    }
  }, []);

  const className = useClassName();
  const base = currentBlock.base;

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        isEditor
      />
      {/* {isSelected ? (
        <EditableText
          value={value ?? "Simple text"}
          onChange={onChange}
          placeholder={t("pageBuilder.blocks.inlineText.placeholder")}
          className={cn(className, base?.className)}
          id={base?.id}
          onClick={overlayProps.onClick}
          inline={true}
          variables={args}
          documentElement={document}
          ref={overlayProps.ref}
        />
      ) : (
        <StaticText
          value={value ?? "Simple text"}
          inline={true}
          className={cn(className, base?.className)}
          id={base?.id}
          onClick={overlayProps.onClick}
          ref={overlayProps.ref}
        />
      )} */}
      <EditableText
        value={value ?? ""}
        onChange={onChange}
        placeholder={t("pageBuilder.blocks.inlineText.placeholder")}
        className={cn(className, base?.className)}
        id={base?.id}
        onClick={overlayProps.onClick}
        inline={true}
        variables={args}
        documentElement={document}
        ref={overlayProps.ref}
      />
    </>
  );
}
