"use client";

import {
  useBlockEditor,
  useCurrentBlock,
  useCurrentBlockId,
  useDispatchAction,
  useEditorArgs,
  usePortalContext,
  useSetSelectedBlockId,
} from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { cn } from "@hacado/ui";
import { ArgumentsAutocomplete } from "@hacado/ui-admin";
import { useRef } from "react";
import sanitizeHtml from "sanitize-html";
import { ButtonProps } from "./schema";
import { getLinkStyles, getWrapperStyles } from "./styles";

export const ButtonEditor = ({ props, style }: ButtonProps) => {
  const t = useI18n("builder");
  const ref = useRef<HTMLInputElement>(null);
  const { document } = usePortalContext();
  const wrapperStyles = getWrapperStyles({ style });
  const linkStyles = getLinkStyles({ props, style });

  const currentBlockId = useCurrentBlockId();
  const overlayProps = useBlockEditor(currentBlockId);
  const args = useEditorArgs();
  const currentBlock = useCurrentBlock<ButtonProps>();
  const dispatchAction = useDispatchAction();
  const setSelectedBlockId = useSetSelectedBlockId();

  const value = currentBlock.data?.props?.text;

  const sanitizeConf = {
    allowedTags: [],
    allowedAttributes: {},
  };

  const onChange = (value: string) => {
    dispatchAction({
      type: "set-block-data",
      value: {
        blockId: currentBlock.id,
        data: {
          ...currentBlock.data,
          props: {
            ...currentBlock.data?.props,
            text: sanitizeHtml(value, sanitizeConf),
          },
        },
      },
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    const { key } = e;
    if (key === "Enter") {
      e.preventDefault();
      ref?.current?.blur();
      setSelectedBlockId(null);
    }
  };

  return (
    <div style={wrapperStyles} {...overlayProps}>
      <ArgumentsAutocomplete
        ref={ref}
        args={args}
        asContentEditable
        element="span"
        className={cn(
          "border-0 bg-transparent focus-visible:ring-0 rounded-none h-auto p-0 border-none leading-normal md:leading-normal",
          props?.width === "full" ? "w-full" : "w-auto",
        )}
        style={{ ...linkStyles, textAlign: style?.textAlign ?? undefined }}
        value={value ?? t("emailBuilder.blocks.button.text")}
        onChange={onChange}
        onKeyDown={handleKeyPress}
        documentElement={document}
      />
    </div>
  );
};
