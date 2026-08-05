"use client";

import { Ref, useRef } from "react";
import sanitizeHtml from "sanitize-html";

import {
  useBlockEditor,
  useCurrentBlock,
  useDispatchAction,
  useEditorArgs,
  usePortalContext,
  useSetSelectedBlockId,
} from "@hacado/builder";
import { ArgumentsAutocomplete } from "@hacado/ui-admin";
import { mergeRefs } from "@hacado/ui/src/utils/merge-refs";
import { HeadingProps } from "./schema";
import { getStyles } from "./styles";

export function HeadingEditor({ props, style }: HeadingProps) {
  const ref = useRef<HTMLInputElement>(null);
  const args = useEditorArgs();
  const currentBlock = useCurrentBlock<HeadingProps>();
  const value = currentBlock.data?.props?.text;
  const dispatchAction = useDispatchAction();
  const setSelectedBlockId = useSetSelectedBlockId();
  const overlayProps = useBlockEditor(currentBlock.id);

  const { document } = usePortalContext();

  const styles = getStyles({ props, style });

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

  const Element = currentBlock?.data?.props?.level || "h2";

  return (
    <ArgumentsAutocomplete
      ref={mergeRefs(ref, overlayProps.ref as Ref<HTMLInputElement>)}
      args={args}
      asContentEditable
      element={Element}
      value={value ?? "Heading"}
      onChange={onChange}
      onKeyDown={handleKeyPress}
      documentElement={document}
      style={styles}
      onClick={overlayProps.onClick}
    />
  );
}
