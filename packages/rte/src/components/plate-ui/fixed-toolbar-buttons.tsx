"use client";

import {
  BoldPlugin,
  CodePlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  UnderlinePlugin,
} from "@udecode/plate-basic-marks/react";
import {
  FontBackgroundColorPlugin,
  FontColorPlugin,
} from "@udecode/plate-font/react";
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  VideoPlugin,
} from "@udecode/plate-media/react";
import { useEditorReadOnly } from "@udecode/plate/react";
import {
  BaselineIcon,
  BoldIcon,
  Code2Icon,
  ItalicIcon,
  PaintBucketIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "lucide-react";

import { MoreDropdownMenu } from "./more-dropdown-menu";

import { ToolbarGroup } from "@hacado/ui";
import { AlignDropdownMenu } from "./align-dropdown-menu";
import { ColorDropdownMenu } from "./color-dropdown-menu";
import { EmojiDropdownMenu } from "./emoji-dropdown-menu";
import { FontSizeToolbarButton } from "./font-size-toolbar-button";
import { FontWeightDropdownMenu } from "./font-weight-dropdown-menu";
import { RedoToolbarButton, UndoToolbarButton } from "./history-toolbar-button";
import {
  BulletedIndentListToolbarButton,
  NumberedIndentListToolbarButton,
} from "./indent-list-toolbar-button";
import { IndentTodoToolbarButton } from "./indent-todo-toolbar-button";
import { IndentToolbarButton } from "./indent-toolbar-button";
import { InsertDropdownMenu } from "./insert-dropdown-menu";
import { LineHeightDropdownMenu } from "./line-height-dropdown-menu";
import { LinkToolbarButton } from "./link-toolbar-button";
import { MarkToolbarButton } from "./mark-toolbar-button";
import { MediaToolbarButton } from "./media-toolbar-button";
import { OutdentToolbarButton } from "./outdent-toolbar-button";
import { TableDropdownMenu } from "./table-dropdown-menu";
import { ToggleToolbarButton } from "./toggle-toolbar-button";
import { TurnIntoDropdownMenu } from "./turn-into-dropdown-menu";

export function FixedToolbarButtons({ isMarkdown }: { isMarkdown?: boolean }) {
  const readOnly = useEditorReadOnly();

  return (
    <div className="flex">
      {!readOnly && (
        <>
          <ToolbarGroup>
            <UndoToolbarButton />
            <RedoToolbarButton />
          </ToolbarGroup>
          {/* <ToolbarGroup>
            <AIToolbarButton tooltip="AI commands">
              <WandSparklesIcon />
            </AIToolbarButton>
          </ToolbarGroup> */}
          {/* <ToolbarGroup>
            <ExportToolbarButton>
              <ArrowUpToLineIcon />
            </ExportToolbarButton>

            <ImportToolbarButton />
          </ToolbarGroup> */}
          {!isMarkdown && (
            <ToolbarGroup>
              <InsertDropdownMenu />
              <TurnIntoDropdownMenu />
              <FontSizeToolbarButton />
            </ToolbarGroup>
          )}
          <ToolbarGroup>
            <MarkToolbarButton nodeType={BoldPlugin.key} tooltip="Bold (⌘+B)">
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={ItalicPlugin.key}
              tooltip="Italic (⌘+I)"
            >
              <ItalicIcon />
            </MarkToolbarButton>

            {!isMarkdown && (
              <MarkToolbarButton
                nodeType={UnderlinePlugin.key}
                tooltip="Underline (⌘+U)"
              >
                <UnderlineIcon />
              </MarkToolbarButton>
            )}

            <MarkToolbarButton
              nodeType={StrikethroughPlugin.key}
              tooltip="Strikethrough (⌘+⇧+M)"
            >
              <StrikethroughIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={CodePlugin.key} tooltip="Code (⌘+E)">
              <Code2Icon />
            </MarkToolbarButton>

            {!isMarkdown && (
              <>
                <ColorDropdownMenu
                  nodeType={FontColorPlugin.key}
                  tooltip="Text color"
                >
                  <BaselineIcon />
                </ColorDropdownMenu>

                <ColorDropdownMenu
                  nodeType={FontBackgroundColorPlugin.key}
                  tooltip="Background color"
                >
                  <PaintBucketIcon />
                </ColorDropdownMenu>

                <FontWeightDropdownMenu />
              </>
            )}
          </ToolbarGroup>
          <ToolbarGroup>
            <AlignDropdownMenu />

            <NumberedIndentListToolbarButton />
            <BulletedIndentListToolbarButton />
            {!isMarkdown && (
              <>
                <IndentTodoToolbarButton />
                <ToggleToolbarButton />
              </>
            )}
          </ToolbarGroup>
          <ToolbarGroup>
            <LinkToolbarButton />
            {!isMarkdown && <TableDropdownMenu />}
            <EmojiDropdownMenu />
          </ToolbarGroup>
          <ToolbarGroup>
            <MediaToolbarButton nodeType={ImagePlugin.key} />
            {!isMarkdown && (
              <>
                <MediaToolbarButton nodeType={VideoPlugin.key} />
                <MediaToolbarButton nodeType={AudioPlugin.key} />
                <MediaToolbarButton nodeType={FilePlugin.key} />
              </>
            )}
          </ToolbarGroup>
          {!isMarkdown && (
            <ToolbarGroup>
              <LineHeightDropdownMenu />
              <OutdentToolbarButton />
              <IndentToolbarButton />
            </ToolbarGroup>
          )}
          {!isMarkdown && (
            <ToolbarGroup>
              <MoreDropdownMenu />
            </ToolbarGroup>
          )}
        </>
      )}

      {/* <div className="grow" /> */}

      {/* <ToolbarGroup>
        <MarkToolbarButton nodeType={HighlightPlugin.key} tooltip="Highlight">
          <HighlighterIcon />
        </MarkToolbarButton>
        <CommentToolbarButton />
      </ToolbarGroup> */}

      {/* <ToolbarGroup>
        <ModeDropdownMenu />
      </ToolbarGroup> */}
    </div>
  );
}
