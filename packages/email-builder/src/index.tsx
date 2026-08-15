"use client";

import { Builder, generateId, TEditorConfiguration } from "@hacado/builder";
import { UploadedFile } from "@hacado/types";
import { EditorBlocks, RootBlock } from "./blocks";
import { ImagePropsDefaults } from "./blocks/image";
import { ReaderBlocks } from "./blocks/reader";
import { EditorBlocksSchema } from "./blocks/schema";

type EmailBuilderProps = {
  value?: TEditorConfiguration;
  onChange?: (value: TEditorConfiguration) => void;
  onIsValidChange?: (isValid: boolean) => void;
  args?: Record<string, any>;
};

const getImageBlock = (file: UploadedFile) => {
  return {
    type: "Image",
    id: generateId(),
    data: {
      ...ImagePropsDefaults,
      props: {
        ...ImagePropsDefaults.props,
        url: file.url,
        alt: file.description,
      },
    },
  };
};

export const EmailBuilder = ({
  args,
  value,
  onChange,
  onIsValidChange,
}: EmailBuilderProps) => {
  return (
    <Builder
      defaultValue={value}
      onChange={onChange}
      onIsValidChange={onIsValidChange}
      args={args}
      schemas={EditorBlocksSchema}
      editorBlocks={EditorBlocks}
      readerBlocks={ReaderBlocks}
      rootBlock={RootBlock}
      getImageBlock={getImageBlock}
    />
  );
};
