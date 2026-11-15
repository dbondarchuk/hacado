"use client";

import {
  Builder,
  type SidebarTab,
  type ToolbarButtonInjection,
} from "@hacado/builder/builder";
import { TEditorConfiguration } from "@hacado/builder/editor";
import { generateId } from "@hacado/builder/helpers";
import { UploadedFile } from "@hacado/types/assets";
import { EditorBlocks, RootBlock } from "./blocks";
import { ImagePropsDefaults } from "./blocks/image";
import { ReaderBlocks } from "./blocks/reader";
import { EditorBlocksSchema } from "./blocks/schema";

export type { ToolbarButtonInjection, SidebarTab };

type EmailBuilderProps = {
  value?: TEditorConfiguration;
  onChange?: (value: TEditorConfiguration) => void;
  onIsValidChange?: (isValid: boolean) => void;
  args?: Record<string, any>;
  toolbarButtons?: ToolbarButtonInjection[];
  extraTabs?: SidebarTab[];
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
  toolbarButtons,
  extraTabs,
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
      toolbarButtons={toolbarButtons}
      extraTabs={extraTabs}
    />
  );
};
