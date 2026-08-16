"use client";

import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { Plate } from "@udecode/plate/react";

import { Editor, EditorContainer } from "../plate-ui/editor";
import { useCreateMarkdownEditor } from "./use-create-markdown-editor";

export type PlateMarkdownEditorProps = {
  onChange?: (value: string) => void;
  value?: string;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  usesAbsoluteUrl?: boolean;
};

export const PlateMarkdownEditor: React.FC<PlateMarkdownEditorProps> = ({
  value,
  onChange,
  style,
  className,
  disabled,
  placeholder,
  usesAbsoluteUrl,
}) => {
  const editor = useCreateMarkdownEditor(value);

  React.useEffect(() => {
    editor.tf.focus({ edge: "endEditor" });
  }, [editor]);

  return (
    <div className="min-w-0 max-w-full">
      <DndProvider backend={HTML5Backend}>
        <Plate
          editor={editor}
          onChange={({}) =>
            onChange?.(editor.api.markdown.serialize().replaceAll("<br>", "\n"))
          }
          readOnly={disabled}
        >
          <EditorContainer usesAbsoluteUrl={usesAbsoluteUrl}>
            <Editor
              variant="fullWidth"
              className={className}
              style={style}
              disabled={disabled}
              placeholder={placeholder}
            />
          </EditorContainer>

          {/* <SettingsDialog /> */}
        </Plate>
      </DndProvider>
    </div>
  );
};
