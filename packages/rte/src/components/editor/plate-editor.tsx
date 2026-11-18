"use client";

import React, { forwardRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { Value } from "@udecode/plate";
import { MarkdownPlugin } from "@udecode/plate-markdown";
import { Plate } from "@udecode/plate/react";
import remarkGfm from "remark-gfm";
import { Editor, EditorContainer } from "../plate-ui/editor";
import { useCreateEditor } from "./use-create-editor";

export type PlateEditorHandle = {
  /** Deserialize markdown with the live editor plugins (tables, headings, …). */
  setMarkdown: (markdown: string) => void;
};

export type PlateEditorProps = {
  onChange?: (value: Value) => void;
  value?: Value;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  singleLine?: boolean;
  noToolbar?: boolean;
  overlayToolbar?: boolean;
  document?: Document;
  id?: string;
  usesAbsoluteUrl?: boolean;
  editorRef?: React.Ref<PlateEditorHandle | null>;
};

export const PlateEditor = forwardRef<HTMLDivElement, PlateEditorProps>(
  (
    {
      value,
      onChange,
      style,
      className,
      disabled,
      placeholder,
      singleLine,
      noToolbar,
      overlayToolbar,
      id,
      document,
      usesAbsoluteUrl,
      editorRef,
    },
    ref,
  ) => {
    const editor = useCreateEditor(value, {
      singleLine,
      noToolbar,
      overlayToolbar,
    });

    const lastSyncedValueRef = React.useRef<string>(
      JSON.stringify(value ?? []),
    );

    const isExternalSyncRef = React.useRef(false);
    const onChangeRef = React.useRef(onChange);
    onChangeRef.current = onChange;

    React.useEffect(() => {
      editor.tf.focus({ edge: "endEditor" });
    }, [editor]);

    React.useEffect(() => {
      const nextValue = value ?? [];
      const nextSerialized = JSON.stringify(nextValue);

      if (nextSerialized === lastSyncedValueRef.current) {
        return;
      }

      if (nextSerialized === JSON.stringify(editor.children)) {
        lastSyncedValueRef.current = nextSerialized;
        return;
      }

      isExternalSyncRef.current = true;
      lastSyncedValueRef.current = nextSerialized;
      editor.tf.setValue(nextValue);
      queueMicrotask(() => {
        isExternalSyncRef.current = false;
      });
    }, [editor, value]);

    React.useImperativeHandle(
      editorRef,
      () => ({
        setMarkdown(markdown: string) {
          const nodes = editor.getApi(MarkdownPlugin).markdown.deserialize(
            markdown,
            // Ensure GFM tables even if plugin defaults were overridden.
            { remarkPlugins: [remarkGfm] },
          );

          const nextValue = (Array.isArray(nodes) ? nodes : [nodes]) as Value;

          isExternalSyncRef.current = true;
          lastSyncedValueRef.current = JSON.stringify(nextValue);
          editor.tf.setValue(nextValue);
          onChangeRef.current?.(nextValue);
          queueMicrotask(() => {
            isExternalSyncRef.current = false;
          });
        },
      }),
      [editor],
    );

    return (
      <DndProvider backend={HTML5Backend} context={document?.defaultView}>
        <Plate
          editor={editor}
          onChange={({ value: nextValue }) => {
            lastSyncedValueRef.current = JSON.stringify(nextValue ?? []);

            if (isExternalSyncRef.current) {
              return;
            }

            onChange?.(nextValue);
          }}
        >
          <EditorContainer
            context={document?.defaultView}
            usesAbsoluteUrl={usesAbsoluteUrl}
            className={
              overlayToolbar
                ? "grid min-w-0 grid-cols-[minmax(0,1fr)]"
                : undefined
            }
          >
            <Editor
              ref={ref}
              variant="fullWidth"
              className={className}
              style={style}
              disabled={disabled}
              placeholder={placeholder}
              id={id}
            />
          </EditorContainer>

          {/* <SettingsDialog /> */}
        </Plate>
      </DndProvider>
    );
  },
);
